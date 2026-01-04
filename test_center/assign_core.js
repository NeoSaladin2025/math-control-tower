/**
 * @module AssignCore
 * @version 1.6.0
 * @description 진단평가 배정 엔진 코어 - 내부/외부 스위칭 버그 수정 및 한글 주석 강화 버전
 */

window.AssignCore = {
    /**
     * @property {Object} state - 시스템 상태 관리 객체
     */
    state: {
        classId: new URLSearchParams(window.location.search).get('class_id'),
        currentType: 'internal', // 현재 활성화된 진단 모드 (internal / external)
        students: [],           // 클래스 소속 학생 명단
        selectedStudent: null,  // 현재 선택된 관리 대상 학생
        allPackages: [],        // 내부 진단용 전체 패키지 풀
        assignedPackages: [],   // 선택된 학생의 기배정 목록
        unassignedPackages: [], // 선택된 학생의 미배정 목록
        workbooks: [],          // 필터링용 교재 목록 데이터
        activeWorkbookId: null, // 현재 적용된 워크북 필터 ID
        // 리소스 스토리지 기본 URL
        storageBaseUrl: "https://uiasidzcyzdburjxtpsb.supabase.co/storage/v1/object/public/problems"
    },

    /**
     * @method init
     * @description 엔진 초기화 및 기초 데이터(학생, 패키지, 워크북) 로드
     */
    async init(container) {
        if (!this.state.classId) {
            alert("시스템 오류: Class ID 파라미터가 유효하지 않습니다.");
            return;
        }
        
        // 렌더러를 통해 전체적인 화면 레이아웃 생성
        if (window.AssignRenderer) {
            window.AssignRenderer.renderBase(container);
        }

        try {
            // 학생 목록, 교재 목록, 패키지 목록을 병렬로 한꺼번에 가져옴 (속도 최적화)
            const [logicRes, userRes, pkgRes, wbRes] = await Promise.all([
                _supabase.from('assignment_and_class_logic').select('*'),
                _supabase.from('users').select('username, name, grade'),
                _supabase.from('diagnostic_packages').select('*, workbooks(id, title)').order('created_at', { ascending: false }),
                _supabase.from('workbooks').select('id, title').order('title')
            ]);

            // 현재 클래스 ID에 소속된 학생들만 골라내는 필터링 로직
            const enrolled = logicRes.data.filter(l => {
                let settings = [];
                try { settings = typeof l.class_settings === 'string' ? JSON.parse(l.class_settings) : l.class_settings; } catch(e) {}
                return Array.isArray(settings) && settings.some(s => String(s.class_id) === String(this.state.classId));
            });

            // 학생 정보를 쓰기 편하게 가공하여 상태값에 저장
            this.state.students = enrolled.map(l => {
                const u = userRes.data.find(x => x.username === l.student_id);
                return { id: String(l.student_id), name: u?.name || l.student_id, grade: u?.grade || "-" };
            });

            this.state.allPackages = pkgRes.data || [];
            this.state.workbooks = wbRes.data || [];

            // 왼쪽 학생 목록과 교재 필터 UI를 그림
            window.AssignRenderer.renderStudentList(this.state.students);
            window.AssignRenderer.renderWorkbookFilters(this.state.workbooks, null);

        } catch (error) {
            console.error("[AssignCore] 초기 데이터 동기화 실패:", error);
        }
    },

    /**
     * @method switchType
     * @description 내부/외부 진단 모드 전환 시 UI가 깨지지 않게 보장하는 핵심 함수
     */
    async switchType(type) {
        // 동일한 탭을 눌렀을 경우 아무 작업도 하지 않음
        if (this.state.currentType === type) return;

        this.state.currentType = type;
        
        // 상단 탭 버튼의 활성화 스타일 업데이트 (색상 등)
        window.AssignRenderer.updateTabUI(type);
        
        const container = document.getElementById('main-content-area');
        if (!container) return;

        // [버그 수정 핵심] 기존에 그려진 내용을 깨끗이 비움
        container.innerHTML = "";

        if (type === 'external') {
            // 외부 진단 모드일 때: 학생이 선택되어 있다면 바로 외부 엔진 구동
            if (this.state.selectedStudent) {
                this.selectStudent(this.state.selectedStudent.id);
            } else {
                // 학생 선택 전이면 외부 모드용 텅 빈 화면 표시
                container.innerHTML = `<div class="flex-1 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs italic">Select a student for External Diagnostic</div>`;
            }
        } else {
            // 내부 진단 모드로 돌아올 때: 
            // 1. 내부 진단용 좌우 리스트 뼈대를 다시 그려줌 (이게 없으면 화면이 바보됨)
            window.AssignRenderer.renderInternalBase(container);
            
            // 2. 학생이 선택된 상태였다면 해당 학생의 내부 진단 배정 이력을 즉시 로드
            if (this.state.selectedStudent) {
                await this.loadStudentAssignments(this.state.selectedStudent.id);
            } else {
                // 학생 선택 전이면 내부 모드용 텅 빈 화면 표시
                window.AssignRenderer.renderEmptyState();
            }
        }
    },

    /**
     * @method selectStudent
     * @description 사이드바에서 학생 클릭 시 실행되는 함수
     */
    async selectStudent(studentId) {
        const targetId = String(studentId);
        const student = this.state.students.find(s => s.id === targetId);
        if (!student) return;

        this.state.selectedStudent = student;
        
        // 선택된 학생의 배경색을 바꾸는 등 UI 효과 부여
        window.AssignRenderer.updateStudentSelection(targetId);

        // 현재 모드가 외부 진단인 경우: 외부 엔진 스크립트를 동적으로 로드하고 초기화
        if (this.state.currentType !== 'internal') {
            const container = document.getElementById('main-content-area'); 
            container.innerHTML = `
                <div class="flex-1 flex items-center justify-center bg-slate-50/50">
                    <div class="text-center">
                        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-rose-400 mb-3"></i>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Engine Initializing...</p>
                    </div>
                </div>`;
            
            try {
                // 외부 배정용 JS 파일들을 실시간으로 불러옴
                await Promise.all([
                    this.injectScript(`test_center/assign_ext_core.js`),
                    this.injectScript(`test_center/assign_ext_renderer.js`)
                ]);

                // 파일 로드 후 객체가 생성될 때까지 아주 잠깐 대기 후 초기화 실행
                setTimeout(() => {
                    if (window.AssignExtCore && window.AssignExtCore.init) {
                        window.AssignExtCore.init(container, this.state.selectedStudent);
                    } else {
                        throw new Error("AssignExtCore 객체 초기화 실패");
                    }
                }, 150);
            } catch (e) {
                console.error("[AssignCore] 외부 모듈 로드 실패:", e);
                container.innerHTML = `<div class="p-10 text-rose-500 font-black text-center text-xs uppercase">Runtime Error: External Engine Failed to Load</div>`;
            }
            return;
        }

        // 현재 모드가 내부 진단인 경우: 학생의 배정 데이터를 불러와서 목록을 채움
        await this.loadStudentAssignments(targetId);
    },

    /**
     * @method loadStudentAssignments
     * @description [내부 전용] 특정 학생의 배정 이력을 조회하여 기배정/미배정 리스트로 분류
     */
    async loadStudentAssignments(targetId) {
        try {
            const { data: history } = await _supabase
                .from('student_assignments')
                .select('package_id, status')
                .eq('student_id', targetId);

            // 배정 상태가 'assigned'인 것들만 추려냄
            const activeIds = new Set(history.filter(h => h.status === 'assigned').map(h => h.package_id));
            const allAssignedIds = new Set(history.map(h => h.package_id));

            // 전체 패키지 풀에서 기배정된 것과 한 번도 안 한 것을 나눔
            this.state.assignedPackages = this.state.allPackages.filter(p => activeIds.has(p.id));
            this.state.unassignedPackages = this.state.allPackages.filter(p => !allAssignedIds.has(p.id));

            // 필터링 규칙에 맞춰 화면에 그려줌
            this.refreshLists();
        } catch (error) {
            console.error("[AssignCore] 내부 배정 이력 조회 실패:", error);
        }
    },

    /**
     * @method injectScript
     * @description 실시간으로 필요한 자바스크립트 파일을 HTML 헤더에 삽입 (캐시 방지 포함)
     */
    injectScript(src) {
        return new Promise((resolve, reject) => {
            const oldScript = document.querySelector(`script[src^="${src}"]`);
            if (oldScript) oldScript.remove();

            const script = document.createElement('script');
            script.src = `${src}?v=${Date.now()}`; // 매번 새로운 파일을 받도록 캐시 무시 쿼리 추가
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    },

    /**
     * @method getQuestionImageUrl
     * @description 문제 이미지가 들어있는 서버 경로 생성
     */
    getQuestionImageUrl(workbookId, pNum) {
        const paddedNum = String(pNum).padStart(4, '0');
        return `${this.state.storageBaseUrl}/${workbookId}/${paddedNum}.webp`;
    },

    /**
     * @method previewPackage
     * @description 내부 진단 시험지 안에 어떤 문제가 있는지 미리보기 팝업 실행
     */
    async previewPackage(packageId) {
        if (!this.state.selectedStudent) {
            alert("먼저 배정 대상 학생을 선택해 주십시오");
            return;
        }

        try {
            const { data: pool, error } = await _supabase
                .from('v_package_candidate_questions')
                .select('*')
                .eq('package_id', packageId);

            if (error) throw error;
            if (!pool || pool.length === 0) return alert("해당 패키지에 문항 정보가 없습니다.");

            const chapters = [...new Set(pool.map(p => p.chapter_minor))];
            let finalQuestions = [];

            // 패키지 설정에 맞춰 문제를 랜덤 혹은 순서대로 뽑아냄
            chapters.forEach(cId => {
                const cPool = pool.filter(p => p.chapter_minor === cId);
                const rule = cPool[0];

                const pick = (list, count, order) => {
                    const temp = [...list];
                    if (order === 'random') temp.sort(() => Math.random() - 0.5);
                    else temp.sort((a, b) => a.problem_num - b.problem_num);
                    return temp.slice(0, count);
                };

                const normalCandidates = cPool.filter(q => q.difficulty === 'normal' && !q.is_subjective);
                finalQuestions.push(...pick(normalCandidates, rule.count_normal * 2, rule.order_normal));

                const subjCandidates = cPool.filter(q => q.is_subjective);
                finalQuestions.push(...pick(subjCandidates, rule.count_subjective, rule.order_subjective));

                const highCandidates = cPool.filter(q => q.difficulty === 'high_rank');
                finalQuestions.push(...pick(highCandidates, rule.count_high, rule.order_high));
            });

            // 뽑힌 문제들의 이미지 URL 생성
            const imageData = finalQuestions.map(q => ({
                qNum: q.problem_num,
                title: `${q.chapter_title_ko} - ${q.problem_num}번`,
                url: this.getQuestionImageUrl(q.workbook_id, q.problem_num)
            }));

            // 렌더러를 통해 팝업창 띄움
            window.AssignRenderer.openImageModal({
                studentName: this.state.selectedStudent.name,
                packageTitle: pool[0].package_title,
                images: imageData
            });

        } catch (error) {
            console.error("[AssignCore] 미리보기 선별 실패:", error);
        }
    },

    /**
     * @method filterByWorkbook
     * @description 교재별로 패키지 목록 필터링
     */
    filterByWorkbook(workbookId) {
        this.state.activeWorkbookId = workbookId;
        window.AssignRenderer.renderWorkbookFilters(this.state.workbooks, workbookId);
        this.refreshLists();
    },

    /**
     * @method refreshLists
     * @description [내부 전용] 필터 조건에 맞게 배정 리스트 UI를 다시 그림
     */
    refreshLists() {
        if (this.state.currentType !== 'internal') return;
        
        let filtered = this.state.unassignedPackages;
        if (this.state.activeWorkbookId !== null) {
            filtered = filtered.filter(p => p.workbook_id === this.state.activeWorkbookId);
        }
        window.AssignRenderer.renderSplitLists(this.state.assignedPackages, filtered);
    },

    /**
     * @method assignAction
     * @description [내부 전용] 선택한 패키지를 학생에게 실제로 배정 (DB Insert)
     */
    async assignAction(packageId) {
        if (this.state.currentType !== 'internal') return;
        if (!this.state.selectedStudent) return alert("먼저 학생을 선택해 주십시오.");

        try {
            const { error } = await _supabase
                .from('student_assignments')
                .insert({
                    student_id: this.state.selectedStudent.id,
                    package_id: packageId,
                    status: 'assigned'
                });

            if (error) throw error;

            // 로컬 리스트에서 항목 이동 (새로고침 없이 즉시 반영을 위함)
            const idx = this.state.unassignedPackages.findIndex(p => p.id === packageId);
            if (idx > -1) {
                const moved = this.state.unassignedPackages.splice(idx, 1)[0];
                this.state.assignedPackages.unshift(moved);
            }
            this.refreshLists();
        } catch (error) {
            alert("배정 중 오류 발생: " + error.message);
        }
    },

    /**
     * @method removeAssignmentAction
     * @description [내부 전용] 배정된 패키지를 다시 취소 (DB Delete)
     */
    async removeAssignmentAction(packageId) {
        if (this.state.currentType !== 'internal') return;
        if (!this.state.selectedStudent) return;
        
        if (!confirm("정말 배정을 취소하시겠습니까? 학생 화면에서도 즉시 사라집니다. ")) return;

        try {
            const { error } = await _supabase
                .from('student_assignments')
                .delete()
                .eq('student_id', this.state.selectedStudent.id)
                .eq('package_id', packageId)
                .eq('status', 'assigned');

            if (error) throw error;

            // 로컬 리스트에서 항목 이동 (새로고침 없이 즉시 반영을 위함)
            const idx = this.state.assignedPackages.findIndex(p => p.id === packageId);
            if (idx > -1) {
                const moved = this.state.assignedPackages.splice(idx, 1)[0];
                this.state.unassignedPackages.unshift(moved);
            }
            this.refreshLists();
        } catch (error) {
            console.error("배정 취소 실패:", error);
        }
    }
};