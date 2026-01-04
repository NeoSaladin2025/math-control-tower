/**
 * @module MakerRenderer
 * @version 8.2.0
 * @description 진단평가 작성 UI 렌더러 - 제목 입력 필드 및 동적 레이아웃 제어
 */

window.MakerRenderer = {
    /**
     * 전체 레이아웃 렌더링 (제목 입력란 추가)
     */
    renderBase(container) {
        container.innerHTML = `
            <div class="flex flex-col h-full bg-slate-50 font-sans select-none animate-fadeIn">
                <div class="p-5 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between shrink-0 z-20">
                    <div class="flex gap-6 items-center">
                        <div class="flex flex-col items-center px-4 border-r border-slate-100">
                            <span class="text-[9px] font-black text-indigo-500 uppercase mb-1">일반(세트)</span>
                            <span id="summary-normal-sets" class="text-xl font-black text-slate-800 font-mono">0</span>
                        </div>
                        <div class="flex flex-col items-center px-4 border-r border-slate-100">
                            <span class="text-[9px] font-black text-emerald-500 uppercase mb-1">서술형</span>
                            <span id="summary-subjective" class="text-xl font-black text-slate-800 font-mono">0</span>
                        </div>
                        <div class="flex flex-col items-center px-4 border-r border-slate-100">
                            <span class="text-[9px] font-black text-purple-500 uppercase mb-1">1등급</span>
                            <span id="summary-high" class="text-xl font-black text-slate-800 font-mono">0</span>
                        </div>
                        <div class="flex flex-col items-center px-5 bg-slate-900 rounded-xl py-1.5 shadow-lg ring-1 ring-white/10">
                            <span class="text-[9px] font-black text-indigo-300 uppercase mb-0.5">총 문항 수</span>
                            <span id="summary-total-problems" class="text-2xl font-black text-white font-mono">0</span>
                        </div>
                    </div>

                    <div class="flex-1 max-w-md px-10">
                        <div class="relative group">
                            <i class="fa-solid fa-file-signature absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
                            <input type="text" id="input-package-title" 
                                   placeholder="진단평가 명칭을 입력하세요 (예: 2024 기말대비 모의고사)"
                                   class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder-slate-300">
                        </div>
                    </div>

                    <div class="flex items-center">
                        <button id="btn-generate-package" 
                                onclick="MakerCore.generatePackage()" 
                                class="relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 disabled:bg-slate-400">
                            <span id="btn-text" class="flex items-center gap-2">
                                <i class="fa-solid fa-cloud-arrow-up"></i> 저장 및 생성
                            </span>
                            <div id="btn-loader" class="hidden absolute inset-0 flex items-center justify-center bg-indigo-600">
                                <i class="fa-solid fa-circle-notch fa-spin text-xl"></i>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="flex-1 flex min-h-0">
                    <div id="unit-selector" class="w-[45%] p-6 overflow-y-auto border-r border-slate-100 bg-white pro-scroll">
                        <h3 class="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest sticky top-0 bg-white py-2 z-10 flex items-center justify-between border-b border-slate-50">
                            <span>1. 출제 단원 선택</span>
                            <span id="label-workbook-title" class="text-[10px] text-indigo-500 font-bold"></span>
                        </h3>
                        <div id="unit-list-container" class="space-y-3 pb-10"></div>
                    </div>

                    <div id="input-editor" class="w-[55%] p-6 overflow-y-auto bg-slate-50/50 pro-scroll relative">
                        <h3 class="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest sticky top-0 bg-slate-50/50 py-2 z-10 backdrop-blur-sm border-b border-slate-100/50">
                            2. 유형별 수량 및 정렬 설정
                        </h3>
                        <div id="selected-inputs-container" class="space-y-4 pb-10"></div>
                    </div>
                </div>
            </div>
        `;
    },

    setSaveLoading(isLoading) {
        const btn = document.getElementById('btn-generate-package');
        const text = document.getElementById('btn-text');
        const loader = document.getElementById('btn-loader');
        if (isLoading) {
            btn.disabled = true;
            text.classList.add('opacity-0');
            loader.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('opacity-0');
            loader.classList.add('hidden');
        }
    },

    renderWorkbookList(workbooks) {
        const list = document.getElementById('side-list');
        if (!list) return;
        list.innerHTML = workbooks.map(wb => `
            <div onclick="MakerCore.loadUnits(${wb.id})" class="p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-500 mb-2 transition-all group overflow-hidden">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[9px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">${wb.grade_level}</span>
                    <i class="fa-solid fa-arrow-right-long text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"></i>
                </div>
                <p class="text-sm font-black text-slate-700 group-hover:text-indigo-600 truncate">${wb.title}</p>
                <div class="mt-2 flex items-center gap-1">
                    <div class="w-1 h-1 rounded-full bg-indigo-400"></div>
                    <span class="text-[10px] text-slate-400 font-mono">DB: ${wb.total_problems}개</span>
                </div>
            </div>
        `).join('');
    },

    renderUnitList(units) {
        const container = document.getElementById('unit-list-container');
        const titleLabel = document.getElementById('label-workbook-title');
        if (titleLabel) titleLabel.innerText = units[0]?.workbook_title || "";

        container.innerHTML = units.map(u => `
            <label class="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50/30 transition-all has-[:checked]:border-indigo-600 has-[:checked]:ring-2 has-[:checked]:ring-indigo-100 shadow-sm group">
                <div class="mt-1">
                    <input type="checkbox" class="w-5 h-5 rounded-md border-slate-300 text-indigo-600" 
                           onchange="MakerCore.toggleUnitSelection(${JSON.stringify(u).replace(/"/g, '&quot;')}, this.checked)">
                </div>
                <div class="flex-1">
                    <span class="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase">${u.chapter_major_title_ko}</span>
                    <span class="text-sm font-black text-slate-800 block group-hover:text-indigo-600 transition-colors">${u.chapter_minor}. ${u.chapter_title_ko}</span>
                    <div class="flex gap-2 mt-3">
                        <span class="text-[9px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black border border-indigo-100">일반 ${u.inventory.normal}</span>
                        <span class="text-[9px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black border border-emerald-100">서술 ${u.inventory.subjective}</span>
                        <span class="text-[9px] px-2 py-1 bg-purple-50 text-purple-600 rounded-lg font-black border border-purple-100">1등급 ${u.inventory.high_rank}</span>
                    </div>
                </div>
            </label>
        `).join('');
    },

    renderInputFields(selectedItems) {
        const container = document.getElementById('selected-inputs-container');
        if (selectedItems.length === 0) {
            container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-slate-300 mt-24 opacity-60"><p class="text-sm font-black">단원을 체크하면 상세 설정이 활성화됩니다</p></div>`;
            return;
        }

        const createOrderToggle = (minorId, type, currentOrder, activeColor) => {
            const isSeq = currentOrder === 'sequential';
            const activeClass = `bg-${activeColor}-600 text-white shadow-md ring-2 ring-${activeColor}-200`;
            const inactiveClass = `text-slate-400 hover:text-slate-600 hover:bg-slate-200/50`;
            return `
                <div class="flex bg-slate-200/50 rounded-xl p-1 border border-slate-200 mt-3">
                    <button onclick="MakerCore.updateUnitOrder(${minorId}, '${type}', 'sequential')" class="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${isSeq ? activeClass : inactiveClass}">순서출제</button>
                    <button onclick="MakerCore.updateUnitOrder(${minorId}, '${type}', 'random')" class="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isSeq ? activeClass : inactiveClass}">무작위</button>
                </div>`;
        };

        container.innerHTML = selectedItems.map(item => {
            const u = item.unit;
            return `
            <div class="p-6 bg-white border border-slate-200 rounded-[24px] shadow-sm animate-fadeIn relative group overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="mb-5 pb-3 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">${u.chapter_major_title_ko}</span>
                        <h4 class="text-md font-black text-slate-800">${u.chapter_minor}. ${u.chapter_title_ko}</h4>
                    </div>
                    <button onclick="document.querySelector('input[type=checkbox][onchange*=${u.chapter_minor}]').click()" class="text-slate-300 hover:text-red-500 p-2"><i class="fa-solid fa-circle-xmark text-xl"></i></button>
                </div>
                <div class="grid grid-cols-3 gap-6">
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-indigo-500 mb-1.5 uppercase">일반유형(세트)</label>
                        <input type="number" min="0" value="${item.counts.normal}" oninput="MakerCore.updateUnitCount(${u.chapter_minor}, 'normal', this.value)" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center font-black text-xl text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-200">
                        ${createOrderToggle(u.chapter_minor, 'normal', item.orders.normal, 'indigo')}
                    </div>
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-emerald-600 mb-1.5 uppercase">서술형(문항)</label>
                        <input type="number" min="0" value="${item.counts.subjective}" oninput="MakerCore.updateUnitCount(${u.chapter_minor}, 'subjective', this.value)" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center font-black text-xl text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-200">
                        ${createOrderToggle(u.chapter_minor, 'subjective', item.orders.subjective, 'emerald')}
                    </div>
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-purple-600 mb-1.5 uppercase">1등급(문항)</label>
                        <input type="number" min="0" value="${item.counts.high}" oninput="MakerCore.updateUnitCount(${u.chapter_minor}, 'high', this.value)" class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center font-black text-xl text-purple-700 outline-none focus:ring-2 focus:ring-purple-200">
                        ${createOrderToggle(u.chapter_minor, 'high', item.orders.high, 'purple')}
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    updateSummary(data) {
        document.getElementById('summary-normal-sets').innerText = data.normalSets.toLocaleString();
        document.getElementById('summary-subjective').innerText = data.subjective.toLocaleString();
        document.getElementById('summary-high').innerText = data.high.toLocaleString();
        const totalEl = document.getElementById('summary-total-problems');
        totalEl.innerText = data.totalProblems.toLocaleString();
        totalEl.classList.remove('animate-bounce-subtle');
        void totalEl.offsetWidth;
        totalEl.classList.add('animate-bounce-subtle');
    }
};

const style = document.createElement('style');
style.innerHTML = `
    @keyframes bounce-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); color: #818cf8; } }
    .animate-bounce-subtle { animation: bounce-subtle 0.3s ease-out; }
    .pro-scroll::-webkit-scrollbar { width: 6px; }
    .pro-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .pro-scroll::-webkit-scrollbar-track { background: transparent; }
`;
document.head.appendChild(style);