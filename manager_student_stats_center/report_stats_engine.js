/**
 * @file report_stats_engine.js
 * @description 4번 리포트 엔진: 테두리 삭제, 모든 코멘트 섹션(기본 포함) 완전 편집 및 삭제 가능
 * @version 21.0.2 (No Border & Full Edit & Title Edit & No Stamp)
 */

window.ReportStatsEngine = {
    receivedData: { att: null, hw: null },

    syncData() {
        if (window.StudentStatsEngine && window.StudentStatsEngine.attendanceStats) {
            this.receivedData.att = window.StudentStatsEngine.attendanceStats;
        }
        if (window.HomeworkStatsEngine && window.HomeworkStatsEngine.homeworkStats) {
            this.receivedData.hw = window.HomeworkStatsEngine.homeworkStats;
        }
    },

    async loadAndRender(studentId) {
        this.syncData();
        
        if (!this.receivedData.att || !this.receivedData.hw) {
            alert("대시보드 데이터가 없습니다. 먼저 조회를 진행해주세요.");
            return;
        }

        this.generateAIComments();
        this.renderDualWorkspace();
    },

    generateAIComments() {
        const pureRate = this.receivedData.att.pureRate; 
        if (pureRate >= 95) this.aiCommentAtt = `수업 참여도가 매우 훌륭하며 성실함이 돋보입니다. 지금의 등원 습관은 상위권 도약의 밑거름이 될 것입니다.`;
        else if (pureRate >= 80) this.aiCommentAtt = `안정적인 출석 상태를 유지하고 있습니다. 간헐적인 지각 부분만 개선된다면 학습 효율이 극대화될 것입니다.`;
        else this.aiCommentAtt = `최근 출석 패턴이 불규칙하여 학습 리듬 관리가 필요합니다. 가정에서의 따뜻한 격려와 지도가 절실합니다.`;

        const perfRate = this.receivedData.hw.perfRate;
        if (perfRate >= 90) this.aiCommentHw = `과제 완성도가 전문가 수준입니다. 자기주도 학습 능력이 탁월하여 심화 학습도 충분히 소화할 것으로 기대됩니다.`;
        else if (perfRate >= 70) this.aiCommentHw = `주어진 과제를 성실히 수행하고 있습니다. 오답 정리 등 마무리에 조금 더 집중한다면 완벽한 학습이 될 것입니다.`;
        else this.aiCommentHw = `학습 동기 부여가 필요한 시점입니다. 과제는 실력 향상의 지름길임을 인지할 수 있도록 지속적인 관심이 필요합니다.`;
        
        this.aiCommentFree = `위 학생은 무한한 잠재력을 가지고 있습니다. 학원과 가정이 연계하여 지도한다면 괄목할 만한 성장을 이룰 것입니다.`;
    },

    renderDualWorkspace() {
        const container = document.getElementById('main-view-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col h-full w-full animate-fadeIn bg-slate-50">
                <div class="px-10 py-6 border-b bg-white flex justify-between items-center shadow-sm">
                    <div>
                        <h3 class="font-black text-slate-800 text-xl italic uppercase tracking-tighter">통합 보고서 센터</h3>
                        <p class="text-[10px] font-bold text-slate-400">데이터 검증 및 코멘트 작성</p>
                    </div>
                </div>

                <div class="flex-1 flex divide-x divide-slate-200 min-h-0 overflow-hidden">
                    <div class="flex-1 p-8 flex flex-col relative overflow-y-auto custom-scroll bg-white">
                        <div class="flex flex-col h-full">
                            <p class="font-black text-indigo-600 mb-4 uppercase text-sm italic flex items-center gap-2">
                                <i class="fa-solid fa-user-clock"></i> 출결 종합 의견
                            </p>
                            <textarea id="comment-attendance" class="flex-1 w-full p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl outline-none focus:border-indigo-400 transition-all text-sm font-medium shadow-inner resize-none leading-relaxed text-slate-700">${this.aiCommentAtt}</textarea>
                        </div>
                    </div>
                    <div class="flex-1 p-8 flex flex-col relative overflow-y-auto custom-scroll bg-white">
                        <div class="flex flex-col h-full">
                            <p class="font-black text-emerald-600 mb-4 uppercase text-sm italic flex items-center gap-2">
                                <i class="fa-solid fa-book-open"></i> 학습 수행 의견
                            </p>
                            <textarea id="comment-homework" class="flex-1 w-full p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl outline-none focus:border-emerald-400 transition-all text-sm font-medium shadow-inner resize-none leading-relaxed text-slate-700">${this.aiCommentHw}</textarea>
                        </div>
                    </div>
                </div>

                <div class="h-24 bg-white border-t flex items-center justify-center gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <button onclick="ReportStatsEngine.openConfigModal()" class="px-12 py-4 bg-slate-900 text-white rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3">
                        <i class="fa-solid fa-print"></i> 리포트 옵션 및 출력
                    </button>
                </div>
            </div>`;
    },

    openConfigModal() {
        const overlay = document.getElementById('report-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        
        overlay.innerHTML = `
            <div class="bg-white w-[500px] rounded-[40px] p-10 shadow-2xl animate-fadeIn relative text-left">
                <div class="flex justify-between items-center mb-8">
                    <h4 class="text-xl font-black text-slate-800">출력 옵션 설정</h4>
                    <button onclick="document.getElementById('report-modal-overlay').classList.add('hidden')" class="text-slate-300 hover:text-slate-500"><i class="fa-solid fa-xmark text-2xl"></i></button>
                </div>
                
                <div class="space-y-4">
                    <label class="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors">
                        <span class="font-bold text-indigo-900">출결 리포트 생성</span>
                        <input type="checkbox" id="chk-att" checked class="w-6 h-6 accent-indigo-600 cursor-pointer">
                    </label>
                    <label class="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center cursor-pointer hover:bg-emerald-100 transition-colors">
                        <span class="font-bold text-emerald-900">숙제 리포트 생성</span>
                        <input type="checkbox" id="chk-hw" checked class="w-6 h-6 accent-emerald-600 cursor-pointer">
                    </label>
                    
                    <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 mb-3">상세 모드 설정</p>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="view-mode" value="summary" class="accent-slate-800"> 요약 (그래프만)</label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="view-mode" value="detail" checked class="accent-slate-800"> 상세 (타임라인 포함)</label>
                        </div>
                    </div>
                </div>

                <div class="mt-8">
                    <button onclick="ReportStatsEngine.showFullPreview()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all">
                        리포트 미리보기 시작
                    </button>
                </div>
            </div>`;
    },

    create2ColGrid(list, type) {
        let html = '';
        for (let i = 0; i < list.length; i += 2) {
            html += `<tr style="border-bottom: 1px solid #e2e8f0;">`;
            html += this.createCell(list[i], type);
            if (list[i+1]) html += this.createCell(list[i+1], type);
            else html += `<td colspan="2"></td>`;
            html += `</tr>`;
        }
        return html;
    },

    createCell(item, type) {
        if (type === 'att') {
            const isAbsent = item.att_status.includes('결석') || item.att_status.includes('무단');
            const note = isAbsent ? '-' : (item.late_status || '-');
            const statusClass = item.att_status === '출석' ? 'text-blue-600' : 'text-rose-500';
            return `<td style="padding: 8px 4px; font-weight:600; color:#334155;">${item.check_date}</td><td style="padding: 8px 4px; font-weight:700;" class="${statusClass}">${item.att_status} <span style="font-weight:400; color:#94a3b8; font-size:10px;">(${note})</span></td>`;
        } else {
            let color = '#64748b'; let shortStatus = item.status;
            if (item.status === '선생이 이행을 승인함') { color = '#059669'; shortStatus = '이행 승인'; }
            else if (item.status === '선생이 이행을 반려함') { color = '#d97706'; shortStatus = '이행 반려'; }
            else if (item.status === '선생이 미이행을 승인함') { color = '#e11d48'; shortStatus = '미이행 승인'; }
            else if (item.status === '선생이 미이행을 반려함') { color = '#7c3aed'; shortStatus = '미이행 반려'; }
            return `<td style="padding: 8px 4px; font-weight:600; color:#334155;">${item.homework_date}</td><td style="padding: 8px 4px; font-weight:700; color:${color}; font-size:10px;">${shortStatus}</td>`;
        }
    },

    createCircleGraph(rate, color) {
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (rate / 100) * circumference;
        return `
            <div class="relative w-20 h-20 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="${radius}" stroke="#e2e8f0" stroke-width="8" fill="none" />
                    <circle cx="40" cy="40" r="${radius}" stroke="${color}" stroke-width="8" fill="none" 
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-sm font-black text-slate-800">${rate}%</span>
                </div>
            </div>`;
    },

    showFullPreview() {
        const studentName = window.StudentFetcher?.selectedStudentId || "대상 학생";
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        const attComment = document.getElementById('comment-attendance')?.value || "";
        const hwComment = document.getElementById('comment-homework')?.value || "";
        const freeComment = this.aiCommentFree || "";

        const includeAtt = document.getElementById('chk-att').checked;
        const includeHw = document.getElementById('chk-hw').checked;
        const isDetail = document.querySelector('input[name="view-mode"]:checked').value === 'detail';

        const att = this.receivedData.att || { pureRate: 0, totalRate: 0, records: [] };
        const hw = this.receivedData.hw || { perfRate: 0, effortRate: 0, records: [] };

        const validStatuses = ['선생이 이행을 승인함', '선생이 이행을 반려함', '선생이 미이행을 승인함', '선생이 미이행을 반려함'];
        const filteredHwRecords = hw.records.filter(r => validStatuses.includes(r.status));

        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            alert("팝업 차단을 해제해주세요.");
            return;
        }
        
        const finalHtml = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>종합 학습 리포트 - ${studentName}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;900&family=Noto+Sans+KR:wght@300;400;700;900&display=swap');
                    body { font-family: 'Noto Sans KR', sans-serif; background: #52525b; padding: 40px; display: flex; justify-content: center; margin: 0; }
                    
                    /* [수정] 테두리 제거 버전 */
                    .page { 
                        width: 210mm; min-height: 290mm; 
                        background: white; padding: 15mm; 
                        box-shadow: 0 0 50px rgba(0,0,0,0.5); 
                        position: relative; box-sizing: border-box; 
                        display: flex; flex-direction: column; margin-bottom: 30px;
                        /* border: 2px solid #1e293b; -> 삭제됨 */
                    }
                    
                    @media print {
                        body { background: white; padding: 0; display: block; margin: 0; }
                        .page { 
                            width: 100%; margin: 0; padding: 10mm; 
                            min-height: 290mm; border: none; 
                            box-shadow: none; page-break-after: always;
                        }
                        .page:last-child { page-break-after: auto; }
                        /* .fixed-border { ... } -> 삭제됨 */
                        .no-print { display: none !important; }
                        .avoid-break { page-break-inside: avoid; break-inside: avoid; }
                        tr { page-break-inside: avoid; }
                    }

                    .toolbar { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #18181b; padding: 10px 20px; borderRadius: 50px; display: flex; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999; }
                    .btn-tool { background: transparent; border: none; color: white; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; }
                    .btn-tool:hover { background: #27272a; }
                    .btn-save { background: #059669; }
                    .btn-print { background: #3b82f6; opacity: 0.5; cursor: not-allowed; }
                    .btn-print.active { opacity: 1; cursor: pointer; }

                    table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; margin-top: 10px; }
                    th { text-align: left; padding: 8px 6px; color: #334155; font-weight: 800; border-bottom: 2px solid #334155; font-size: 10px; background-color: #f1f5f9; }
                    td { padding: 8px 6px; vertical-align: middle; border-bottom: 1px solid #e2e8f0; }
                    
                    .section-title { font-family: 'Noto Serif KR', serif; font-size: 18px; font-weight: 900; color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 5px; margin-bottom: 15px; }
                    
                    .legend-box { display: flex; gap: 15px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 10px; flex-wrap: wrap; border: 1px solid #e2e8f0; }
                    .legend-item { display: flex; align-items: center; gap: 6px; font-weight: 700; color: #475569; }
                    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

                    /* [핵심] 편집 가능한 섹션 스타일 (모든 섹션 동일 적용) */
                    .editable-section { 
                        border: 1px dashed #cbd5e1; 
                        border-radius: 8px; 
                        padding: 15px; 
                        margin-bottom: 20px; 
                        transition: all 0.2s;
                        position: relative;
                        page-break-inside: avoid;
                    }
                    .editable-section:hover { border-color: #3b82f6; background: #f8fafc; }
                    .editable-title { 
                        font-family: 'Noto Serif KR', serif; 
                        font-size: 14px; font-weight: 900; 
                        color: #1e293b; 
                        border: none; background: transparent; 
                        width: 100%; outline: none; margin-bottom: 10px;
                        border-bottom: 1px solid transparent;
                    }
                    .editable-title:focus { border-bottom-color: #3b82f6; }
                    .editable-content { 
                        font-size: 12px; line-height: 1.6; color: #334155; 
                        outline: none; min-height: 60px; 
                    }
                    
                    /* 삭제 버튼 (호버 시 표시) */
                    .btn-delete {
                        position: absolute; top: 10px; right: 10px;
                        color: #cbd5e1; cursor: pointer;
                        display: none;
                    }
                    .editable-section:hover .btn-delete { display: block; }
                    .btn-delete:hover { color: #ef4444; }

                    .btn-add-section {
                        width: 100%; border: 2px dashed #cbd5e1; 
                        color: #94a3b8; font-weight: bold; 
                        padding: 15px; border-radius: 10px; 
                        cursor: pointer; transition: all 0.2s;
                        display: flex; align-items: center; justify-content: center; gap: 10px;
                    }
                    .btn-add-section:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
                </style>
            </head>
            <body>
                <div class="no-print toolbar">
                    <button onclick="downloadCleanHTML()" class="btn-tool btn-save"><i class="fa-solid fa-download"></i> 리포트 저장 (작성완료)</button>
                    <button id="btnPrint" onclick="window.print()" class="btn-tool btn-print btn-disabled"><i class="fa-solid fa-print"></i> PDF 인쇄</button>
                    <button onclick="window.close()" class="btn-tool"><i class="fa-solid fa-xmark"></i> 닫기</button>
                </div>

                ${includeAtt ? `
                <div class="page">
                    <div class="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-8">
                        <div><h1 class="text-3xl font-black text-slate-900 tracking-tighter" style="font-family: 'Noto Serif KR', serif;">종합 출결 분석 보고서</h1><p class="text-[11px] font-bold text-slate-500">통합 학습 관리 시스템 제공 데이터</p></div>
                        <div class="text-right"><p class="text-[10px] font-bold text-slate-400">발행일: ${new Date().toLocaleDateString()}</p></div>
                    </div>
                    <div class="flex justify-between mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div><span class="text-xs font-bold text-slate-400 block mb-1">학생명</span><span class="text-2xl font-black text-slate-800" style="font-family: 'Noto Serif KR', serif;">${studentName}</span></div>
                        <div class="text-right"><span class="text-xs font-bold text-slate-400 block mb-1">분석 기간</span><span class="text-lg font-bold text-slate-800">${startDate} ~ ${endDate}</span></div>
                    </div>
                    <div class="mb-10 avoid-break">
                        <div class="section-title">출결 핵심 지표</div>
                        <div class="grid grid-cols-2 gap-10">
                            <div class="flex items-center gap-6 p-4 border border-slate-100 rounded-xl bg-slate-50">
                                ${this.createCircleGraph(att.pureRate, '#4f46e5')}
                                <div><span class="text-xs font-bold text-slate-500 block">순수 출석률</span><span class="text-2xl font-black text-indigo-600">${att.pureRate}%</span></div>
                            </div>
                            <div class="flex items-center gap-6 p-4 border border-slate-100 rounded-xl bg-slate-50">
                                ${this.createCircleGraph(att.totalRate, '#3b82f6')}
                                <div><span class="text-xs font-bold text-slate-500 block">합산 출석률</span><span class="text-2xl font-black text-blue-500">${att.totalRate}%</span></div>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-4 text-center">* 순수 출석률: 지각 제외 / 합산 출석률: 지각 포함 등원 비율</div>
                    </div>
                    ${isDetail ? `<div class="flex-1 avoid-break"><div class="section-title">일자별 출결 상세 기록</div><table class="w-full"><thead><tr><th width="20%">날짜</th><th width="30%">상태</th><th width="20%">날짜</th><th width="30%">상태</th></tr></thead><tbody>${this.create2ColGrid(att.records, 'att')}</tbody></table></div>` : '<div class="flex-1"></div>'}
                </div>` : ''}

                ${includeHw ? `
                <div class="page">
                    <div class="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-8">
                        <div><h1 class="text-3xl font-black text-slate-900 tracking-tighter" style="font-family: 'Noto Serif KR', serif;">과제 수행 분석 보고서</h1><p class="text-[11px] font-bold text-slate-500">자기주도 학습 성취도 정밀 분석</p></div>
                        <div class="text-right"><p class="text-[10px] font-bold text-slate-400">발행일: ${new Date().toLocaleDateString()}</p></div>
                    </div>
                    <div class="flex justify-between mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div><span class="text-xs font-bold text-slate-400 block mb-1">학생명</span><span class="text-2xl font-black text-slate-800" style="font-family: 'Noto Serif KR', serif;">${studentName}</span></div>
                        <div class="text-right"><span class="text-xs font-bold text-slate-400 block mb-1">분석 기간</span><span class="text-lg font-bold text-slate-800">${startDate} ~ ${endDate}</span></div>
                    </div>
                    <div class="mb-10 avoid-break">
                        <div class="section-title">과제 수행 핵심 지표</div>
                        <div class="grid grid-cols-2 gap-10">
                            <div class="flex items-center gap-6 p-4 border border-slate-100 rounded-xl bg-slate-50">
                                ${this.createCircleGraph(hw.perfRate, '#059669')}
                                <div><span class="text-xs font-bold text-slate-500 block">정상 이행률</span><span class="text-2xl font-black text-emerald-600">${hw.perfRate}%</span></div>
                            </div>
                            <div class="flex items-center gap-6 p-4 border border-slate-100 rounded-xl bg-slate-50">
                                ${this.createCircleGraph(hw.effortRate, '#d97706')}
                                <div><span class="text-xs font-bold text-slate-500 block">성실 시도율</span><span class="text-2xl font-black text-amber-500">${hw.effortRate}%</span></div>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-4 text-center">* 정상이행률: 과제 완벽 수행 / 성실시도율: 미흡하더라도 수행 후 제출</div>
                    </div>
                    ${isDetail ? `<div class="mb-6 flex-1 avoid-break"><div class="section-title">일자별 과제 수행 기록</div><table class="w-full"><thead><tr><th width="20%">날짜</th><th width="30%">상태</th><th width="20%">날짜</th><th width="30%">상태</th></tr></thead><tbody>${this.create2ColGrid(filteredHwRecords, 'hw')}</tbody></table><div class="legend-box"><div class="legend-item"><div class="legend-dot bg-emerald-600"></div>이행 승인: 과제 완벽 수행</div><div class="legend-item"><div class="legend-dot bg-amber-500"></div>이행 반려: 수행했으나 보완 필요</div><div class="legend-item"><div class="legend-dot bg-rose-600"></div>미이행 승인: 과제 미제출 (무단)</div><div class="legend-item"><div class="legend-dot bg-purple-500"></div>미이행 반려: 미제출이나 사유 인정됨</div></div></div>` : '<div class="flex-1"></div>'}
                </div>` : ''}

                <div class="page">
                    <div class="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-8">
                        <div>
                            <h1 contenteditable="true" class="text-3xl font-black text-slate-900 tracking-tighter outline-none cursor-text hover:bg-slate-100 rounded px-2 -ml-2 transition-colors" style="font-family: 'Noto Serif KR', serif;">담임 교사 종합 의견</h1>
                            <p class="text-[11px] font-bold text-slate-500">학생 맞춤형 정밀 분석 및 지도 계획</p>
                        </div>
                        <div class="text-right"><p class="text-[10px] font-bold text-slate-400">발행일: ${new Date().toLocaleDateString()}</p></div>
                    </div>

                    <div class="flex flex-col flex-1" id="comment-container">
                        ${includeAtt ? `
                        <div class="editable-section">
                            <input type="text" class="editable-title" value="1. 출결 현황 및 생활 태도">
                            <div class="editable-content" contenteditable="true">${attComment}</div>
                            <i class="fa-solid fa-trash btn-delete" onclick="this.parentElement.remove()"></i>
                        </div>` : ''}

                        ${includeHw ? `
                        <div class="editable-section">
                            <input type="text" class="editable-title" value="2. 과제 수행 및 학습 성취도">
                            <div class="editable-content" contenteditable="true">${hwComment}</div>
                            <i class="fa-solid fa-trash btn-delete" onclick="this.parentElement.remove()"></i>
                        </div>` : ''}

                        <div class="editable-section">
                            <input type="text" class="editable-title" value="3. 담임 교사 종합 의견">
                            <div class="editable-content" contenteditable="true">${freeComment}</div>
                            <i class="fa-solid fa-trash btn-delete" onclick="this.parentElement.remove()"></i>
                        </div>
                    </div>
                    
                    <div class="no-print mt-4">
                        <button onclick="addSection()" class="btn-add-section"><i class="fa-solid fa-plus-circle"></i> 의견 섹션 추가하기</button>
                    </div>

                </div>

                <script>
                    function addSection() {
                        const container = document.getElementById('comment-container');
                        const div = document.createElement('div');
                        div.className = 'editable-section';
                        div.innerHTML = \`
                            <input type="text" class="editable-title" value="새로운 의견 제목">
                            <div class="editable-content" contenteditable="true">내용을 자유롭게 작성하세요.</div>
                            <i class="fa-solid fa-trash btn-delete" onclick="this.parentElement.remove()"></i>
                        \`;
                        container.appendChild(div);
                    }

                    function downloadCleanHTML() {
                        const reportClone = document.documentElement.cloneNode(true);
                        
                        const noPrints = reportClone.querySelectorAll('.no-print');
                        noPrints.forEach(el => el.remove());
                        
                        // 삭제 버튼 제거
                        const deleteBtns = reportClone.querySelectorAll('.btn-delete');
                        deleteBtns.forEach(el => el.remove());

                        // input -> h4 변환 (문서화)
                        const inputs = reportClone.querySelectorAll('input.editable-title');
                        inputs.forEach(input => {
                            const h4 = document.createElement('h4');
                            h4.className = 'section-title';
                            h4.style.fontSize = '14px';
                            h4.style.border = 'none';
                            h4.style.marginBottom = '5px';
                            h4.innerText = input.value;
                            input.replaceWith(h4);
                        });

                        // contenteditable 제거
                        const editables = reportClone.querySelectorAll('[contenteditable]');
                        editables.forEach(el => el.removeAttribute('contenteditable'));

                        // 편집용 스타일 제거 (테두리 등)
                        const sections = reportClone.querySelectorAll('.editable-section');
                        sections.forEach(sec => {
                            sec.style.border = 'none';
                            sec.style.padding = '0 0 20px 0';
                            sec.style.background = 'transparent';
                        });

                        const blob = new Blob([reportClone.outerHTML], {type: 'text/html'});
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'Analysis_Report_${studentName}.html';
                        a.click();
                        
                        const printBtn = document.getElementById('btnPrint');
                        printBtn.classList.remove('btn-disabled');
                        printBtn.classList.add('active');
                        printBtn.innerHTML = '<i class="fa-solid fa-print"></i> PDF 인쇄 (활성화됨)';
                        alert("문서가 확정 저장되었습니다! 인쇄 버튼을 눌러주세요.");
                    }
                </script>
            </body>
            </html>`;

        previewWindow.document.write(finalHtml);
        previewWindow.document.close();
    }
};