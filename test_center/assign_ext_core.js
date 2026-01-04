/**
 * @module AssignExtCore
 * @version 1.1.0
 * @description 외부 진단평가 전용 배정 로직 - 난이도(ext_info) 데이터 바인딩 및 배정 실행
 */

window.AssignExtCore = {
    /**
     * @property {Object} state - 외부 배정 모듈 상태 관리
     */
    state: {
        selectedStudent: null,   // 현재 선택된 배정 대상 학생 정보
        externalPackages: [],    // DB에서 로드된 외부 패키지(type='external') 목록
        assignedPackageIds: new Set() // 현재 학생에게 이미 배정된 패키지 ID 집합
    },

    /**
     * @method init
     * @description 외부 배정 엔진 초기 구동 및 데이터 로드 프로세스 시작
     */
    async init(container, student) {
        // 1. 상태 전이: 부모(AssignCore)로부터 선택된 학생 정보 수신
        this.state.selectedStudent = student;
        
        // 2. 외부 전용 렌더러 호출 (기본 레이아웃 구성)
        if (window.AssignExtRenderer) {
            window.AssignExtRenderer.renderBase(container);
        }

        // 3. 데이터 동기화 시작 (패키지 목록 및 배정 이력)
        await this.loadExternalData();
    },

    /**
     * @method loadExternalData
     * @description 외부 패키지 목록 및 해당 학생의 배정 이력을 병렬로 로드
     */
    async loadExternalData() {
        if (!this.state.selectedStudent) return;

        try {
            // 패키지 리스트와 학생 배정 이력을 동시 호출하여 응답성 확보
            const [pkgRes, assignRes] = await Promise.all([
                _supabase.from('diagnostic_packages')
                    .select('*')
                    .eq('type', 'external')
                    .order('created_at', { ascending: false }),
                _supabase.from('student_assignments')
                    .select('package_id')
                    .eq('student_id', this.state.selectedStudent.id)
                    .eq('status', 'assigned')
            ]);

            if (pkgRes.error) throw pkgRes.error;
            if (assignRes.error) throw assignRes.error;

            this.state.externalPackages = pkgRes.data || [];
            
            // 배정된 ID들을 Set으로 변환하여 검색 효율 최적화
            this.state.assignedPackageIds = new Set(assignRes.data.map(a => a.package_id));

            // 데이터 분배 및 UI 갱신 호출
            this.refreshExternalLists();

        } catch (e) {
            console.error("[AssignExtCore] 데이터 로드 실패:", e);
            alert("외부 데이터 동기화 중 오류가 발생했습니다.");
        }
    },

    /**
     * @method refreshExternalLists
     * @description 기배정/미배정 상태를 구분하여 렌더러에 데이터 전달
     */
    refreshExternalLists() {
        const assigned = this.state.externalPackages.filter(p => this.state.assignedPackageIds.has(p.id));
        const unassigned = this.state.externalPackages.filter(p => !this.state.assignedPackageIds.has(p.id));

        if (window.AssignExtRenderer) {
            window.AssignExtRenderer.renderSplitLists(assigned, unassigned);
        }
    },

    /**
     * @method assignAction
     * @description 선택된 외부 패키지를 난이도 정보와 함께 학생에게 배정
     * @param {number} packageId - 배정할 패키지 고유 ID
     * @param {string} difficulty - 선택된 난이도 (low, mid-low, mid, high)
     */
    async assignAction(packageId, difficulty) {
        if (!this.state.selectedStudent) return alert("학생을 먼저 선택해 주십시오.");
        if (!difficulty) return alert("난이도를 선택해 주십시오.");

        try {
            // [핵심] 신규 생성한 ext_info(JSONB) 컬럼에 난이도 정보 매핑
            const { error } = await _supabase
                .from('student_assignments')
                .insert({
                    student_id: this.state.selectedStudent.id,
                    package_id: packageId,
                    status: 'assigned',
                    ext_info: { difficulty: difficulty } // 마법의 보따리에 난이도 수납
                });

            if (error) throw error;

            // 로컬 상태 갱신 및 리스트 리로드
            this.state.assignedPackageIds.add(packageId);
            this.refreshExternalLists();

            console.log(`[AssignExtCore] 패키지 ${packageId} 배정 완료 (난이도: ${difficulty})`);

        } catch (e) {
            console.error("[AssignExtCore] 배정 실패:", e);
            alert("배정 처리 중 오류가 발생했습니다.");
        }
    },

    /**
     * @method removeAssignmentAction
     * @description 기존에 배정된 외부 패키지 취소 (데이터 삭제)
     */
    async removeAssignmentAction(packageId) {
        if (!confirm("해당 외부 진단 배정을 취소하시겠습니까?")) return;

        try {
            const { error } = await _supabase
                .from('student_assignments')
                .delete()
                .eq('student_id', this.state.selectedStudent.id)
                .eq('package_id', packageId)
                .eq('status', 'assigned');

            if (error) throw error;

            // 로컬 상태에서 제거 및 UI 갱신
            this.state.assignedPackageIds.delete(packageId);
            this.refreshExternalLists();

        } catch (e) {
            console.error("[AssignExtCore] 취소 실패:", e);
        }
    }
};