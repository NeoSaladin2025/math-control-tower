/**
 * @module MakerCore
 * @version 8.2.0
 * @description 진단평가 작성 엔진 코어 - UI 입력 필드 연동 및 DB 트랜잭션 최적화
 */

window.MakerCore = {
    state: {
        allWorkbooks: [],       
        selectedWorkbook: null, 
        units: [],              
        selection: new Map()
    },

    /**
     * 시스템 초기화 및 기초 데이터 로드
     */
    async init(container) {
        if (window.MakerRenderer) {
            window.MakerRenderer.renderBase(container);
        }

        try {
            const { data, error } = await _supabase
                .from('workbooks')
                .select('*')
                .order('title');

            if (error) throw error;
            
            this.state.allWorkbooks = data || [];
            window.MakerRenderer.renderWorkbookList(this.state.allWorkbooks);
            
        } catch (e) {
            console.error("[MakerCore] 초기 구동 실패:", e);
        }
    },

    /**
     * 특정 교재 선택 시 소단원 인벤토리 로드
     */
    async loadUnits(workbookId) {
        this.state.selectedWorkbook = this.state.allWorkbooks.find(w => w.id === workbookId);
        this.state.selection.clear(); 

        try {
            const { data, error } = await _supabase
                .from('v_workbook_unit_list')
                .select('*')
                .eq('workbook_id', workbookId)
                .order('chapter_major', { ascending: true })
                .order('chapter_minor', { ascending: true });
            
            if (error) throw error;
            
            this.state.units = data || [];
            window.MakerRenderer.renderUnitList(this.state.units);
            this.syncSummary(); 
            
        } catch (e) {
            console.error("[MakerCore] 단원 데이터 로드 실패:", e);
        }
    },

    /**
     * 단원 선택 토글 처리
     */
    toggleUnitSelection(unitData, isChecked) {
        if (isChecked) {
            this.state.selection.set(unitData.chapter_minor, { 
                unit: unitData, 
                counts: { normal: 0, subjective: 0, high: 0 },
                orders: { normal: 'sequential', subjective: 'sequential', high: 'sequential' }
            });
        } else {
            this.state.selection.delete(unitData.chapter_minor);
        }

        window.MakerRenderer.renderInputFields(Array.from(this.state.selection.values()));
        this.syncSummary();
    },

    /**
     * 유형별 문항 수량 업데이트
     */
    updateUnitCount(minorId, type, value) {
        if (this.state.selection.has(minorId)) {
            const item = this.state.selection.get(minorId);
            item.counts[type] = parseInt(value) || 0;
            this.syncSummary();
        }
    },

    /**
     * 출제 정렬 방식(순서/무작위) 업데이트
     */
    updateUnitOrder(minorId, type, mode) {
        if (this.state.selection.has(minorId)) {
            const item = this.state.selection.get(minorId);
            item.orders[type] = mode;
            window.MakerRenderer.renderInputFields(Array.from(this.state.selection.values()));
        }
    },

    /**
     * 실시간 요약 데이터 동기화
     */
    syncSummary() {
        let nSets = 0, sub = 0, hgh = 0;
        this.state.selection.forEach(v => {
            nSets += v.counts.normal;
            sub += v.counts.subjective;
            hgh += v.counts.high;
        });

        const total = (nSets * 2) + sub + hgh;
        window.MakerRenderer.updateSummary({
            normalSets: nSets,
            subjective: sub,
            high: hgh,
            totalProblems: total
        });
    },

    /**
     * [핵심] 설정된 레시피와 입력된 제목을 DB에 저장
     */
    async generatePackage() {
        // 1. 유효성 검사: 수량 확인
        const validItems = Array.from(this.state.selection.values())
            .filter(v => v.counts.normal > 0 || v.counts.subjective > 0 || v.counts.high > 0);

        if (validItems.length === 0) {
            return alert("출제할 수량을 최소 1개 이상 입력하십시오.");
        }

        // 2. 제목 입력값 확인 (Renderer의 Input 필드 참조)
        const titleInput = document.getElementById('input-package-title');
        const packageTitle = titleInput ? titleInput.value.trim() : "";

        if (!packageTitle) {
            alert("진단평가의 이름을 입력해 주십시오.");
            titleInput?.focus();
            return;
        }

        if (!confirm(`'${packageTitle}' 명칭으로 생성을 시작하시겠습니까?`)) return;

        // 3. UI 저장 중 상태 활성화
        window.MakerRenderer.setSaveLoading(true);

        try {
            // [Step 1] 패키지 마스터 정보 저장
            const { data: pkgData, error: pkgError } = await _supabase
                .from('diagnostic_packages')
                .insert({
                    workbook_id: this.state.selectedWorkbook.id,
                    title: packageTitle,
                    status: 'created'
                })
                .select();

            if (pkgError) throw pkgError;

            const pkgId = pkgData[0].id;

            // [Step 2] 상세 문항 구성 레시피 저장
            const itemsPayload = validItems.map(v => ({
                package_id: pkgId,
                chapter_minor: v.unit.chapter_minor,
                count_normal: v.counts.normal,
                count_subjective: v.counts.subjective,
                count_high: v.counts.high,
                order_normal: v.orders.normal,
                order_subjective: v.orders.subjective,
                order_high: v.orders.high
            }));

            const { error: itemError } = await _supabase
                .from('package_items')
                .insert(itemsPayload);

            if (itemError) throw itemError;

            alert("진단평가 생성이 성공적으로 완료되었습니다.");
            location.reload();

        } catch (e) {
            console.error("[MakerCore] 저장 실패:", e);
            alert("DB 저장 중 오류가 발생했습니다.");
        } finally {
            window.MakerRenderer.setSaveLoading(false);
        }
    }
};