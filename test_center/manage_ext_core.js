/**
 * @module ManageExtCore
 * @version 1.8.0
 * @description 수전증 방지 시스템 + 회차별 통과 시간(pass_at) 기록 로직 통합
 */

window.ManageExtCore = {
  state: {
    container: null,
    selectedStudent: null,
    externalResults: [],
  },

  init(container, student) {
    this.state.container = container;
    this.state.selectedStudent = student;
    if (window.ManageExtRenderer)
      window.ManageExtRenderer.renderBase(container);
    if (student) this.loadStudentResults(student.id);
  },

  async loadStudentResults(studentId) {
    try {
      const { data, error } = await _supabase
        .from("student_assignments")
        .select(`*, diagnostic_packages!inner (title, type, ext_data)`)
        .eq("student_id", studentId)
        .eq("diagnostic_packages.type", "external")
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      this.state.externalResults = data || [];
      if (window.ManageExtRenderer)
        window.ManageExtRenderer.renderResultGrid(this.state.externalResults);
    } catch (error) {
      console.error("[ManageExt] 로드 실패:", error);
    }
  },

  /**
   * @method commitRoundStatus
   * @description [수정] PASS 시 보따리에 pass_at 추가, FAIL 시 제거 로직 포함
   */
  async commitRoundStatus(assignmentId, roundNum) {
    const target = this.state.externalResults.find(
      (r) => r.id === assignmentId
    );
    if (!target) return;

    // 렌더러의 임시 선택 상태 가져오기
    const tempBtn = document.querySelector(
      `[data-round-key="${assignmentId}-${roundNum}"].is-temp-active`
    );
    if (!tempBtn) {
      alert("먼저 판정(PASS 또는 RE-TEST)을 선택해주세요!");
      return;
    }

    const newStatus = tempBtn.getAttribute("data-status");
    let extStatus = target.ext_status || {};

    if (!extStatus[roundNum]) {
      extStatus[roundNum] = { status: "assigned", try: 0 };
    }

    // --- [마스터의 명령: 보따리 데이터 정밀 수술] ---
    if (newStatus === "pass") {
      // 1. PASS 확정 시 현재 ISO 시간을 기록 (일일 포인트 정산용)
      extStatus[roundNum].pass_at = new Date().toISOString();
    } else {
      // 2. RE-TEST(fail) 확정 시
      // 기존에 pass_at 기록이 있다면 삭제 (잘못 누른 경우 대비)
      if (extStatus[roundNum].pass_at) {
        delete extStatus[roundNum].pass_at;
      }
      // 시도 횟수 증가
      extStatus[roundNum].try = (extStatus[roundNum].try || 0) + 1;
    }

    extStatus[roundNum].status = newStatus;
    // --- [수술 종료] ---

    try {
      const { error } = await _supabase
        .from("student_assignments")
        .update({ ext_status: extStatus })
        .eq("id", assignmentId);

      if (error) throw error;

      target.ext_status = extStatus;
      window.ManageExtRenderer.renderResultGrid(this.state.externalResults);

      // UI 상태 유지 (아코디언 유지)
      setTimeout(() => {
        const card = document.querySelector(`[data-aid="${assignmentId}"]`);
        if (card) card.classList.add("is-open");
      }, 50);

      console.log(
        `[ManageExt] ${roundNum}회차 저장 완료:`,
        extStatus[roundNum]
      );
    } catch (e) {
      console.error(e);
      alert("저장 실패!");
    }
  },
};
