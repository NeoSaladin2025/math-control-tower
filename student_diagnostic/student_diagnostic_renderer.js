/**
 * student_diagnostic_renderer.js
 * 경로: student_diagnostic/student_diagnostic_renderer.js
 */
const DiagnosticRenderer = {
    renderTestList(containerId, tests, onSelectCallback) {
        const container = document.getElementById(containerId);
        if (!tests || tests.length === 0) {
            container.innerHTML = '<div class="py-20 text-center text-slate-400 font-bold">배정된 시험지가 없습니다.</div>';
            return;
        }

        container.innerHTML = tests.map(t => {
            const pkg = t.diagnostic_packages;
            const totalCount = pkg.package_items.reduce((sum, item) => 
                sum + (item.count_normal * 2) + item.count_subjective + item.count_high, 0);

            return `
                <div onclick="${onSelectCallback}(${t.id}, '${pkg.title}', ${totalCount})" 
                     class="bg-white p-6 rounded-[28px] border-2 border-slate-100 active:border-indigo-500 transition-all shadow-sm flex justify-between items-center group">
                    <div>
                        <h4 class="font-bold text-slate-800 mb-1">${pkg.title}</h4>
                        <p class="text-[11px] text-slate-400 font-black uppercase tracking-tighter">${totalCount} Questions</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-active:scale-90 transition shadow-inner">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderQuestions(containerId, count, onSelectAction) {
        const container = document.getElementById(containerId);
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `
                <div class="bg-white p-4 rounded-3xl flex items-center border border-slate-100 shadow-sm mb-3">
                    <div class="w-10 font-black text-slate-300 text-sm italic">#${i}</div>
                    <div class="flex-1 grid grid-cols-3 gap-2">
                        <button onclick="${onSelectAction}(${i}, 'C', this)" class="choice-btn py-3 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black">맞음</button>
                        <button onclick="${onSelectAction}(${i}, 'W', this)" class="choice-btn py-3 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black">틀림</button>
                        <button onclick="${onSelectAction}(${i}, 'U', this)" class="choice-btn py-3 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black">모름</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }
};