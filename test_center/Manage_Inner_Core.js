/**
 * @module ManageInnerCore
 * @description 내부/외부 엔진 스위칭 및 무한 로딩 방지 로직 탑재
 */

window.ManageInnerCore = {
    state: {
        classId: null,
        currentMode: 'internal',
        students: [],
        selectedStudent: null,
        testResults: []
    },

    /**
     * @method init
     */
    async init(container) {
        const urlParams = new URLSearchParams(window.location.search);
        this.state.classId = urlParams.get('class_id');
        window.ManageInnerRenderer.renderBase(container);
        await this.fetchStudents();
    },

    /**
     * @method switchMode
     * @description [수정] 무한 로딩 방지 및 안전한 스크립트 주입
     */
    async switchMode(mode) {
        if (this.state.currentMode === mode && document.getElementById('result-grid')) return;
        
        this.state.currentMode = mode;
        window.ManageInnerRenderer.updateTabUI(mode);

        const container = document.getElementById('content-area');
        if (!container) return;

        if (mode === 'external') {
            // 1. 로딩 화면 표시
            container.innerHTML = `
                <div id="ext-loading-view" class="h-full flex flex-col items-center justify-center text-slate-300 animate-fadeIn">
                    <i class="fa-solid fa-gear fa-spin text-4xl mb-4 text-rose-400"></i>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">외부 엔진 로딩 중...</p>
                </div>`;

            try {
                // 2. 스크립트 주입 (경로 주의: 현재 폴더 기준 혹은 상대 경로)
                // 만약 파일이 같은 폴더에 있다면 'manage_ext_core.js'로 수정 필요
                await Promise.all([
                    ManageInnerCore.injectScript(`test_center/manage_ext_core.js`),
                    ManageInnerCore.injectScript(`test_center/manage_ext_renderer.js`)
                ]);

                // 3. 주입 완료 후 초기화 실행 (약간의 대기시간으로 안정성 확보)
                setTimeout(() => {
                    if (window.ManageExtCore && window.ManageExtCore.init) {
                        window.ManageExtCore.init(container, this.state.selectedStudent);
                    } else {
                        throw new Error("외부 모듈(ManageExtCore)을 찾을 수 없습니다.");
                    }
                }, 200);

            } catch (e) {
                console.error("[CORE] 외부 엔진 로드 에러:", e);
                container.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-rose-400 p-10 text-center">
                        <i class="fa-solid fa-triangle-exclamation text-3xl mb-4"></i>
                        <p class="text-xs font-black uppercase">엔진 로드 실패</p>
                        <p class="text-[10px] mt-2 opacity-70">${e.message}</p>
                        <button onclick="ManageInnerCore.switchMode('internal')" class="mt-4 px-4 py-2 bg-slate-800 text-white text-[10px] rounded-lg">내부 진단으로 복귀</button>
                    </div>`;
            }
        } else {
            // 내부 모드 복구
            container.innerHTML = `
                <div id="welcome-view" class="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <i class="fa-solid fa-arrow-left text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-400 text-sm font-black">좌측에서 학생을 선택해주세요.</p>
                </div>
                <div id="result-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"></div>`;
            
            if (this.state.selectedStudent) {
                this.loadStudentResults(this.state.selectedStudent.id);
            }
        }
    },

    /**
     * @method injectScript
     * @description [수정] 캐시를 방지하고 확실하게 로드 확인
     */
    injectScript(src) {
        return new Promise((resolve, reject) => {
            // 이미 로드된 스크립트인지 확인
            const existing = document.querySelector(`script[src^="${src}"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `${src}?v=${Date.now()}`; // 런타임 캐시 방지
            script.async = true;
            script.onload = () => {
                console.log(`[SYSTEM] 스크립트 로드 완료: ${src}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`파일을 찾을 수 없습니다: ${src}`));
            document.body.appendChild(script);
        });
    },

    /**
     * @method fetchStudents
     */
    async fetchStudents() {
        if (!this.state.classId) return;
        try {
            const [logicRes, userRes] = await Promise.all([
                _supabase.from('assignment_and_class_logic').select('*'),
                _supabase.from('users').select('username, name, grade')
            ]);
            const enrolled = logicRes.data.filter(l => {
                let settings = [];
                try { settings = typeof l.class_settings === 'string' ? JSON.parse(l.class_settings) : l.class_settings; } catch(e) { return false; }
                return Array.isArray(settings) && settings.some(s => String(s.class_id) === String(this.state.classId));
            });
            this.state.students = enrolled.map(l => {
                const u = userRes.data.find(x => x.username === l.student_id);
                return { id: String(l.student_id), name: u?.name || l.student_id, grade: u?.grade || "-" };
            });
            window.ManageInnerRenderer.renderStudentList(this.state.students);
        } catch (error) {
            console.error("[CORE] 학생 목록 로드 실패:", error);
        }
    },

    /**
     * @method loadStudentResults
     */
    async loadStudentResults(studentId) {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return;
        this.state.selectedStudent = student;
        window.ManageInnerRenderer.updateHeader(student.name);

        if (this.state.currentMode === 'external') {
            if (window.ManageExtCore) window.ManageExtCore.loadStudentResults(studentId);
            return;
        }

        try {
            const { data, error } = await _supabase
                .from('student_assignments')
                .select('*, diagnostic_packages!inner(title, type)')
                .eq('student_id', studentId)
                .eq('diagnostic_packages.type', 'internal')
                .in('status', ['completed', 'pass', 'fail'])
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            this.state.testResults = data || [];
            window.ManageInnerRenderer.renderResultGrid(this.state.testResults);
        } catch (error) {
            console.error("[CORE] 결과 로드 실패:", error);
        }
    },

    /**
     * @method updateTestStatus
     */
    async updateTestStatus(assignmentId, newStatus) {
        if (!confirm(`${newStatus.toUpperCase()} 처리하시겠습니까?`)) return;
        try {
            const { data, error } = await _supabase
                .from('student_assignments')
                .update({ status: newStatus, pass_at: newStatus === 'pass' ? new Date().toISOString() : null })
                .eq('id', assignmentId)
                .select();
            if (error) throw error;
            const target = this.state.testResults.find(r => r.id === assignmentId);
            if (target && data.length > 0) {
                target.status = data[0].status;
                target.pass_at = data[0].pass_at;
            }
            window.ManageInnerRenderer.renderResultGrid(this.state.testResults);
        } catch (error) {
            alert("업데이트 실패: " + error.message);
        }
    },

    /**
     * @method resetForRetake
     */
    async resetForRetake(assignmentId) {
        if (!confirm("재응시 처리하시겠습니까?")) return;
        try {
            const { error } = await _supabase
                .from('student_assignments')
                .update({ status: 'assigned', score: null, student_answers: null, pass_at: null, assigned_at: new Date().toISOString() })
                .eq('id', assignmentId);
            if (error) throw error;
            this.state.testResults = this.state.testResults.filter(r => r.id !== assignmentId);
            window.ManageInnerRenderer.renderResultGrid(this.state.testResults);
        } catch (error) {
            console.error("리셋 실패:", error);
        }
    }
};