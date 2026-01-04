/**
 * @engine ExtMaker
 * @description 외부 교재(test_master) 기반 시험지 팩 생성 엔진
 * @version 3.1.0
 * @author Elite Secretary (Jisoo)
 */
window.ExtMaker = {
    state: { catUuid: null, currentWorkbook: null, rounds: [], focusedRoundId: null },

    mount(cat) {
        this.state.catUuid = cat.test_id;
        this.renderLayout();
        this.loadSkeletons();
    },

    renderLayout() {
        document.getElementById('engine-header').innerHTML = `
            <div class="flex justify-between items-end">
                <div>
                    <h1 class="text-2xl font-black text-white tracking-tight">외부 시험지 출제</h1>
                    <p class="text-[10px] text-indigo-400 font-bold uppercase mt-1">Multi-Round Pack Production</p>
                </div>
                <button onclick="ExtMaker.addRound()" class="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black flex items-center gap-2 transition active:scale-95 shadow-lg shadow-indigo-900/40">
                    <i class="fa-solid fa-plus"></i> 회차 추가
                </button>
            </div>`;

        document.getElementById('engine-main').innerHTML = `
            <div class="flex flex-col gap-6 h-full">
                <div class="bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                    <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Pack Title</label>
                    <input type="text" id="inp-pack-title" class="pro-input text-lg font-bold" placeholder="예: [외부] 중간고사 대비팩">
                </div>
                <div class="flex gap-6 flex-1 min-h-0">
                    <div id="round-container" class="w-1/2 custom-scroll space-y-3"></div>
                    <div class="w-1/2 bg-slate-900/50 rounded-2xl border border-white/5 p-5 flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Unit Pool</h3>
                            <span id="unit-count" class="text-[10px] text-slate-600 font-mono">0 Units</span>
                        </div>
                        <div id="unit-pool" class="flex-1 custom-scroll space-y-1.5"></div>
                    </div>
                </div>
            </div>`;

        document.getElementById('engine-footer').innerHTML = `
            <div id="ext-status" class="text-[10px] font-mono text-slate-500 uppercase">Ready.</div>
            <button onclick="ExtMaker.savePacks()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-sm transition shadow-lg active:scale-95">SAVE PACKS</button>`;
    },

    async loadSkeletons() {
        const { data } = await _supabase.from('test_master').select('*').eq('test_id', this.state.catUuid).order('updated_at', { ascending: false });
        const list = document.getElementById('list-container');
        if (data) {
            list.innerHTML = data.map(wb => `
                <div class="p-4 bg-slate-800/40 rounded-xl border border-white/5 cursor-pointer hover:border-indigo-500/50 transition group" onclick='ExtMaker.selectWorkbook(${JSON.stringify(wb)}, this)'>
                    <div class="text-xs font-bold text-slate-300 group-hover:text-white truncate">${wb.title}</div>
                    <div class="text-[9px] text-slate-600 font-bold uppercase mt-1">${wb.grade} • ${wb.range_data?.length || 0} Units</div>
                </div>`).join('');
        }
    },

    selectWorkbook(wb, el) {
        document.querySelectorAll('#list-container > div').forEach(i => i.classList.remove('border-indigo-500', 'bg-slate-800/80'));
        el.classList.add('border-indigo-500', 'bg-slate-800/80');
        this.state.currentWorkbook = wb;
        document.getElementById('inp-pack-title').value = `${wb.title} 팩`;
        this.state.rounds = [];
        this.state.focusedRoundId = null;
        this.renderRounds();
        this.renderUnitPool();
    },

    addRound() {
        if (!this.state.currentWorkbook) return alert("마스터를 선택하세요.");
        const id = Date.now();
        this.state.rounds.push({ id, roundNum: this.state.rounds.length + 1, codes: [] });
        this.focusRound(id);
    },

    focusRound(id) {
        this.state.focusedRoundId = id;
        this.renderRounds();
        this.renderUnitPool();
    },

    renderRounds() {
        const container = document.getElementById('round-container');
        container.innerHTML = this.state.rounds.map(r => `
            <div class="p-5 rounded-2xl border-l-4 cursor-pointer transition ${r.id === this.state.focusedRoundId ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800/40 border-transparent'}" onclick="ExtMaker.focusRound(${r.id})">
                <div class="flex justify-between items-center mb-1"><span class="text-[10px] font-black text-indigo-400 uppercase">Round ${r.roundNum}</span><button onclick="ExtMaker.removeRound(${r.id}, event)" class="text-slate-600 hover:text-red-500"><i class="fa-solid fa-trash-can text-xs"></i></button></div>
                <div class="text-sm font-bold text-white mb-2">${document.getElementById('inp-pack-title').value} - ${r.roundNum}회</div>
                <div class="flex flex-wrap gap-1">${r.codes.map(c => `<span class="px-2 py-0.5 bg-slate-900 text-slate-400 text-[9px] rounded font-mono">${c}</span>`).join('')}</div>
            </div>`).join('');
    },

    renderUnitPool() {
        const container = document.getElementById('unit-pool');
        const units = this.state.currentWorkbook?.range_data || [];
        document.getElementById('unit-count').innerText = `${units.length} Units`;
        const currentCodes = this.state.rounds.find(r => r.id === this.state.focusedRoundId)?.codes || [];
        container.innerHTML = units.map(u => {
            const isActive = currentCodes.includes(u.code);
            const isUsed = this.state.rounds.filter(r => r.id !== this.state.focusedRoundId).some(r => r.codes.includes(u.code));
            let cls = `p-3 rounded-xl border mb-1 cursor-pointer transition ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : (isUsed ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 opacity-60' : 'bg-slate-800/60 border-white/5 text-slate-400')}`;
            return `<div class="${cls}" onclick="ExtMaker.toggleUnit('${u.code}')"><span class="font-mono text-[10px] mr-2">${u.code}</span><span class="text-xs font-bold">${u.title}</span></div>`;
        }).join('');
    },

    toggleUnit(code) {
        if (!this.state.focusedRoundId) return;
        const round = this.state.rounds.find(r => r.id === this.state.focusedRoundId);
        const idx = round.codes.indexOf(code);
        if (idx > -1) round.codes.splice(idx, 1);
        else round.codes.push(code);
        this.renderRounds(); this.renderUnitPool();
    },

    async savePacks() {
        const baseTitle = document.getElementById('inp-pack-title').value.trim();
        for (const r of this.state.rounds) {
            await _supabase.rpc('rpc_create_test_paper', {
                p_test_id: this.state.currentWorkbook.test_id,
                p_test_master_id: this.state.currentWorkbook.id,
                p_title: `${baseTitle} - ${r.roundNum}회`,
                p_total_questions: r.codes.length,
                p_is_internal: false,
                p_theme_config: { codes: r.codes }
            });
        }
        alert("✅ 저장 완료");
    }
};