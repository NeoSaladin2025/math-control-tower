/**
 * @module AssignExtRenderer
 * @version 1.1.0
 * @description 외부 진단평가 전용 배정 UI 렌더러 - 난이도별 배정 버튼 인터페이스 탑재
 */

window.AssignExtRenderer = {
    /**
     * @method renderBase
     * @description 외부 배정 영역의 기본 골격 생성 (기배정/미배정 2분할 리스트)
     */
    renderBase(container) {
        container.innerHTML = `
            <div id="ext-assign-wrapper" class="flex-1 flex min-h-0 animate-fadeIn">
                <section class="flex-1 flex flex-col border-r border-slate-200 bg-white">
                    <div class="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
                        <span class="text-[11px] font-black text-rose-600 uppercase tracking-wider">기배정 외부 진단</span>
                        <span id="ext-count-assigned" class="text-xs font-mono font-black text-rose-400 bg-white px-2 py-0.5 rounded-lg border border-rose-100">0</span>
                    </div>
                    <div id="ext-assigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 pro-scroll">
                        <div class="py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">데이터 로드 중...</div>
                    </div>
                </section>

                <section class="flex-1 flex flex-col bg-slate-50/30">
                    <div class="p-4 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                        <span class="text-[11px] font-black text-slate-600 uppercase tracking-wider">외부 패키지 리포지토리 (난이도 선택 후 배정)</span>
                        <span id="ext-count-unassigned" class="text-xs font-mono font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">0</span>
                    </div>
                    <div id="ext-unassigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 pro-scroll">
                         <div class="py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">데이터 로드 중...</div>
                    </div>
                </section>
            </div>
        `;
    },

    /**
     * @method renderSplitLists
     * @description 기배정 및 미배정 리스트를 난이도 선택 UI와 함께 렌더링
     */
    renderSplitLists(assigned, unassigned) {
        const aContainer = document.getElementById('ext-assigned-list');
        const uContainer = document.getElementById('ext-unassigned-list');
        
        if (!aContainer || !uContainer) return;

        // 실시간 카운트 업데이트
        document.getElementById('ext-count-assigned').innerText = assigned.length;
        document.getElementById('ext-count-unassigned').innerText = unassigned.length;

        // 1. 기배정 목록: 클릭 시 배정 취소 로직 수행
        aContainer.innerHTML = assigned.map(p => `
            <div onclick="AssignExtCore.removeAssignmentAction(${p.id})" 
                 class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm border-l-4 border-l-rose-500 flex justify-between items-center group cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all">
                <div class="flex-1 truncate">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[9px] font-black text-rose-500 uppercase font-sans">EXTERNAL</span>
                        <span class="text-[9px] font-bold text-slate-300 font-mono">ID: ${p.id}</span>
                    </div>
                    <h4 class="text-sm font-black text-slate-700 truncate group-hover:text-rose-700">${p.title}</h4>
                    <p class="text-[10px] text-slate-400 mt-1 font-medium italic">회차 구성: ${p.ext_data?.length || 0}세트</p>
                </div>
                <div class="ml-2 p-2 text-rose-100 group-hover:text-rose-500 transition-colors">
                    <i class="fa-solid fa-circle-minus text-lg"></i>
                </div>
            </div>
        `).join('') || this.getEmptyTemplate("No Active Assignments");

        // 2. 미배정 목록: 난이도 버튼 클릭 시 배정 실행
        uContainer.innerHTML = unassigned.map(p => `
            <div class="p-5 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-indigo-200 transition-all group">
                <div class="mb-4">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1">AVAILABLE PACKAGE</span>
                    <h4 class="text-sm font-black text-slate-800 truncate">${p.title}</h4>
                </div>
                
                <div class="grid grid-cols-4 gap-2">
                    <button onclick="AssignExtCore.assignAction(${p.id}, 'low')" 
                            class="py-2 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all border border-slate-100">하</button>
                    <button onclick="AssignExtCore.assignAction(${p.id}, 'mid-low')" 
                            class="py-2 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black hover:bg-sky-500 hover:text-white transition-all border border-slate-100">중하</button>
                    <button onclick="AssignExtCore.assignAction(${p.id}, 'mid')" 
                            class="py-2 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black hover:bg-indigo-500 hover:text-white transition-all border border-slate-100">중</button>
                    <button onclick="AssignExtCore.assignAction(${p.id}, 'high')" 
                            class="py-2 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all border border-slate-100">상</button>
                </div>
            </div>
        `).join('') || this.getEmptyTemplate("No External Packages Found");
    },

    /**
     * @method getEmptyTemplate
     * @description 리스트가 비어있을 때 표시할 안내 템플릿
     */
    getEmptyTemplate(msg) {
        return `
            <div class="py-20 text-center flex flex-col items-center justify-center opacity-30">
                <i class="fa-solid fa-folder-open text-3xl mb-3 text-slate-200"></i>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${msg}</p>
            </div>
        `;
    }
};