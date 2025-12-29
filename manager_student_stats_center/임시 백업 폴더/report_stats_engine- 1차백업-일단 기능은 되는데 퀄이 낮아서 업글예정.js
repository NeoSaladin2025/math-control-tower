/**
 * @file report_stats_engine.js
 * @description 4번 리포트 엔진: 전역 변수 직접 참조형 (데이터 유실 원천 봉쇄)
 * @version 6.0.0 (Final Fix)
 */

window.ReportStatsEngine = {
    receivedData: { att: null, hw: null },

    syncData() {
        // [검증] 전역 객체에서 직접 가져옴
        const attData = window.StudentStatsEngine?.attendanceStats;
        const hwData = window.HomeworkStatsEngine?.homeworkStats;

        if (attData) {
            this.receivedData.att = attData;
            console.log("🟢 [4번 엔진] 출결 데이터 수신 성공:", attData);
        } else {
            console.error("🔴 [4번 엔진] 출결 데이터 없음! 2번 엔진에서 조회를 먼저 하세요.");
            this.receivedData.att = null;
        }

        if (hwData) {
            this.receivedData.hw = hwData;
            console.log("🟢 [4번 엔진] 숙제 데이터 수신 성공:", hwData);
        } else {
            console.error("🔴 [4번 엔진] 숙제 데이터 없음! 3번 엔진에서 조회를 먼저 하세요.");
            this.receivedData.hw = null;
        }
    },

    async loadAndRender(studentId) {
        this.syncData();
        
        // 데이터가 하나라도 없으면 경고창 띄우고 중단
        if (!this.receivedData.att || !this.receivedData.hw) {
            alert("⚠️ 데이터가 동기화되지 않았습니다.\n\n반드시 [출결 대시보드]와 [숙제 대시보드]를 각각 한번씩 클릭하여 데이터를 로드해주세요!");
            return;
        }

        this.generateAIComments();
        this.renderDualWorkspace();
    },

    generateAIComments() {
        const att = this.receivedData.att;
        const hw = this.receivedData.hw;

        // 2번 엔진 값을 그대로 사용
        const pureRate = att.pureRate;
        if (pureRate >= 95) this.aiCommentAtt = `수업 참여도가 매우 훌륭하며 성실함이 돋보입니다. 지금의 등원 습관은 상위권 도약의 밑거름이 될 것입니다.`;
        else if (pureRate >= 80) this.aiCommentAtt = `안정적인 출석 상태를 유지하고 있습니다. 간헐적인 지각 부분만 개선된다면 학습 효율이 극대화될 것입니다.`;
        else this.aiCommentAtt = `최근 출석 패턴이 불규칙하여 학습 리듬 관리가 필요합니다. 가정에서의 따뜻한 격려와 지도가 절실합니다.`;

        // 3번 엔진 값을 그대로 사용
        const perfRate = hw.perfRate;
        if (perfRate >= 90) this.aiCommentHw = `과제 완성도가 전문가 수준입니다. 자기주도 학습 능력이 탁월하여 심화 학습도 충분히 소화할 것으로 기대됩니다.`;
        else if (perfRate >= 70) this.aiCommentHw = `주어진 과제를 성실히 수행하고 있습니다. 오답 정리 등 마무리에 조금 더 집중한다면 완벽한 학습이 될 것입니다.`;
        else this.aiCommentHw = `학습 동기 부여가 필요한 시점입니다. 과제는 실력 향상의 지름길임을 인지할 수 있도록 지속적인 관심이 필요합니다.`;
    },

    renderDualWorkspace() {
        const container = document.getElementById('main-view-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col h-full w-full animate-fadeIn">
                <div class="px-10 py-6 border-b bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 class="font-black text-slate-800 text-xl italic uppercase tracking-tighter">통합 보고서 센터</h3>
                        <p class="text-[10px] font-bold text-slate-400">대시보드 데이터를 정밀 동기화하여 출력합니다.</p>
                    </div>
                </div>

                <div class="flex-1 flex divide-x divide-slate-100 min-h-0 overflow-hidden">
                    <div class="flex-1 p-8 flex flex-col relative overflow-y-auto custom-scroll">
                        <div class="flex flex-col h-full">
                            <p class="font-black text-indigo-600 mb-4 uppercase text-sm italic flex items-center gap-2">
                                <i class="fa-solid fa-pen-nib"></i> 출결 종합 의견
                            </p>
                            <textarea id="comment-attendance" class="flex-1 w-full p-8 bg-white border-2 border-slate-100 rounded-[40px] outline-none focus:border-indigo-400 transition-all text-sm font-bold shadow-inner resize-none leading-relaxed">${this.aiCommentAtt}</textarea>
                        </div>
                    </div>
                    <div class="flex-1 p-8 flex flex-col relative overflow-y-auto custom-scroll">
                        <div class="flex flex-col h-full">
                            <p class="font-black text-emerald-600 mb-4 uppercase text-sm italic flex items-center gap-2">
                                <i class="fa-solid fa-pen-nib"></i> 학습 수행 의견
                            </p>
                            <textarea id="comment-homework" class="flex-1 w-full p-8 bg-white border-2 border-slate-100 rounded-[40px] outline-none focus:border-emerald-400 transition-all text-sm font-bold shadow-inner resize-none leading-relaxed">${this.aiCommentHw}</textarea>
                        </div>
                    </div>
                </div>

                <div class="h-24 bg-white border-t flex items-center justify-center gap-4">
                    <button onclick="ReportStatsEngine.openConfigModal()" class="px-12 py-4 bg-slate-900 text-white rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3">
                        <i class="fa-solid fa-print"></i> 리포트 생성 및 미리보기
                    </button>
                </div>
            </div>`;
    },

    openConfigModal() {
        const overlay = document.getElementById('report-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="bg-white w-[600px] rounded-[48px] p-10 shadow-2xl animate-fadeIn relative text-left">
                <div class="flex justify-between items-center mb-8">
                    <h4 class="text-2xl font-black text-slate-800 italic">Report Configuration</h4>
                    <button onclick="document.getElementById('report-modal-overlay').classList.add('hidden')" class="text-slate-300 hover:text-slate-500"><i class="fa-solid fa-xmark text-2xl"></i></button>
                </div>
                
                <div class="space-y-6">
                    <div class="border-2 border-slate-50 rounded-[32px] overflow-hidden group hover:border-indigo-100 transition-colors">
                        <div class="p-5 bg-slate-50 flex items-center gap-4">
                            <input type="checkbox" id="chk-att" checked class="w-5 h-5 accent-indigo-600 cursor-pointer">
                            <span class="text-sm font-black text-slate-700">출결 데이터 포함</span>
                        </div>
                        <div class="p-6 bg-white flex gap-8">
                            <label class="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-indigo-600"><input type="radio" name="att-mode" value="summary" checked class="accent-indigo-600"> 요약 그래프</label>
                            <label class="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-indigo-600"><input type="radio" name="att-mode" value="detail" class="accent-indigo-600"> 요약 + 타임라인</label>
                        </div>
                    </div>

                    <div class="border-2 border-slate-50 rounded-[32px] overflow-hidden group hover:border-emerald-100 transition-colors">
                        <div class="p-5 bg-slate-50 flex items-center gap-4">
                            <input type="checkbox" id="chk-hw" checked class="w-5 h-5 accent-emerald-600 cursor-pointer">
                            <span class="text-sm font-black text-slate-700">과제 데이터 포함</span>
                        </div>
                        <div class="p-6 bg-white flex gap-8">
                            <label class="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-emerald-600"><input type="radio" name="hw-mode" value="summary" checked class="accent-emerald-600"> 요약 그래프</label>
                            <label class="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-emerald-600"><input type="radio" name="hw-mode" value="detail" class="accent-emerald-600"> 요약 + 리스트</label>
                        </div>
                    </div>
                </div>

                <div class="mt-10">
                    <button onclick="ReportStatsEngine.showFullPreview()" class="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-sm hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> 미리보기 생성
                    </button>
                </div>
            </div>`;
    },

    showFullPreview() {
        const studentName = window.StudentFetcher?.selectedStudentId || "대상 학생";
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const attComment = document.getElementById('comment-attendance').value;
        const hwComment = document.getElementById('comment-homework').value;

        const isDetail = document.querySelector('input[name="att-mode"]:checked').value === 'detail' || document.querySelector('input[name="hw-mode"]:checked').value === 'detail';

        const att = this.receivedData.att;
        const hw = this.receivedData.hw;

        const previewWindow = window.open('', '_blank');
        
        const finalHtml = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>Report Preview - ${studentName}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&display=swap');
                    body { font-family: 'Noto Sans KR', sans-serif; background: #52525b; padding: 40px; display: flex; justify-content: center; }
                    .page { width: 210mm; min-height: 297mm; background: white; padding: 20mm; box-shadow: 0 0 50px rgba(0,0,0,0.5); position: relative; box-sizing: border-box; }
                    
                    @media print {
                        body { background: white; padding: 0; display: block; }
                        .page { width: 100%; box-shadow: none; margin: 0; padding: 0; }
                        .no-print { display: none !important; }
                        .print-padding { padding: 15mm; }
                    }

                    .toolbar { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #18181b; padding: 10px 20px; borderRadius: 50px; display: flex; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999; }
                    .btn-tool { background: transparent; border: none; color: white; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; font-size: 13px; }
                    .btn-tool:hover { background: #27272a; }
                    .btn-disabled { opacity: 0.3; cursor: not-allowed !important; pointer-events: none; }
                    .btn-save { background: #059669; }
                    .btn-save:hover { background: #047857; }
                    .btn-print { background: #3b82f6; }
                    .btn-print:hover { background: #2563eb; }

                    .gauge-container { width: 100%; background: #f1f5f9; border-radius: 6px; height: 8px; overflow: hidden; margin-top: 8px; }
                    .gauge-fill { height: 100%; border-radius: 6px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
                    th { text-align: left; padding: 8px 4px; color: #64748b; font-weight: 800; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 10px; }
                    td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 600; vertical-align: top; }
                </style>
            </head>
            <body>
                <div class="no-print toolbar">
                    <button onclick="downloadHTML()" class="btn-tool btn-save"><i class="fa-solid fa-download"></i> 리포트 파일 저장 (필수)</button>
                    <button id="btnPrint" onclick="window.print()" class="btn-tool btn-print btn-disabled"><i class="fa-solid fa-print"></i> PDF 저장 / 인쇄</button>
                    <button onclick="window.close()" class="btn-tool"><i class="fa-solid fa-xmark"></i> 닫기</button>
                </div>

                <div class="page print-padding" id="report-content">
                    <div class="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-10">
                        <div>
                            <h1 class="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Analysis Report</h1>
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Comprehensive Student Performance Data</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Generated Date</p>
                            <p class="text-sm font-black text-slate-800">${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6 mb-10">
                        <div class="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-sm">
                            <span class="text-xs font-bold opacity-60 uppercase tracking-widest">Student Name</span>
                            <span class="text-2xl font-black">${studentName}</span>
                        </div>
                        <div class="border-2 border-slate-900 p-6 rounded-2xl flex justify-between items-center text-slate-900 shadow-sm">
                            <span class="text-xs font-bold opacity-60 uppercase tracking-widest">Target Period</span>
                            <span class="text-lg font-black">${startDate} ~ ${endDate}</span>
                        </div>
                    </div>

                    <div class="mb-10">
                        <h2 class="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <span class="w-1 h-4 bg-slate-900"></span> Key Performance Metrics
                        </h2>
                        <div class="grid grid-cols-2 gap-x-12 gap-y-8">
                            <div class="space-y-6">
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-bold text-slate-500 uppercase">순수 출석률 (Pure)</span>
                                        <span class="text-xl font-black text-blue-600">${att.pureRate}%</span>
                                    </div>
                                    <div class="gauge-container"><div class="gauge-fill bg-blue-600" style="width: ${att.pureRate}%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-bold text-slate-500 uppercase">합산 출석률 (Total)</span>
                                        <span class="text-xl font-black text-indigo-600">${att.totalRate}%</span>
                                    </div>
                                    <div class="gauge-container"><div class="gauge-fill bg-indigo-600" style="width: ${att.totalRate}%"></div></div>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-bold text-slate-500 uppercase">정상 이행률 (Perfect)</span>
                                        <span class="text-xl font-black text-emerald-600">${hw.perfRate}%</span>
                                    </div>
                                    <div class="gauge-container"><div class="gauge-fill bg-emerald-600" style="width: ${hw.perfRate}%"></div></div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-bold text-slate-500 uppercase">성실 시도율 (Effort)</span>
                                        <span class="text-xl font-black text-amber-500">${hw.effortRate}%</span>
                                    </div>
                                    <div class="gauge-container"><div class="gauge-fill bg-amber-500" style="width: ${hw.effortRate}%"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${isDetail ? `
                    <div class="mb-10">
                        <h2 class="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <span class="w-1 h-4 bg-slate-900"></span> Detailed Timeline
                        </h2>
                        <div class="flex gap-8 items-start">
                            <div class="flex-1">
                                <h3 class="text-[10px] font-black text-indigo-600 border-b-2 border-indigo-600 pb-2 mb-2 uppercase">Attendance Detail</h3>
                                <table>
                                    <thead><tr><th width="30%">Date</th><th width="30%">Status</th><th>Note</th></tr></thead>
                                    <tbody>
                                        ${att.records.map(r => {
                                            const isAbsent = r.att_status.includes('결석') || r.att_status.includes('무단');
                                            const note = isAbsent ? '-' : (r.late_status || '-');
                                            const statusClass = r.att_status === '출석' ? 'text-blue-600' : 'text-rose-500';
                                            return `<tr><td>${r.check_date}</td><td class="${statusClass}">${r.att_status}</td><td class="text-slate-400">${note}</td></tr>`;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-[10px] font-black text-emerald-600 border-b-2 border-emerald-600 pb-2 mb-2 uppercase">Homework Detail</h3>
                                <table>
                                    <thead><tr><th width="30%">Date</th><th>Status</th></tr></thead>
                                    <tbody>
                                        ${hw.records.map(r => {
                                            const isPerfect = r.status.includes('승인');
                                            const statusClass = isPerfect ? 'text-emerald-600' : 'text-amber-600';
                                            return `<tr><td>${r.homework_date}</td><td class="${statusClass} truncate">${r.status}</td></tr>`;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>` : ''}

                    <div class="mt-auto">
                        <div class="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                            <h3 class="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-quote-left text-slate-300"></i> Teacher's Comments
                            </h3>
                            <div class="grid grid-cols-1 gap-6 text-sm font-medium text-slate-700 leading-relaxed">
                                <div>
                                    <p class="text-[10px] font-black text-indigo-500 uppercase mb-2">Attendance Review</p>
                                    <div style="white-space: pre-wrap;">${attComment}</div>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-emerald-500 uppercase mb-2">Academic Review</p>
                                    <div style="white-space: pre-wrap;">${hwComment}</div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-8 text-right">
                            <p class="text-sm font-black text-slate-900">Instructor Signature: __________________________</p>
                        </div>
                    </div>
                </div>

                <script>
                    function downloadHTML() {
                        const content = document.documentElement.outerHTML;
                        const blob = new Blob([content], {type: 'text/html'});
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'Analysis_Report_${studentName}.html';
                        a.click();
                        
                        const printBtn = document.getElementById('btnPrint');
                        printBtn.classList.remove('btn-disabled');
                        printBtn.innerHTML = '<i class="fa-solid fa-print"></i> PDF 저장 / 인쇄 (활성화됨)';
                        alert("파일 저장이 완료되었습니다. 이제 인쇄가 가능합니다.");
                    }
                </script>
            </body>
            </html>`;

        previewWindow.document.write(finalHtml);
        previewWindow.document.close();
    },

    generateLockOverlay(target) {
        return `<div class="lock-indicator flex flex-col items-center justify-center bg-slate-50/80 absolute inset-0 z-10 rounded-[40px] border-2 border-dashed border-slate-200">
                    <i class="fa-solid fa-lock text-slate-300 text-3xl mb-4"></i>
                    <p class="text-xs font-black text-rose-500 text-center uppercase tracking-widest">${target} 센터 조회 필요</p>
                </div>`;
    }
};