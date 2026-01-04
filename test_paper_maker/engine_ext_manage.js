/**
 * @engine ExtManage
 * @description 오리지널 test_paper_maker.html의 진도 관리(Progress) 로직 완전 이식
 * @version 1.2.0
 */
window.ExtManage = {
    state: {
        catUuid: null,
        currentStudent: null,
        assignmentRecord: null
    },

    /**
     * @function mount
     */
    mount(cat) {
        this.state.catUuid = cat.test_id;
        this.renderLayout();
        this.loadStudents();
    },

    /**
     * @function renderLayout
     */
    renderLayout() {
        const header = document.getElementById('engine-header');
        const main = document.getElementById('engine-main');
        const footer = document.getElementById('engine-footer');

        header.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <div>
                    <h1 class="text-2xl font-black text-white tracking-tight">외부 진도 관리</h1>
                    <p class="text-[10px] text-indigo-400 font-bold uppercase mt-1 tracking-widest">Original Progress Logic Integrated</p>
                </div>
                <div id="dash-info" class="hidden flex items-center gap-4">
                    <div class="flex flex-col items-end">
                        <span id="dash-title" class="text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-lg border border-slate-700"></span>
                        <span id="dash-meta" class="text-[9px] text-slate-500 mt-1 font-mono uppercase"></span>
                    </div>
                </div>
            </div>`;

        main.innerHTML = `
            <div id="dash-board" class="h-full w-full pro-scroll overflow-y-auto pr-2 pb-10">
                <div class="h-full flex flex-col items-center justify-center opacity-20">
                    <i class="fa-solid fa-user-check text-6xl mb-4"></i>
                    <p class="text-xs font-bold uppercase tracking-[0.3em]">Select Student to Review Progress</p>
                </div>
            </div>`;

        footer.innerHTML = `
            <div id="manage-status" class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">System Synchronized.</div>
            <div id="action-area" class="hidden">
                <button onclick="ExtManage.executeAction('delete')" class="px-4 py-2 bg-red-900/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black hover:bg-red-500 hover:text-white transition">DELETE ASSIGNMENT</button>
            </div>`;
    },

    /**
     * @function loadStudents
     */
    async loadStudents() {
        const container = document.getElementById('list-container');
        const { data, error } = await _supabase.from('users').select('username, name').eq('role', 'student').order('name');
        
        if (error) return;

        container.innerHTML = data.map(u => `
            <div class="p-4 bg-slate-800/40 rounded-xl border border-white/5 cursor-pointer hover:border-indigo-500 transition-all flex items-center gap-3 group" 
                 onclick="ExtManage.loadProgress('${u.username}', this)">
                <div class="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white transition-colors">${u.name[0]}</div>
                <div class="text-xs font-bold text-slate-300 group-hover:text-white">${u.name}</div>
            </div>`).join('');
    },

    /**
     * @function loadProgress
     * @description 오리지널 코드의 데이터 호출 및 렌더링 로직 (isPast, isCur, Locked 분기)
     */
    async loadProgress(sid, el) {
        document.querySelectorAll('#list-container > div').forEach(i => i.classList.remove('border-indigo-500', 'bg-indigo-500/10'));
        el.classList.add('border-indigo-500', 'bg-indigo-500/10');

        this.state.currentStudent = sid;

        // 원본 로직: 최신 배정 기록 1건 호출
        const { data: rec } = await _supabase
            .from('test_assignment_records')
            .select('*')
            .eq('student_id', sid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const board = document.getElementById('dash-board');
        if (!rec) {
            board.innerHTML = "<div class='h-full flex items-center justify-center text-slate-600 text-[10px] font-black uppercase'>No Progress Records Found.</div>";
            document.getElementById('dash-info').classList.add('hidden');
            document.getElementById('action-area').classList.add('hidden');
            return;
        }

        this.state.assignmentRecord = rec;
        document.getElementById('dash-info').classList.remove('hidden');
        document.getElementById('action-area').classList.remove('hidden');
        document.getElementById('dash-title').innerText = rec.pack_title;
        document.getElementById('dash-meta').innerText = `Current Round: ${rec.current_round}`;

        // 원본 로직: test_master를 통해 전체 회차(Round) 수 파악
        const { count: totalRounds } = await _supabase
            .from('test_papers')
            .select('*', { count: 'exact', head: true })
            .eq('test_master_id', rec.test_master_id);

        let html = '<div class="space-y-4 pt-4 px-2">';
        for (let i = 1; i <= (totalRounds || 0); i++) {
            const isCur = (i === rec.current_round);
            const isPast = (i < rec.current_round);
            const cardCls = isCur ? 'border-indigo-500 bg-indigo-500/5' : (isPast ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 opacity-40');
            const accentColor = isCur ? 'text-indigo-400' : (isPast ? 'text-emerald-500' : 'text-slate-600');

            html += `
                <div class="p-6 rounded-2xl border ${cardCls} flex justify-between items-center transition-all">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center font-black ${accentColor}">${i}</div>
                        <div>
                            <div class="text-[10px] font-black uppercase tracking-widest mb-1 ${accentColor}">Round ${i}</div>
                            <div class="text-sm font-bold text-white">${rec.pack_title} - ${i}회차</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        ${isPast ? `
                            <div class="text-right">
                                <div class="text-[10px] font-black text-emerald-500 tracking-[0.2em] mb-1 uppercase">Completed</div>
                                <div class="text-[9px] text-slate-500 font-mono uppercase">${rec.history_log?.[i]?.passed_at ? new Date(rec.history_log[i].passed_at).toLocaleDateString() : 'RECORDED'}</div>
                            </div>
                        ` : (isCur ? `
                            <div class="flex gap-2">
                                <button onclick="ExtManage.executeAction('retry')" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] transition active:scale-95">RETRY</button>
                                <button onclick="ExtManage.executeAction('pass')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] shadow-lg shadow-indigo-900/40 transition active:scale-95">PASS & NEXT</button>
                            </div>
                        ` : `
                            <div class="flex items-center gap-2 text-slate-700">
                                <i class="fa-solid fa-lock text-[10px]"></i>
                                <span class="text-[10px] font-black uppercase tracking-widest">Locked</span>
                            </div>
                        `)}
                    </div>
                </div>`;
        }
        board.innerHTML = html + '</div>';
    },

    /**
     * @function executeAction
     * @description 오리지널 rpc_assignment_pencil_and_eraser 호출 인터페이스
     */
    async executeAction(act) {
        const msg = act === 'delete' ? "배정 기록을 완전히 삭제하시겠습니까?" : 
                    (act === 'retry' ? "재시험(Try Count 증가)을 집행하시겠습니까?" : "해당 라운드를 통과 처리하시겠습니까?");
        
        if (!confirm(`[System Confirmation]\n${msg}`)) return;

        const { error } = await _supabase.rpc('rpc_assignment_pencil_and_eraser', { 
            p_action: act, 
            p_record_id: this.state.assignmentRecord.id 
        });

        if (error) {
            alert("Execution Error: " + error.message);
        } else {
            // 오리지널 UI 경험을 위해 상태 재로드
            this.loadProgress(this.state.currentStudent, document.querySelector('#list-container .border-indigo-500'));
        }
    }
};