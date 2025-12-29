/**
 * @file student_fetcher.js
 * @description 1번 분석 엔진: 학생 데이터 수급 및 중앙 통제소(HQTabManager) 연동 제어
 * @version 2.2.0
 */

/**
 * @namespace StudentFetcher
 * @description 시스템 내 학생 정보를 관리하고 UI 리스트를 동적으로 생성하는 싱글톤 객체
 */
window.StudentFetcher = {
    /** @type {Array} 데이터베이스로부터 수신된 학생 객체 배열 */
    students: [],
    
    /** @type {string|null} 현재 사용자가 선택한 학생의 고유 식별자(UUID/ID) */
    selectedStudentId: null,

    /**
     * @function init
     * @description 엔진 초기화 프로세스 수행. DOM 로드 완료 후 실행 권장.
     */
    async init() {
        console.log("[Engine-1] Student Fetcher Initializing...");
        await this.loadStudentData();
    },

    /**
     * @function loadStudentData
     * @description Supabase REST API를 통해 'v_stats_student_list' 뷰에서 학생 명단을 수집
     */
    async loadStudentData() {
        try {
            // Supabase Client를 통한 비동기 데이터 쿼리 수행
            const { data, error } = await _supabase
                .from('v_stats_student_list')
                .select('*');

            if (error) throw error;

            this.students = data || [];
            this.render();
            
            console.log(`[Engine-1] Data Fetch Success. Total Records: ${this.students.length}`);
        } catch (err) {
            console.error("[Engine-1 Error] Resource Fetch Failed:", err.message);
        }
    },

    /**
     * @function render
     * @description 수집된 데이터를 기반으로 사이드바 내 인터랙티브 DOM 요소 생성 및 주입
     */
    render() {
        const container = document.getElementById('student-list');
        const countDisplay = document.getElementById('student-count');
        
        if (!container) {
            console.error("[Engine-1 Error] Target container '#student-list' not found in DOM.");
            return;
        }

        // 초기화 및 카운트 정보 갱신
        container.innerHTML = '';
        if (countDisplay) countDisplay.innerText = `${this.students.length}명 등록됨`;

        this.students.forEach(student => {
            const itemElement = document.createElement('div');
            
            // TailWind CSS 기반의 UI 아키텍처 적용
            itemElement.className = `
                student-item p-4 mb-2 flex justify-between items-center 
                cursor-pointer rounded-2xl border border-transparent 
                hover:bg-slate-50 transition-all duration-200 group
            `;

            itemElement.innerHTML = `
                <div class="flex flex-col no-drag">
                    <span class="text-sm font-black text-slate-800 tracking-tight">
                        ${student.student_name}
                    </span>
                    <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">
                        ${student.tier || 'RANKING...'}
                    </span>
                </div>
                <div class="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center 
                            text-slate-200 group-hover:text-indigo-500 transition-colors">
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </div>
            `;

            /**
             * @event onclick
             * @description 개별 학생 항목 선택 시 중앙 통제소(HQTabManager)로 명령 전달
             */
            itemElement.onclick = () => {
                this.handleSelection(student.student_id, itemElement);
            };

            container.appendChild(itemElement);
        });
    },

    /**
     * @function handleSelection
     * @param {string} studentId - 선택된 학생의 고유 ID
     * @param {HTMLElement} element - 클릭된 DOM 요소
     * @description 선택 상태 UI 갱신 및 중앙 통제소 렌더링 파이프라인 트리거
     */
    handleSelection(studentId, element) {
        // 전역 선택 상태 업데이트
        this.selectedStudentId = studentId;

        // UI 상태 동기화 (기존 선택 제거 및 신규 활성화)
        document.querySelectorAll('.student-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');

        console.log(`[Engine-1] Student Selected: ${studentId}`);

        // 중앙 통제소(HQTabManager) 존재 여부 확인 후 렌더링 명령 하달
        if (window.HQTabManager) {
            window.HQTabManager.renderActiveEngine();
        } else {
            console.warn("[Engine-1 Warning] HQTabManager is not initialized in the global scope.");
        }
    }
};

/**
 * @description DOM 로드 완료 시 엔진 초기화 실행
 */
document.addEventListener('DOMContentLoaded', () => {
    StudentFetcher.init();
});