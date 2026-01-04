/**
 * @module ManageExtRenderer
 * @version 1.7.0
 * @description 2단계 확인 시스템(선택 후 저장)이 적용된 럭셔리 렌더러
 */

window.ManageExtRenderer = {
    renderBase(container) {
        if (!container) return;
        container.innerHTML = `<div id="ext-result-grid" class="max-w-5xl mx-auto space-y-8 pb-32"></div>`;
    },

    /**
     * @method handleTempSelect
     * @description 버튼 클릭 시 즉시 저장하지 않고 시각적 선택 상태만 변경
     */
    handleTempSelect(btn, assignmentId, roundNum) {
        // 해당 회차의 다른 버튼들 비활성화
        const parent = btn.parentElement;
        parent.querySelectorAll('button').forEach(b => b.classList.remove('is-temp-active', 'bg-emerald-500', 'bg-rose-500', 'text-white'));
        
        // 선택된 버튼 강조
        const status = btn.getAttribute('data-status');
        btn.classList.add('is-temp-active');
        if (status === 'pass') {
            btn.classList.add('bg-emerald-500', 'text-white');
        } else {
            btn.classList.add('bg-rose-500', 'text-white');
        }

        // 확인 버튼(저장 버튼) 활성화 이펙트
        const commitBtn = document.getElementById(`commit-${assignmentId}-${roundNum}`);
        if (commitBtn) {
            commitBtn.classList.remove('opacity-20', 'grayscale');
            commitBtn.classList.add('animate-bounce-short');
        }
    },

    renderResultGrid(results) {
        const grid = document.getElementById('ext-result-grid');
        if (!grid) return;

        grid.innerHTML = results.map(r => {
            const date = new Date(r.assigned_at).toLocaleDateString('ko-KR', {year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\./g, '').replace(/ /g, '.');
            const extData = r.diagnostic_packages?.ext_data || [];
            const extStatus = r.ext_status || {};
            const difficulty = r.ext_info?.difficulty || 'mid';
            const diffMap = { 'low': '하', 'mid-low': '중하', 'mid': '중', 'high': '상' };
            const diffColorMap = { 'low': 'bg-emerald-500', 'mid-low': 'bg-sky-500', 'mid': 'bg-indigo-500', 'high': 'bg-rose-500' };

            const roundItemsHtml = extData.map(round => {
                const info = extStatus[round.round] || { status: 'assigned', try: 0 };
                const isPass = info.status === 'pass';
                const isFail = info.status === 'fail';

                return `
                    <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-[24px] border border-slate-100 hover:bg-white transition-all group/round">
                        <div class="flex items-center gap-4">
                            <div class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 text-white text-[10px] font-black font-mono shadow-md">
                                ${round.round}
                            </div>
                            <div>
                                <p class="text-[12px] font-black text-slate-700">${round.content}</p>
                                <p class="text-[9px] font-bold text-slate-400 uppercase">Attempts: ${info.try}회 ${isPass ? '• <span class="text-emerald-500">COMPLETE</span>' : ''}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button onclick="ManageExtRenderer.handleTempSelect(this, ${r.id}, ${round.round})"
                                    data-status="pass" data-round-key="${r.id}-${round.round}"
                                    class="px-4 py-2 rounded-lg text-[9px] font-black transition-all ${isPass ? 'bg-emerald-500 text-white is-temp-active' : 'text-slate-400 hover:text-emerald-600'}">
                                    PASS
                                </button>
                                <button onclick="ManageExtRenderer.handleTempSelect(this, ${r.id}, ${round.round})"
                                    data-status="fail" data-round-key="${r.id}-${round.round}"
                                    class="px-4 py-2 rounded-lg text-[9px] font-black transition-all ${isFail ? 'bg-rose-500 text-white is-temp-active' : 'text-slate-400 hover:text-rose-600'}">
                                    RE-TEST
                                </button>
                            </div>

                            <button id="commit-${r.id}-${round.round}" 
                                onclick="ManageExtCore.commitRoundStatus(${r.id}, ${round.round})"
                                class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 transition-all opacity-20 grayscale hover:opacity-100 hover:grayscale-0 active:scale-90"
                                title="최종 저장">
                                <i class="fa-solid fa-check-double text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="bg-white rounded-[40px] border-2 border-slate-100 shadow-sm transition-all duration-500 group" data-aid="${r.id}">
                    <div onclick="this.parentElement.classList.toggle('is-open')" class="p-8 cursor-pointer flex items-center justify-between">
                        <div class="flex items-center gap-6">
                            <div class="w-14 h-14 rounded-[20px] bg-rose-50 text-rose-500 flex items-center justify-center text-xl relative shadow-inner">
                                <i class="fa-solid fa-clipboard-check"></i>
                                <div class="absolute -bottom-2 -left-2 ${diffColorMap[difficulty]} text-white text-[8px] px-2 py-0.5 rounded-md font-black ring-2 ring-white">${diffMap[difficulty]}</div>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-800 tracking-tight">${r.diagnostic_packages?.title}</h3>
                                <p class="text-[10px] font-bold text-slate-400 font-mono uppercase">${date}</p>
                            </div>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-[.is-open]:rotate-180 transition-transform"><i class="fa-solid fa-chevron-down"></i></div>
                    </div>

                    <div class="hidden group-[.is-open]:block border-t border-slate-100 bg-white p-8 space-y-3 animate-slideDown">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Round Management (Click check to save)</p>
                        <div class="max-h-[500px] overflow-y-auto pr-2 custom-scroll">
                            ${roundItemsHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// 수전증 방지용 애니메이션 스타일 추가
if (!document.getElementById('anti-shake-style')) {
    const style = document.createElement('style');
    style.id = 'anti-shake-style';
    style.innerHTML = `
        @keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-bounce-short { animation: bounceShort 0.5s ease infinite; }
        .is-open { border-color: #6366f1 !important; box-shadow: 0 20px 50px rgba(99, 102, 241, 0.1) !important; }
    `;
    document.head.appendChild(style);
}