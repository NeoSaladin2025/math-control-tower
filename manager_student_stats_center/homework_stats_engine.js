/**
 * @file homework_stats_engine.js
 * @description 3번 분석 엔진: 숙제 이행 데이터 정밀 분석 및 시각화 시스템 (4번 리포트 엔진 연동형)
 * @version 1.6.1
 */

window.HomeworkStatsEngine = {
    // 수신된 전체 숙제 데이터 저장소
    homeworkRecords: [],

    // [추가] 4번 엔진이 확인할 숙제 데이터 주인 이름표
    homeworkStudentId: null,

    // 좌측 달력 탐색용 기준 날짜
    currentViewDate: new Date(),

    /**
     * @function loadAndRender
     * @param {string} studentId - 대상 학생 고유 식별자
     */
    async loadAndRender(studentId) {
        console.log(`[HomeworkEngine] Pipeline Active: Student ID ${studentId}`);

        // [추가] 입구에서 현재 학생 ID를 이름표에 기록
        this.homeworkStudentId = studentId;
        this.selectedStudentId = studentId;

        const container = document.getElementById('main-view-container');

        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-emerald-600">
                <i class="fa-solid fa-microchip animate-spin text-5xl mb-6"></i>
                <p class="text-lg font-black uppercase tracking-widest italic">Data Analytics Algorithm Running...</p>
            </div>`;

        try {
            // DB 뷰(v_student_homework_summary)로부터 데이터 동기화
            const { data, error } = await _supabase
                .from('v_student_homework_summary')
                .select('*')
                .eq('student_id', studentId);

            if (error) throw error;

            // 데이터를 보관 (4번 엔진이 이 변수를 참조함)
            this.homeworkRecords = data || [];
            this.renderLayout();

        } catch (err) {
            console.error("[HomeworkEngine] Critical Error:", err.message);
            container.innerHTML = `<div class="flex-1 flex items-center justify-center text-rose-600 text-xl font-black uppercase">DATA_SYNC_ERROR</div>`;
        }
    },

    /**
     * @function renderLayout
     * @description 대시보드 쉘 및 모듈 구조 정의
     */
    renderLayout() {
        const container = document.getElementById('main-view-container');
        container.innerHTML = `
            <div class="flex flex-col h-full animate-fadeIn no-select">
                <div class="flex justify-between items-end mb-8 border-b-2 border-slate-50 pb-8">
                    <div>
                        <p class="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic tracking-tighter">Diagnostic Analytics Report</p>
                        <h3 class="font-black text-slate-800 text-3xl flex items-center gap-4 tracking-tighter">
                            <i class="fa-solid fa-clipboard-list text-emerald-500"></i> 통합 숙제 이행 정밀 분석
                        </h3>
                    </div>
                    <div class="flex gap-6 bg-white px-6 py-4 rounded-[24px] border border-slate-100 shadow-sm">
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-500"><span class="w-3 h-3 rounded-full bg-blue-600"></span> 이행승인</div>
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-500"><span class="w-3 h-3 rounded-full bg-amber-400"></span> 이행반려</div>
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-500"><span class="w-3 h-3 rounded-full bg-purple-500"></span> 미이행반려</div>
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-500"><span class="w-3 h-3 rounded-full bg-rose-600"></span> 미이행승인</div>
                    </div>
                </div>

                <div class="flex-1 flex gap-12 min-h-0">
                    <div class="w-[460px] flex flex-col shrink-0">
                        <div class="flex justify-between items-center mb-6 px-2">
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Monthly Timeline</p>
                            <div class="flex items-center gap-5 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                <button onclick="HomeworkStatsEngine.changeMonth(-1)" class="text-slate-400 hover:text-emerald-600 transition-colors"><i class="fa-solid fa-chevron-left text-sm"></i></button>
                                <span id="homework-month-label" class="text-sm font-black text-slate-800 min-w-[100px] text-center uppercase tracking-tighter"></span>
                                <button onclick="HomeworkStatsEngine.changeMonth(1)" class="text-slate-400 hover:text-emerald-600 transition-colors"><i class="fa-solid fa-chevron-right text-sm"></i></button>
                            </div>
                        </div>
                        <div id="homework-calendar-grid" class="flex-1 grid grid-cols-7 gap-3 bg-slate-50/50 p-8 rounded-[48px] border border-slate-100 overflow-y-auto custom-scroll shadow-inner"></div>
                    </div>

                    <div class="flex-1 flex flex-col items-center bg-emerald-50/20 rounded-[64px] border border-emerald-100 p-12 shadow-inner relative overflow-hidden">
                        <div class="flex gap-16 mb-12">
                            <div class="relative flex flex-col items-center">
                                <svg class="w-48 h-48 gauge-svg">
                                    <circle cx="96" cy="96" r="82" stroke="#ffffff" stroke-width="18" fill="transparent" />
                                    <circle id="gauge-perfection-path" cx="96" cy="96" r="82" stroke="#059669" stroke-width="18" fill="transparent" stroke-dasharray="515.2" stroke-dashoffset="515.2" class="gauge-path" stroke-linecap="round" />
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center top-[-10px]">
                                    <span id="text-perfection" class="text-5xl font-black text-slate-800 tracking-tighter">0%</span>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completion</span>
                                </div>
                                <p class="text-[11px] font-black text-emerald-700 mt-4 uppercase tracking-tighter">정상 이행률 (완성도)</p>
                            </div>

                            <div class="relative flex flex-col items-center">
                                <svg class="w-48 h-48 gauge-svg">
                                    <circle cx="96" cy="96" r="82" stroke="#ffffff" stroke-width="18" fill="transparent" />
                                    <circle id="gauge-effort-path" cx="96" cy="96" r="82" stroke="#4f46e5" stroke-width="18" fill="transparent" stroke-dasharray="515.2" stroke-dashoffset="515.2" class="gauge-path" stroke-linecap="round" />
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center top-[-10px]">
                                    <span id="text-effort" class="text-5xl font-black text-slate-800 tracking-tighter">0%</span>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Engagement</span>
                                </div>
                                <p class="text-[11px] font-black text-indigo-700 mt-4 uppercase tracking-tighter">성실 시도율 (노력도)</p>
                            </div>
                        </div>

                        <div id="homework-status-buttons" class="grid grid-cols-2 gap-4 w-full max-lg mb-12"></div>

                        <div id="homework-detail-panel" class="w-full flex-1 bg-white/90 border border-white rounded-[48px] p-10 shadow-sm overflow-y-auto custom-scroll">
                            <div class="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-70">
                                <i class="fa-solid fa-microscope text-5xl"></i>
                                <p class="text-xs font-black uppercase tracking-widest">분석 타일을 선택하여 상세 내역을 확인하십시오.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        this.updateAnalytics();
    },

    /**
     * @function changeMonth
     */
    changeMonth(offset) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + offset);
        this.updateAnalytics();
    },

    /**
     * @function updateAnalytics
     */
    updateAnalytics() {
        const startLimit = document.getElementById('start-date')?.value || '';
        const endLimit = document.getElementById('end-date')?.value || '';
        const stats = { perfect: 0, bad_effort: 0, excuse: 0, missing: 0, total: 0 };

        this.homeworkRecords.forEach(r => {
            const date = r.homework_date;
            if (date >= startLimit && date <= endLimit) {
                stats.total++;
                if (r.status === '선생이 이행을 승인함') stats.perfect++;
                else if (r.status === '선생이 이행을 반려함') stats.bad_effort++;
                else if (r.status === '선생이 미이행을 반려함') stats.excuse++;
                else if (r.status === '선생이 미이행을 승인함') stats.missing++;
            }
        });

        const perfRate = stats.total > 0 ? Math.round((stats.perfect / stats.total) * 100) : 0;
        const effortRate = stats.total > 0 ? Math.round(((stats.perfect + stats.bad_effort) / stats.total) * 100) : 0;

        // UI 업데이트
        this.refreshGauges(stats);
        this.refreshGrid(startLimit, endLimit);

        // 🔥 [핵심 수정] this 대신 window 객체에 직접 저장
        window.HomeworkStatsEngine.homeworkStats = {
            perfRate: perfRate,      // 정상 이행률
            effortRate: effortRate,  // 성실 시도율
            records: this.homeworkRecords.filter(r => r.homework_date >= startLimit && r.homework_date <= endLimit)
        };

        console.log("✅ 3번 엔진 데이터 저장 완료:", window.HomeworkStatsEngine.homeworkStats);
    },

    /**
     * @function refreshGauges
     */
    refreshGauges(stats) {
        const perfectionRate = stats.total > 0 ? Math.round((stats.perfect / stats.total) * 100) : 0;
        const effortRate = stats.total > 0 ? Math.round(((stats.perfect + stats.bad_effort) / stats.total) * 100) : 0;

        setTimeout(() => {
            const pPath = document.getElementById('gauge-perfection-path');
            const ePath = document.getElementById('gauge-effort-path');
            if (pPath) {
                pPath.style.strokeDashoffset = 515.2 - (515.2 * perfectionRate / 100);
                document.getElementById('text-perfection').innerText = `${perfectionRate}%`;
            }
            if (ePath) {
                ePath.style.strokeDashoffset = 515.2 - (515.2 * effortRate / 100);
                document.getElementById('text-effort').innerText = `${effortRate}%`;
            }

            const buttonArea = document.getElementById('homework-status-buttons');
            if (buttonArea) {
                buttonArea.innerHTML = `
                    <div class="col-span-2 flex justify-between px-3 mb-2 opacity-80">
                        <p class="text-[10px] font-black text-emerald-600 italic tracking-tighter">* 정상 이행률: [이행승인] 비율</p>
                        <p class="text-[10px] font-black text-indigo-600 italic tracking-tighter">* 성실 시도율: [이행승인+이행반려] 비율</p>
                    </div>
                    <button onclick="HomeworkStatsEngine.highlight('perfect')" class="bg-white p-6 rounded-[28px] border border-emerald-100 flex flex-col items-center hover:bg-emerald-50 shadow-sm active:scale-95 transition-all">
                        <span class="text-[10px] font-black text-emerald-500 uppercase mb-2">이행승인 (완벽)</span>
                        <span class="text-3xl font-black text-slate-700 tracking-tighter">${stats.perfect}건</span>
                    </button>
                    <button onclick="HomeworkStatsEngine.highlight('bad_effort')" class="bg-white p-6 rounded-[28px] border border-amber-100 flex flex-col items-center hover:bg-amber-50 shadow-sm active:scale-95 transition-all">
                        <span class="text-[10px] font-black text-amber-500 uppercase mb-2">이행반려 (불량)</span>
                        <span class="text-3xl font-black text-slate-700 tracking-tighter">${stats.bad_effort}건</span>
                    </button>
                    <button onclick="HomeworkStatsEngine.highlight('excuse')" class="bg-white p-6 rounded-[28px] border border-purple-100 flex flex-col items-center hover:bg-purple-50 shadow-sm active:scale-95 transition-all">
                        <span class="text-[10px] font-black text-purple-500 uppercase mb-2">미이행반려 (참작)</span>
                        <span class="text-3xl font-black text-slate-700 tracking-tighter">${stats.excuse}건</span>
                    </button>
                    <button onclick="HomeworkStatsEngine.highlight('missing')" class="bg-white p-6 rounded-[28px] border border-rose-100 flex flex-col items-center hover:bg-rose-50 shadow-sm active:scale-95 transition-all">
                        <span class="text-[10px] font-black text-rose-500 uppercase mb-2">미이행승인 (무단)</span>
                        <span class="text-3xl font-black text-slate-700 tracking-tighter">${stats.missing}건</span>
                    </button>`;
            }
        }, 100);
    },

    /**
     * @function refreshGrid
     */
    refreshGrid(sLimit, eLimit) {
        const grid = document.getElementById('homework-calendar-grid');
        const monthLabel = document.getElementById('homework-month-label');
        if (monthLabel) monthLabel.innerText = this.currentViewDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });

        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        if (grid) grid.innerHTML = '';

        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const records = this.homeworkRecords.filter(r => r.homework_date === dateStr);
            const isInRange = (dateStr >= sLimit && dateStr <= eLimit);

            const tile = document.createElement('div');
            tile.className = `calendar-tile border border-slate-100 flex flex-col items-center justify-center h-16 rounded-[20px] shadow-sm transition-all duration-300 ${isInRange ? 'bg-white opacity-100 cursor-pointer' : 'bg-slate-100 opacity-5 pointer-events-none'}`;
            tile.innerHTML = `<span class="text-xs font-black ${isInRange ? 'text-slate-400' : 'text-slate-200'} mb-1">${d.getDate()}</span>`;

            if (records.length > 0 && isInRange) {
                const r = records[0];
                const status = r.status;

                if (status === '선생이 이행을 승인함') tile.classList.add('bg-blue-600', 'text-white', 'type-perfect');
                else if (status === '선생이 이행을 반려함') tile.classList.add('bg-amber-400', 'text-white', 'type-bad_effort');
                else if (status === '선생이 미이행을 반려함') tile.classList.add('bg-purple-500', 'text-white', 'type-excuse');
                else if (status === '선생이 미이행을 승인함') tile.classList.add('bg-rose-600', 'text-white', 'type-missing');

                tile.innerHTML += `<i class="fa-solid fa-file-invoice text-[10px]"></i>`;
                tile.onclick = () => this.showDetail(r);
            }
            if (grid) grid.appendChild(tile);
        }
    },

    /**
     * @function showDetail
     */
    showDetail(record) {
        const panel = document.getElementById('homework-detail-panel');
        if (!panel) return;

        let statusClass = 'text-slate-500 bg-slate-100 border-slate-200';
        if (record.status.includes('이행을 승인')) statusClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (record.status.includes('미이행을 승인')) statusClass = 'text-rose-700 bg-rose-50 border-rose-200';

        panel.innerHTML = `
            <div class="animate-fadeIn no-select">
                <div class="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                    <span class="text-[11px] font-black px-6 py-2 bg-slate-900 text-white rounded-full tracking-widest shadow-md">${record.homework_date} REPORT</span>
                    <span class="text-[11px] font-black px-6 py-2 rounded-full border-2 ${statusClass} tracking-tighter">${record.status}</span>
                </div>
                
                <div class="space-y-10">
                    <article>
                        <p class="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                            <i class="fa-solid fa-clipboard-check"></i> 숙제 과제물 및 제출 내용
                        </p>
                        <div class="p-8 bg-slate-50 rounded-[32px] border border-slate-100 text-[14px] font-bold text-slate-800 leading-relaxed shadow-sm">
                            ${record.content || '기록된 과제 내용이 없습니다.'}
                        </div>
                    </article>
                    
                    <article>
                        <p class="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                            <i class="fa-solid fa-comment-dots"></i> 미이행 사유 및 변명
                        </p>
                        <div class="p-8 bg-rose-50/50 rounded-[32px] border border-rose-100 text-[14px] font-black text-slate-700 italic leading-relaxed">
                            "${record.reason || '제출된 사유가 존재하지 않습니다.'}"
                        </div>
                    </article>
                </div>
            </div>`;
    },

    /**
     * @function highlight
     */
    highlight(type) {
        const targets = document.querySelectorAll(`.type-${type}`);
        targets.forEach(el => {
            el.style.transform = 'scale(1.3) translateY(-15px)';
            el.style.zIndex = '100';
            el.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
            setTimeout(() => {
                el.style.transform = 'scale(1) translateY(0)';
                el.style.zIndex = '10';
                el.style.boxShadow = 'none';
            }, 1800);
        });
    }
};