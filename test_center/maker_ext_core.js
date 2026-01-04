/**
 * @module MakerExtCore
 * @version 1.1.0
 * @description 외부 진단평가 코어 - JSONB 데이터 바인딩 및 수정/저장 로직 통합
 */

window.MakerExtCore = {
    /**
     * @property {Object} state - 모듈 내부 상태 관리
     */
    state: {
        editingPackageId: null // 현재 수정 중인 패키지의 고유 ID (null일 경우 신규 생성 모드)
    },

    /**
     * @method init
     * @description 엔진 구동 시 호출되며 인터페이스 초기화 및 상태 리셋 수행
     */
    init(container) {
        this.state.editingPackageId = null; // 수정 상태 초기화
        if (window.MakerExtRenderer) {
            window.MakerExtRenderer.renderBase(container);
        }
    },

    /**
     * @method addRound
     * @description 신규 회차 입력 필드를 동적으로 생성하고 화면에 추가
     */
    addRound() {
        const container = document.getElementById('ext-rounds-container');
        const hint = document.getElementById('empty-hint');
        
        if (hint) hint.classList.add('hidden'); // 가이드 메시지 숨김

        const nextIndex = document.querySelectorAll('.round-item').length + 1;
        const roundDOM = window.MakerExtRenderer.createRoundDOM(nextIndex);
        
        container.appendChild(roundDOM);
        roundDOM.querySelector('input').focus(); // 생성 즉시 입력 포커스 부여
    },

    /**
     * @method loadPackageForEdit
     * @description 사이드바에서 선택한 외부 패키지 데이터를 불러와 UI에 바인딩 (수정 모드 진입)
     */
    async loadPackageForEdit(packageId) {
        try {
            // 해당 ID의 패키지 정보 단건 조회
            const { data, error } = await _supabase
                .from('diagnostic_packages')
                .select('*')
                .eq('id', packageId)
                .single();

            if (error) throw error;

            // 수정 모드 상태로 전환 및 ID 저장
            this.state.editingPackageId = data.id;
            
            // 1. 패키지 제목 복구
            document.getElementById('input-ext-package-title').value = data.title;
            
            // 2. 회차 컨테이너 초기화
            const container = document.getElementById('ext-rounds-container');
            const hint = document.getElementById('empty-hint');
            if (hint) hint.classList.add('hidden');
            container.innerHTML = "";

            // 3. 마법의 보따리(JSONB) 데이터를 해체하여 입력 필드 복원
            if (data.ext_data && Array.isArray(data.ext_data)) {
                data.ext_data.forEach((round, idx) => {
                    const roundDOM = window.MakerExtRenderer.createRoundDOM(idx + 1);
                    roundDOM.querySelector('input').value = round.content;
                    container.appendChild(roundDOM);
                });
            }

            // 4. 저장 버튼 시각적 피드백 변경
            const btnText = document.getElementById('btn-ext-text');
            if (btnText) {
                btnText.innerHTML = '<i class="fa-solid fa-check-double"></i> 패키지 수정 내용 저장';
            }
            
            console.log(`[MakerExt] 패키지 ID ${packageId} 수정 모드 활성화`);

        } catch (e) {
            console.error("[MakerExt] 데이터 로드 에러:", e);
            alert("패키지 데이터를 불러오는 중 오류가 발생했습니다.");
        }
    },

    /**
     * @method saveExternalPackage
     * @description 신규 패키지 생성(Insert) 또는 기존 패키지 수정(Update)을 통합 처리
     */
    async saveExternalPackage() {
        const titleInput = document.getElementById('input-ext-package-title');
        const title = titleInput ? titleInput.value.trim() : "";
        
        // 데이터 검증
        if (!title) {
            alert("패키지 제목을 입력해 주십시오.");
            titleInput.focus();
            return;
        }

        // 현재 화면의 모든 회차 입력값 수집
        const roundInputs = document.querySelectorAll('.round-content-input');
        const extData = Array.from(roundInputs).map((input, idx) => ({
            round: idx + 1,
            content: input.value.trim() || `${idx + 1}회차 진단평가`
        }));

        if (extData.length === 0) {
            alert("최소 1개 이상의 회차를 추가해야 합니다.");
            return;
        }

        const confirmMsg = this.state.editingPackageId 
            ? `'${title}' 패키지의 수정 사항을 반영하시겠습니까?` 
            : `'${title}' 패키지를 새로 생성하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        // UI 처리 상태 활성화
        window.MakerExtRenderer.setLoading(true);

        try {
            // 공통 저장 페이로드 구성
            const payload = {
                title: title,
                type: 'external',
                ext_data: extData,
                status: 'created',
                workbook_id: null // 외부 엔진은 교재 종속성 없음
            };

            let response;

            if (this.state.editingPackageId) {
                // [기능 추가] 수정 모드: 기존 ID를 기반으로 Update 수행
                response = await _supabase
                    .from('diagnostic_packages')
                    .update(payload)
                    .eq('id', this.state.editingPackageId);
            } else {
                // 신규 모드: 새로운 행 Insert 수행
                response = await _supabase
                    .from('diagnostic_packages')
                    .insert(payload);
            }

            if (response.error) throw response.error;

            alert(this.state.editingPackageId ? "성공적으로 수정되었습니다." : "새로운 외부 패키지가 생성되었습니다.");
            
            // 시스템 갱신을 위해 페이지 리로드
            location.reload();

        } catch (err) {
            console.error("[MakerExt] 데이터 저장 중 치명적 오류:", err);
            alert("저장 처리 중 오류가 발생했습니다. 다시 시도해 주십시오.");
        } finally {
            window.MakerExtRenderer.setLoading(false);
        }
    }
};