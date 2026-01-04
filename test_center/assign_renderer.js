/**
 * @module AssignRenderer
 * @version 1.9.1
 * @description 내부/외부 진단평가 탭 선택 및 화면 복구 기능이 강화된 렌더러
 */

window.AssignRenderer = {
    /**
     * @method renderBase
     * @description 레이아웃 기본 구조 생성 (상단에 내부/외부 선택 탭 버튼 추가)
     */
    renderBase(container) {
        container.innerHTML = `
            <div class="flex h-full bg-slate-100 font-sans select-none overflow-hidden">
                <aside class="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
                    <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Students</h3>
                        <p class="text-xl font-black text-slate-800 tracking-tight">배정 대상 목록</p>
                    </div>
                    <div id="student-list-container" class="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scroll"></div>
                </aside>

                <main class="flex-1 flex flex-col">
                    <header class="p-4 bg-white border-b border-slate-200 shadow-sm flex flex-col gap-4">
                        
                        <div class="flex bg-slate-100 p-1.5 rounded-2xl w-fit self-center shadow-inner border border-slate-200">
                            <button id="tab-internal" onclick="AssignCore.switchType('internal')" 
                                class="px-10 py-2.5 rounded-xl text-sm font-black transition-all bg-white text-indigo-600 shadow-sm border border-slate-100">
                                <i class="fa-solid fa-house-laptop mr-2"></i>내부 진단
                            </button>
                            <button id="tab-external" onclick="AssignCore.switchType('external')" 
                                class="px-10 py-2.5 rounded-xl text-sm font-black transition-all text-slate-400 hover:text-slate-600">
                                <i class="fa-solid fa-earth-asia mr-2"></i>외부 진단
                            </button>
                        </div>

                        <div id="filter-section" class="flex flex-col gap-3">
                            <div class="flex items-center justify-between px-2">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workbook Filter</span>
                                <div id="selected-student-badge" class="hidden bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-200"></div>
                            </div>
                            <div id="workbook-filter-container" class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"></div>
                        </div>
                    </header>

                    <div id="main-content-area" class="flex-1 flex min-h-0">
                        <div id="internal-assign-wrapper" class="flex-1 flex min-h-0">
                            <section class="flex-1 flex flex-col border-r border-slate-200">
                                <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                                    <span class="text-[11px] font-black text-indigo-600 uppercase tracking-wider">기배정 진단평가</span>
                                    <span id="count-assigned" class="text-xs font-mono font-black text-indigo-400 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">0</span>
                                </div>
                                <div id="assigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll"></div>
                            </section>

                            <section class="flex-1 flex flex-col bg-slate-50/30">
                                <div class="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                                    <span class="text-[11px] font-black text-emerald-600 uppercase tracking-wider">미배정 리스트</span>
                                    <span id="count-unassigned" class="text-xs font-mono font-black text-emerald-400 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">0</span>
                                </div>
                                <div id="unassigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll"></div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    /**
     * @method renderInternalBase
     * @description [핵심추가] 외부 모드에서 내부 모드로 돌아올 때 화면 뼈대를 다시 구축하는 함수
     */
    renderInternalBase(container) {
        container.innerHTML = `
            <div id="internal-assign-wrapper" class="flex-1 flex min-h-0 animate-fadeIn">
                <section class="flex-1 flex flex-col border-r border-slate-200">
                    <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                        <span class="text-[11px] font-black text-indigo-600 uppercase tracking-wider">기배정 진단평가</span>
                        <span id="count-assigned" class="text-xs font-mono font-black text-indigo-400 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">0</span>
                    </div>
                    <div id="assigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll"></div>
                </section>

                <section class="flex-1 flex flex-col bg-slate-50/30">
                    <div class="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                        <span class="text-[11px] font-black text-emerald-600 uppercase tracking-wider">미배정 리스트</span>
                        <span id="count-unassigned" class="text-xs font-mono font-black text-emerald-400 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">0</span>
                    </div>
                    <div id="unassigned-list" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll"></div>
                </section>
            </div>
        `;
    },

    /**
     * @method renderEmptyState
     * @description [핵심추가] 학생 선택 전이나 초기 상태일 때 보여줄 안내 화면
     */
    renderEmptyState() {
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-60 animate-fadeIn">
                    <i class="fa-solid fa-user-plus text-5xl mb-4"></i>
                    <p class="text-sm font-black uppercase tracking-widest">학생을 먼저 선택해주세요</p>
                </div>`;
        }
    },

    /**
     * @method updateTabUI
     * @description 내부/외부 선택에 따른 버튼 스타일 및 필터 영역 노출 제어
     */
    updateTabUI(type) {
        const isInternal = type === 'internal';
        const intBtn = document.getElementById('tab-internal');
        const extBtn = document.getElementById('tab-external');
        const filterSection = document.getElementById('filter-section');

        if (isInternal) {
            intBtn.className = "px-10 py-2.5 rounded-xl text-sm font-black transition-all bg-white text-indigo-600 shadow-sm border border-slate-100";
            extBtn.className = "px-10 py-2.5 rounded-xl text-sm font-black transition-all text-slate-400 hover:text-slate-600";
            filterSection.style.display = 'flex';
        } else {
            extBtn.className = "px-10 py-2.5 rounded-xl text-sm font-black transition-all bg-white text-rose-600 shadow-sm border border-slate-100";
            intBtn.className = "px-10 py-2.5 rounded-xl text-sm font-black transition-all text-slate-400 hover:text-slate-600";
            filterSection.style.display = 'none'; // 외부 진단시에는 교재 필터 숨김
        }
    },

    /**
     * @method renderExternalPlaceholder
     * @description 외부 진단 선택 시 보여줄 안내 화면 (준비중 알림)
     */
    renderExternalPlaceholder() {
        const emptyHtml = `<div class="py-20 text-center flex flex-col items-center justify-center">
            <i class="fa-solid fa-screwdriver-wrench text-4xl text-slate-200 mb-4"></i>
            <p class="text-slate-300 text-xs font-bold uppercase tracking-widest">External Diagnostic System</p>
            <p class="text-slate-400 text-sm mt-1 font-black">서비스 준비 중입니다</p>
        </div>`;
        document.getElementById('assigned-list').innerHTML = emptyHtml;
        document.getElementById('unassigned-list').innerHTML = emptyHtml;
        document.getElementById('count-assigned').innerText = '0';
        document.getElementById('count-unassigned').innerText = '0';
    },

    /**
     * @method renderWorkbookFilters
     */
    renderWorkbookFilters(workbooks, activeId = null) {
        const container = document.getElementById('workbook-filter-container');
        if (!container) return;
        const getBtnClass = (isActive) => {
            const base = "shrink-0 px-5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm ";
            return isActive 
                ? base + "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 ring-2 ring-indigo-100 scale-105" 
                : base + "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600";
        };
        container.innerHTML = `<button onclick="AssignCore.filterByWorkbook(null)" class="${getBtnClass(activeId === null)}">전체보기</button>` + 
            workbooks.map(wb => `<button onclick="AssignCore.filterByWorkbook(${wb.id})" class="${getBtnClass(String(wb.id) === String(activeId))}">${wb.title}</button>`).join('');
    },

    /**
     * @method renderStudentList
     */
    renderStudentList(students) {
        const container = document.getElementById('student-list-container');
        if (!container) return;
        container.innerHTML = students.map(s => `
            <div onclick="AssignCore.selectStudent('${s.id}')" data-sid="${s.id}"
                 class="student-item p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group flex items-center justify-between shadow-sm">
                <div>
                    <p class="text-sm font-bold text-slate-700 group-hover:text-indigo-700">${s.name}</p>
                    <p class="text-[10px] text-slate-400 font-medium">${s.grade}</p>
                </div>
                <i class="fa-solid fa-chevron-right text-slate-200 group-hover:text-indigo-400"></i>
            </div>
        `).join('');
    },

    /**
     * @method updateStudentSelection
     */
    updateStudentSelection(studentId) {
        document.querySelectorAll('.student-item').forEach(el => el.classList.remove('border-indigo-500', 'bg-indigo-50', 'ring-1', 'ring-indigo-500'));
        const target = document.querySelector(`[data-sid="${studentId}"]`);
        if (target) {
            target.classList.add('border-indigo-500', 'bg-indigo-50', 'ring-1', 'ring-indigo-500');
            const student = AssignCore.state.students.find(s => s.id === studentId);
            const badge = document.getElementById('selected-student-badge');
            if (badge) {
                badge.innerHTML = `<i class="fa-solid fa-user-check mr-2"></i>${student.name} 학생 선택됨`;
                badge.classList.remove('hidden');
            }
        }
    },

    /**
     * @method renderSplitLists
     * @description 내부 진단평가 데이터 렌더링 (왼쪽 클릭 시 삭제 기능 포함)
     */
    renderSplitLists(assigned, unassigned) {
        const aContainer = document.getElementById('assigned-list');
        const uContainer = document.getElementById('unassigned-list');
        if (!aContainer || !uContainer) return;
        document.getElementById('count-assigned').innerText = assigned.length;
        document.getElementById('count-unassigned').innerText = unassigned.length;

        // 기배정 목록: 클릭 시 배정 취소(숑 이동)
        aContainer.innerHTML = assigned.map(p => `
            <div onclick="AssignCore.removeAssignmentAction(${p.id})" 
                 class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm border-l-4 border-l-indigo-400 flex justify-between items-center group cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all">
                <div class="flex-1 truncate">
                    <span class="text-[9px] font-black text-indigo-400 uppercase">${p.workbooks?.title || '기본교재'}</span>
                    <h4 class="text-sm font-black text-slate-700 truncate group-hover:text-rose-700">${p.title}</h4>
                </div>
                <button onclick="event.stopPropagation(); AssignCore.previewPackage(${p.id})" class="ml-2 p-2 hover:bg-white rounded-full text-indigo-300 hover:text-indigo-600 transition-all">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>
        `).join('') || `<div class="py-20 text-center text-slate-300 text-xs font-bold font-mono uppercase tracking-widest">No Active Assignments</div>`;

        // 미배정 목록: 클릭 시 배정 실행
        uContainer.innerHTML = unassigned.map(p => `
            <div class="flex items-center gap-2 group">
                <div onclick="AssignCore.assignAction(${p.id})" class="flex-1 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-500 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-emerald-500">
                    <span class="text-[9px] font-black text-slate-400 uppercase">${p.workbooks?.title || '기본교재'}</span>
                    <h4 class="text-sm font-black text-slate-800 truncate">${p.title}</h4>
                </div>
                <button onclick="AssignCore.previewPackage(${p.id})" class="p-3 bg-white border border-slate-200 rounded-2xl text-slate-300 hover:text-indigo-500 hover:border-indigo-500 transition-all">
                    <i class="fa-solid fa-images"></i>
                </button>
            </div>
        `).join('') || `<div class="py-20 text-center text-slate-300 text-xs font-bold font-mono uppercase tracking-widest">No Packages Found</div>`;
    },

    /**
     * @method openImageModal
     * @description [기존 유지] 문항 미리보기 모달 및 인쇄 최적화 로직
     */
    openImageModal(data) {
        const old = document.getElementById('image-viewer-modal');
        if (old) old.remove();

        const pagedData = [];
        for (let i = 0; i < data.images.length; i += 4) {
            pagedData.push(data.images.slice(i, i + 4));
        }

        const modal = document.createElement('div');
        modal.id = 'image-viewer-modal';
        modal.className = "fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center p-0 md:p-6 overflow-hidden";
        
        modal.innerHTML = `
            <div id="modal-top-bar" class="w-full max-w-[1000px] grid grid-cols-3 items-center p-4 no-print text-white">
                <div class="font-black text-indigo-400 text-sm italic">${data.studentName} 학생</div>
                <div class="text-center font-black text-lg">${data.packageTitle}</div>
                <div class="flex justify-end gap-2">
                    <button onclick="window.print()" class="bg-indigo-600 px-5 py-2 rounded-xl text-xs font-black shadow-lg">출력하기</button>
                    <button onclick="document.getElementById('image-viewer-modal').remove()" class="text-3xl opacity-50 hover:opacity-100">&times;</button>
                </div>
            </div>
            <div id="print-area" class="flex-1 w-full max-w-[1000px] overflow-y-auto custom-scroll bg-slate-100 md:rounded-t-3xl">
                ${pagedData.map((pageQuestions, pageIdx) => `
                    <div class="a4-page">
                        ${pageIdx === 0 ? `
                        <div class="print-header">
                            <div class="flex justify-between items-end border-b-4 border-black pb-2 mb-6">
                                <div>
                                    <h1 class="text-2xl font-black text-black">${data.packageTitle}</h1>
                                    <p class="text-[10px] font-bold text-slate-500">DIAGNOSTIC TEST REPORT</p>
                                </div>
                                <div class="text-right">
                                    <span class="text-xl font-bold text-black text-nowrap">성 명 : ${data.studentName}</span>
                                    <div class="border-b border-black w-32 ml-auto mt-1"></div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="grid grid-cols-2 print-grid">
                            ${pageQuestions.map((img, idx) => `
                                <div class="question-container">
                                    <div class="flex justify-between items-center mb-1 border-b border-slate-100">
                                        <span class="text-sm font-black text-black font-mono">Q ${(pageIdx * 4) + idx + 1}</span>
                                        <span class="text-[8px] text-slate-400">ID: ${img.qNum}</span>
                                    </div>
                                    <div class="img-box">
                                        <img src="${img.url}" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Missing'">
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(modal);
        this.injectGlobalStyles();
    },

    /**
     * @method injectGlobalStyles
     */
    injectGlobalStyles() {
        const styleId = 'print-engine-v1.8.1';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .a4-page { background: white; margin: 0 auto 20px auto; padding: 15mm; width: 210mm; height: 297mm; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .print-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10mm; flex: 1; }
            .question-container { display: flex; flex-direction: column; overflow: hidden; }
            .img-box { flex: 1; display: flex; align-items: flex-start; justify-content: center; overflow: hidden; }
            .img-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print {
                @page { size: A4; margin: 0; }
                html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
                body > *:not(#image-viewer-modal) { display: none !important; }
                #image-viewer-modal { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; display: block !important; padding: 0 !important; background: white !important; }
                .no-print { display: none !important; }
                #print-area { background: white !important; padding: 0 !important; }
                .a4-page { margin: 0 !important; box-shadow: none !important; page-break-after: always !important; break-after: page !important; }
                .a4-page:last-child { page-break-after: auto !important; }
            }
        `;
        document.head.appendChild(style);
    }
};