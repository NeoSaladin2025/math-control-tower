/**
 * @module MakerExtRenderer
 * @version 1.0.0
 * @description 외부 진단평가(회차형) 작성 UI 렌더러 - 동적 회차 추가 및 데이터 바인딩
 */

window.MakerExtRenderer = {
    /**
     * @method renderBase
     * @description 외부 엔진의 기본 레이아웃 구성 (제목 입력 및 회차 추가 컨트롤)
     */
    renderBase(container) {
        container.innerHTML = `
            <div class="flex flex-col h-full bg-slate-50 font-sans select-none animate-fadeIn">
                <div class="p-5 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between shrink-0 z-20">
                    <div class="flex-1 max-w-2xl">
                        <div class="relative group">
                            <i class="fa-solid fa-earth-asia absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors"></i>
                            <input type="text" id="input-ext-package-title" 
                                   placeholder="외부 진단평가 명칭을 입력해 주세요 (예: 2025 수능 특강 변형 패키지)"
                                   class="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black focus:ring-4 focus:ring-rose-50 focus:border-rose-500 outline-none transition-all placeholder-slate-300">
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <button onclick="MakerExtCore.addRound()" 
                                class="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> 회차 추가
                        </button>
                        <button id="btn-save-ext" 
                                onclick="MakerExtCore.saveExternalPackage()" 
                                class="relative px-10 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl flex items-center gap-3 disabled:bg-slate-400">
                            <span id="btn-ext-text" class="flex items-center gap-2">
                                <i class="fa-solid fa-box-archive"></i> 패키지 생성 및 저장
                            </span>
                            <div id="btn-ext-loader" class="hidden absolute inset-0 flex items-center justify-center bg-rose-600 rounded-2xl">
                                <i class="fa-solid fa-circle-notch fa-spin text-xl"></i>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-8 pro-scroll">
                    <div class="max-w-4xl mx-auto">
                        <div id="ext-rounds-container" class="space-y-4 pb-20">
                            <div id="empty-hint" class="py-20 text-center opacity-40">
                                <i class="fa-solid fa-layer-group text-6xl text-slate-200 mb-4"></i>
                                <p class="font-black text-slate-400 italic">상단의 '회차 추가' 버튼을 눌러 평가 구성을 시작하십시오.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * @method createRoundDOM
     * @description 개별 회차 입력 필드를 생성하여 DOM 객체로 반환
     */
    createRoundDOM(roundIndex) {
        const div = document.createElement('div');
        div.className = "round-item group p-6 bg-white border border-slate-200 rounded-[28px] shadow-sm hover:shadow-md transition-all animate-fadeIn flex items-center gap-6";
        div.innerHTML = `
            <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                <span class="text-xl font-black text-slate-400 group-hover:text-rose-600 font-mono">${roundIndex}</span>
            </div>
            <div class="flex-1">
                <input type="text" placeholder="${roundIndex}회차의 상세 내용을 입력하십시오." 
                       class="round-content-input w-full bg-transparent border-none text-lg font-bold text-slate-700 outline-none placeholder-slate-200">
            </div>
            <button onclick="this.closest('.round-item').remove(); MakerExtRenderer.refreshRoundNumbers();" 
                    class="p-4 text-slate-200 hover:text-rose-500 transition-colors">
                <i class="fa-solid fa-trash-can text-xl"></i>
            </button>
        `;
        return div;
    },

    /**
     * @method refreshRoundNumbers
     * @description 회차 삭제 시 UI 상의 순번을 1부터 다시 정렬하여 사용자 혼선 방지
     */
    refreshRoundNumbers() {
        const items = document.querySelectorAll('.round-item');
        const hint = document.getElementById('empty-hint');
        
        // 회차가 모두 삭제된 경우 안내 메시지 다시 표시
        if (items.length === 0 && hint) {
            hint.classList.remove('hidden');
        }
        
        // 현재 남아있는 요소들을 순회하며 인덱스 재부여
        items.forEach((item, idx) => {
            item.querySelector('span').innerText = idx + 1;
        });
    },

    /**
     * @method setLoading
     * @description 비동기 저장 통신 시 버튼 비활성화 및 로더 노출 처리
     */
    setLoading(isLoading) {
        const btn = document.getElementById('btn-save-ext');
        const text = document.getElementById('btn-ext-text');
        const loader = document.getElementById('btn-ext-loader');
        
        if (isLoading) {
            btn.disabled = true;
            text.classList.add('opacity-0');
            loader.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('opacity-0');
            loader.classList.add('hidden');
        }
    }
};