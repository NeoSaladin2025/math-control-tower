/**
 * @file student_stats_engine.js
 * @description 2번 엔진: 버튼 UI 복구 및 리포트 데이터 연동 (Full Code)
 * @version 16.0.0 (Emergency Fix)
 */

// [핵심] 버튼 클릭 함수를 전역에 미리 선언 (안전장치)
window.triggerHighlight = function (type) {
    if (window.StudentStatsEngine) {
        window.StudentStatsEngine.highlight(type);
    } else {
        console.error("엔진이 아직 로드되지 않았습니다.");
    }
};

window.StudentStatsEngine = {
    attendanceRecords: [],
    attendanceStudentId: null,
    currentViewDate: new Date(),

    async loadAndRender(studentId) {
        if (!studentId) return;
        this.attendanceStudentId = studentId;
        this.selectedStudentId = studentId;

        const container = document.getElementById('main-view-container');
        if (!container) return;

        // UI 초기화
        container.className = "flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col relative";

        const globalStart = document.getElementById('start-date')?.value;
        if (globalStart) this.currentViewDate = new Date(globalStart);

        container.innerHTML = `
            <style>
                .calendar-tile { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; }
                .custom-scroll::-webkit-scrollbar { width: 0px; }
                /* 게이지 컨테이너 스타일 */
                .gauge-wrapper { position: relative; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; }
                .gauge-text-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
            </style>
            <div class="flex-1 flex flex-col items-center justify-center text-indigo-500">
                <i class="fa-solid fa-sync animate-spin text-4xl mb-4"></i>
                <p class="text-xs font-black uppercase tracking-widest italic">UI 보정 및 이벤트 바인딩 중...</p>
            </div>`;

        try {
            const { data, error } = await _supabase
                .from('v_student_attendance_summary')
                .select('*')
                .eq('student_id', studentId);

            if (error) throw error;

            this.attendanceRecords = (data || []).map(r => ({
                ...r,
                check_date: r.check_date ? String(r.check_date).trim() : ''
            }));

            this.renderSplitView();

        } catch (err) {
            container.innerHTML = `<div class="flex-1 flex items-center justify-center text-rose-500 font-black">데이터 로드 실패</div>`;
        }
    },

    renderSplitView() {
        const container = document.getElementById('main-view-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col h-full animate-fadeIn p-8">
                <div class="flex justify-between items-end mb-6 border-b border-slate-50 pb-6">
                    <div>
                        <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Diagnostic Center</p>
                        <h3 class="font-black text-slate-800 text-2xl flex items-center gap-2">통합 출결 분석 대시보드</h3>
                    </div>
                </div>

                <div class="flex-1 flex gap-8 min-h-0">
                    <div class="w-[420px] flex flex-col shrink-0">
                        <div class="flex justify-between items-center mb-4 px-2">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Monthly View</p>
                            <div class="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <button onclick="window.StudentStatsEngine.changeViewMonth(-1)" class="text-slate-400 hover:text-indigo-600"><i class="fa-solid fa-chevron-left text-[11px]"></i></button>
                                <span id="view-month-label" class="text-[12px] font-black text-slate-800 min-w-[80px] text-center"></span>
                                <button onclick="window.StudentStatsEngine.changeViewMonth(1)" class="text-slate-400 hover:text-indigo-600"><i class="fa-solid fa-chevron-right text-[11px]"></i></button>
                            </div>
                        </div>
                        <div id="attendance-calendar-grid" class="flex-1 grid grid-cols-7 gap-2 bg-slate-50 p-6 rounded-2xl border border-slate-100 overflow-y-auto custom-scroll shadow-inner"></div>
                    </div>

                    <div class="flex-1 flex flex-col items-center justify-between bg-indigo-50/20 rounded-2xl border border-indigo-100 p-10 shadow-inner overflow-hidden">
                        
                        <div class="flex gap-16 w-full justify-center mt-2">
                            <div class="flex flex-col items-center">
                                <div class="gauge-wrapper">
                                    <svg class="w-full h-full" viewBox="0 0 176 176">
                                        <circle cx="88" cy="88" r="75" stroke="#ffffff" stroke-width="16" fill="transparent" />
                                        <circle id="gauge-pure-path" cx="88" cy="88" r="75" stroke="#2563eb" stroke-width="16" fill="transparent" 
                                            stroke-dasharray="471.2" stroke-dashoffset="471.2" stroke-linecap="round" 
                                            transform="rotate(-90 88 88)" />
                                    </svg>
                                    <div class="gauge-text-overlay">
                                        <span id="gauge-pure-text" class="text-4xl font-black text-slate-800">0%</span>
                                        <span class="text-[9px] font-bold text-slate-400 uppercase mt-1">PURE</span>
                                    </div>
                                </div>
                                <p class="mt-3 text-[11px] font-black text-blue-600 uppercase italic">순수 출석률</p>
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="gauge-wrapper">
                                    <svg class="w-full h-full" viewBox="0 0 176 176">
                                        <circle cx="88" cy="88" r="75" stroke="#ffffff" stroke-width="16" fill="transparent" />
                                        <circle id="gauge-total-path" cx="88" cy="88" r="75" stroke="#4f46e5" stroke-width="16" fill="transparent" 
                                            stroke-dasharray="471.2" stroke-dashoffset="471.2" stroke-linecap="round" 
                                            transform="rotate(-90 88 88)" />
                                    </svg>
                                    <div class="gauge-text-overlay">
                                        <span id="gauge-total-text" class="text-4xl font-black text-slate-800">0%</span>
                                        <span class="text-[9px] font-bold text-slate-400 uppercase mt-1">TOTAL</span>
                                    </div>
                                </div>
                                <p class="mt-3 text-[11px] font-black text-indigo-600 uppercase italic">합산 출석률</p>
                            </div>
                        </div>

                        <div id="attendance-summary-buttons" class="grid grid-cols-2 gap-4 w-full max-w-md mt-6"></div>
                    </div>
                </div>
            </div>`;

        this.updateAnalytics();
    },

    changeViewMonth(offset) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + offset);
        this.updateAnalytics();
    },

    updateAnalytics() {
        const startLimit = document.getElementById('start-date')?.value || '';
        const endLimit = document.getElementById('end-date')?.value || '';
        const stats = { pure_present: 0, late: 0, absent: 0, unauthorized: 0, total: 0 };

        // 1. 통계 계산
        this.attendanceRecords.forEach(r => {
            const d = r.check_date;
            if (d >= startLimit && d <= endLimit) {
                stats.total++;
                if (r.late_status === '지각') stats.late++;
                else if (r.att_status === '출석') stats.pure_present++;
                else if (r.att_status === '결석') stats.absent++;
                else if (r.att_status === '무단결석') stats.unauthorized++;
            }
        });

        // 2. 비율 계산
        const attendanceRate = stats.total > 0 ? Math.round(((stats.pure_present + stats.late) / stats.total) * 100) : 0;
        const pureRate = stats.total > 0 ? Math.round((stats.pure_present / stats.total) * 100) : 0;

        // 3. UI 업데이트 (게이지)
        const pPath = document.getElementById('gauge-pure-path');
        const tPath = document.getElementById('gauge-total-path');
        if (pPath) {
            pPath.style.strokeDashoffset = 471.2 - (471.2 * pureRate / 100);
            document.getElementById('gauge-pure-text').innerText = `${pureRate}%`;
        }
        if (tPath) {
            tPath.style.strokeDashoffset = 471.2 - (471.2 * attendanceRate / 100);
            document.getElementById('gauge-total-text').innerText = `${attendanceRate}%`;
        }

        // 4. [복구 완료] 버튼 렌더링 코드 🚨
        const btnArea = document.getElementById('attendance-summary-buttons');
        if (btnArea) {
            btnArea.innerHTML = `
                <button onclick="window.triggerHighlight('present-tile')" class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:bg-blue-50 active:scale-95 transition-all text-center">
                    <span class="text-[10px] font-black text-blue-500 uppercase mb-1 block pointer-events-none">정상출석</span>
                    <span class="text-xl font-black text-slate-700 pointer-events-none">${stats.pure_present}회</span>
                </button>
                <button onclick="window.triggerHighlight('late-tile')" class="bg-white p-4 rounded-xl border border-amber-100 shadow-sm hover:bg-amber-50 active:scale-95 transition-all text-center">
                    <span class="text-[10px] font-black text-amber-500 uppercase mb-1 block pointer-events-none">지각기록</span>
                    <span class="text-xl font-black text-slate-700 pointer-events-none">${stats.late}회</span>
                </button>
                <button onclick="window.triggerHighlight('absent-tile')" class="bg-white p-4 rounded-xl border border-rose-100 shadow-sm hover:bg-rose-50 active:scale-95 transition-all text-center">
                    <span class="text-[10px] font-black text-rose-500 uppercase mb-1 block pointer-events-none">일반결석</span>
                    <span class="text-xl font-black text-slate-700 pointer-events-none">${stats.absent}회</span>
                </button>
                <button onclick="window.triggerHighlight('unauth-tile')" class="bg-white p-4 rounded-xl border border-purple-100 shadow-sm hover:bg-purple-50 active:scale-95 transition-all text-center">
                    <span class="text-[10px] font-black text-purple-500 uppercase mb-1 block pointer-events-none">무단결석</span>
                    <span class="text-xl font-black text-slate-700 pointer-events-none">${stats.unauthorized}회</span>
                </button>`;
        }

        // 5. 달력 갱신
        this.refreshLeftCalendar(startLimit, endLimit);

        // 6. [핵심] 리포트용 데이터 전역 저장 (4번 엔진과 연동)
        window.StudentStatsEngine.attendanceStats = {
            pureRate: pureRate,          // 순수 출석률
            totalRate: attendanceRate,   // 합산 출석률
            records: this.attendanceRecords.filter(r => r.check_date >= startLimit && r.check_date <= endLimit)
        };

        console.log("✅ 2번 엔진 데이터 저장 및 버튼 복구 완료");
    },

    refreshLeftCalendar(startLimit, endLimit) {
        const grid = document.getElementById('attendance-calendar-grid');
        const label = document.getElementById('view-month-label');
        if (!grid || !label) return;

        label.innerText = this.currentViewDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        grid.innerHTML = '';

        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const record = this.attendanceRecords.find(r => r.check_date === dateStr);
            const isInRange = (dateStr >= startLimit && dateStr <= endLimit);

            const tile = document.createElement('div');
            tile.className = `calendar-tile border border-slate-100 flex flex-col items-center justify-center h-14 rounded-xl shadow-sm transition-all ${isInRange ? 'bg-white' : 'bg-slate-50 opacity-20'}`;
            tile.innerHTML = `<span class="text-[10px] font-black mb-1 pointer-events-none">${d.getDate()}</span>`;

            if (record && isInRange) {
                const status = (record.att_status || '').trim();
                const late = (record.late_status || '').trim();

                if (late === '지각') {
                    tile.classList.add('bg-amber-400', 'text-white', 'late-tile');
                    tile.innerHTML += `<i class="fa-solid fa-clock text-[8px] pointer-events-none"></i>`;
                } else if (status === '출석') {
                    tile.classList.add('bg-blue-600', 'text-white', 'present-tile');
                    tile.innerHTML += `<i class="fa-solid fa-check text-[8px] pointer-events-none"></i>`;
                } else if (status === '결석') {
                    tile.classList.add('bg-rose-500', 'text-white', 'absent-tile');
                    tile.innerHTML += `<i class="fa-solid fa-xmark text-[8px] pointer-events-none"></i>`;
                } else if (status === '무단결석') {
                    tile.classList.add('bg-purple-600', 'text-white', 'unauth-tile');
                    tile.innerHTML += `<i class="fa-solid fa-skull text-[8px] pointer-events-none"></i>`;
                }
            }
            grid.appendChild(tile);
        }
    },

    highlight(targetClassName) {
        const targets = document.querySelectorAll(`.${targetClassName}`);
        if (targets.length === 0) {
            console.log(`[Engine] No targets found for ${targetClassName}`);
            return;
        }

        targets.forEach(el => {
            el.style.transform = 'scale(1.3) translateY(-12px) rotate(6deg)';
            el.style.zIndex = '100';
            el.style.boxShadow = '0 20px 45px rgba(0,0,0,0.25)';

            setTimeout(() => {
                el.style.transform = 'scale(1) translateY(0) rotate(0deg)';
                el.style.zIndex = '10';
                el.style.boxShadow = 'none';
            }, 1500);
        });
    }
};