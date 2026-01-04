/**
 * student_diagnostic_core.js
 * [수정사항] 점수(score) 계산 및 저장 로직 추가 완료!
 */
const DiagnosticCore = {
    async getAssignedTests(studentId) {
        const { data, error } = await _supabase
            .from('student_assignments')
            .select(`
                id, 
                package_id, 
                status,
                diagnostic_packages (
                    title,
                    package_items ( count_normal, count_subjective, count_high )
                )
            `)
            .eq('student_id', studentId)
            .eq('status', 'assigned');

        if (error) throw error;
        return data;
    },

    async submitAnswers(assignmentId, answers) {
        // 1. 점수 계산 프로세스
        const keys = Object.keys(answers);
        const total = keys.length;
        const correctCount = keys.filter(k => answers[k] === 'C').length; // 'C'(맞음) 개수 필터링
        
        // 정답률 계산 (0~100점)
        const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        console.log(`📊 제출 리포트 - 문항수: ${total}, 맞은개수: ${correctCount}, 최종점수: ${finalScore}`);

        // 2. DB 업데이트 (score 필드 추가!)
        const { error } = await _supabase
            .from('student_assignments')
            .update({
                student_answers: answers,
                status: 'completed',
                score: finalScore, // 👈 여기가 빠져있었네요, 주인님!
                assigned_at: new Date().toISOString() // 제출 시간 기록
            })
            .eq('id', assignmentId);

        if (error) throw error;
        return true;
    }
};