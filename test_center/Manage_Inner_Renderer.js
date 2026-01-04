/**
 * @module ManageInnerRenderer
 * @description 내부 진단평가 관리 화면 UI 렌더링 - 엔진 전환 대응 및 탭 스타일 제어
 * @version 3.1 (엔진 스위칭 최적화 및 스타일 동기화)
 */

console.log("[SYSTEM] Manage_Inner_Renderer.js 파일 로드됨");

window.ManageInnerRenderer = {
    /**
     * @method renderBase
     * @description 기본 레이아웃 구조 생성 (상단 엔진 전환 탭 포함)
     */
    renderBase(container) {
        container.innerHTML = `
            <div class="flex h-full bg-slate-50 font-sans select-none overflow-hidden">
                <aside class="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                    <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students List</h3>
                        <p class="text-xl font-black text-slate-800 tracking-tight">학생 목록</p>
                    </div>
                    <div class="p-4 border-b border-slate-50">
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                            <input type="text" placeholder="이름 검색..." disabled
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold cursor-not-allowed">
                        </div>
                    </div>
                    <div id="student-list" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
                        <div class="text-center py-10 text-slate-300 text-xs">로딩 중...</div>
                    </div>
                </aside>

                <main class="flex-1 flex flex-col relative">
                    <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
                        <div class="flex items-center gap-6">
                            <div class="flex items-center gap-2">
                                <div class="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <i class="fa-solid fa-chart-pie text-xs"></i>
                                </div>
                                <span class="font-black text-slate-700 text-sm">성적 관리 및 판정</span>
                            </div>
                            
                            <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button id="manage-tab-internal" onclick="ManageInnerCore.switchMode('internal')" 
                                    class="px-4 py-1.5 rounded-lg text-[11px] font-black transition-all bg-white text-indigo-600 shadow-sm border border-slate-100">
                                    내부 진단
                                </button>
                                <button id="manage-tab-external" onclick="ManageInnerCore.switchMode('external')" 
                                    class="px-4 py-1.5 rounded-lg text-[11px] font-black transition-all text-slate-400 hover:text-slate-600">
                                    외부 진단
                                </button>
                            </div>
                        </div>

                        <div id="selected-student-badge" class="hidden bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md flex items-center gap-2">
                            <i class="fa-solid fa-user-check"></i>
                            <span id="target-name"></span>
                        </div>
                    </header>

                    <div id="content-area" class="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scroll relative">
                        <div id="welcome-view" class="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <i class="fa-solid fa-arrow-left text-4xl text-slate-300 mb-4"></i>
                            <p class="text-slate-400 text-sm font-black">좌측에서 학생을 선택해주세요.</p>
                        </div>
                        <div id="result-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"></div>
                    </div>
                </main>
            </div>
        `;
    },

    /**
     * @method updateTabUI
     * @description 선택된 모드에 따라 상단 탭의 시각적 강조 상태 변경
     */
    updateTabUI(mode) {
        const intBtn = document.getElementById('manage-tab-internal');
        const extBtn = document.getElementById('manage-tab-external');
        if (!intBtn || !extBtn) return;

        if (mode === 'internal') {
            intBtn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all bg-white text-indigo-600 shadow-sm border border-slate-100";
            extBtn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all text-slate-400 hover:text-slate-600";
        } else {
            extBtn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all bg-white text-rose-600 shadow-sm border border-slate-100";
            intBtn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all text-slate-400 hover:text-slate-600";
        }
    },

    /**
     * @method renderStudentList
     * @description 학생 목록 데이터 바인딩 및 출력
     */
    renderStudentList(students) {
        const container = document.getElementById('student-list');
        if (!container) return;

        if (students.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs font-black">학생 데이터가 없습니다.</div>`;
            return;
        }

        container.innerHTML = students.map(s => `
            <div onclick="ManageInnerCore.loadStudentResults('${s.id}')" data-sid="${s.id}"
                 class="student-item p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-md hover:translate-y-[-2px] transition-all group flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        ${s.name.charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-700 group-hover:text-indigo-700">${s.name}</p>
                        <p class="text-[10px] text-slate-400 font-bold tracking-tight lowercase">${s.grade}</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-slate-200 group-hover:text-indigo-500 text-xs"></i>
            </div>
        `).join('');
    },

    /**
     * @method updateHeader
     * @description 헤더 영역에 선택된 학생 정보 노출 및 선택 스타일 적용
     */
    updateHeader(studentName) {
        const badge = document.getElementById('selected-student-badge');
        const nameLabel = document.getElementById('target-name');
        
        // 사이드바 선택 효과 강조
        document.querySelectorAll('.student-item').forEach(el => el.classList.remove('border-indigo-500', 'bg-indigo-50/50'));
        const activeItem = document.querySelector(`.student-item[onclick*='${studentName}']`);
        if (activeItem) activeItem.classList.add('border-indigo-500', 'bg-indigo-50/50');
        
        if (badge && nameLabel) {
            nameLabel.innerText = studentName;
            badge.classList.remove('hidden');
        }
    },

    /**
     * @method renderResultGrid
     * @description 내부 진단 결과 카드 리스트 렌더링
     */
    renderResultGrid(results) {
        const grid = document.getElementById('result-grid');
        const welcome = document.getElementById('welcome-view');
        const container = document.getElementById('content-area');
        
        if (!grid || !welcome) return;

        // 외부 엔진에서 내부 엔진으로 돌아올 때 컨테이너 구조 복구
        if (!document.getElementById('result-grid')) {
            container.innerHTML = `
                <div id="welcome-view" class="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <i class="fa-solid fa-arrow-left text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-400 text-sm font-black">좌측에서 학생을 선택해주세요.</p>
                </div>
                <div id="result-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"></div>`;
            return this.renderResultGrid(results);
        }

        welcome.classList.add('hidden');
        grid.classList.remove('hidden');

        if (results.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 opacity-40">
                    <i class="fa-solid fa-folder-open text-5xl mb-4"></i>
                    <p class="text-xs font-black uppercase tracking-widest">데이터가 없습니다.</p>
                </div>`;
            return;
        }

        grid.innerHTML = results.map(r => {
            const date = new Date(r.assigned_at).toLocaleDateString();
            let statusBadge = '';
            let cardBorder = 'border-slate-100';
            
            if (r.status === 'pass') {
                statusBadge = `<div class="absolute top-4 right-4 text-emerald-500 border-2 border-emerald-500 px-2 py-1 rounded-lg text-[10px] font-black rotate-[-12deg] bg-white shadow-sm">PASS</div>`;
                cardBorder = 'border-emerald-200 bg-emerald-50/20';
            } else if (r.status === 'fail') {
                statusBadge = `<div class="absolute top-4 right-4 text-rose-500 border-2 border-rose-500 px-2 py-1 rounded-lg text-[10px] font-black rotate-[-12deg] bg-white shadow-sm">FAIL</div>`;
                cardBorder = 'border-rose-200 bg-rose-50/20';
            } else {
                statusBadge = `<div class="absolute top-4 right-4 bg-slate-100 text-slate-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm">PENDING</div>`;
            }

            return `
                <div class="bg-white rounded-[28px] p-6 shadow-sm border ${cardBorder} relative group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 overflow-hidden">
                    ${statusBadge}
                    <div class="mb-4 pr-12">
                        <span class="text-[9px] font-black text-slate-300 block mb-1 uppercase tracking-wider">${date}</span>
                        <h4 class="text-sm font-black text-slate-800 leading-snug line-clamp-2" title="${r.diagnostic_packages?.title}">
                            ${r.diagnostic_packages?.title || 'Unknown Package'}
                        </h4>
                    </div>
                    
                    <div class="flex items-end gap-1.5 mb-8">
                        <span class="text-4xl font-black text-slate-800 font-mono tracking-tighter">${r.score ?? '-'}</span>
                        <span class="text-[10px] font-black text-slate-400 mb-1.5">PTS</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 mt-auto">
                        <button onclick="ManageInnerCore.updateTestStatus(${r.id}, 'pass')" 
                            class="py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                            PASS
                        </button>
                        <button onclick="ManageInnerCore.updateTestStatus(${r.id}, 'fail')" 
                            class="py-3 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                            FAIL
                        </button>
                        <button onclick="ManageInnerCore.resetForRetake(${r.id})" 
                            class="py-3 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black hover:bg-slate-800 hover:text-white transition-all shadow-sm">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};