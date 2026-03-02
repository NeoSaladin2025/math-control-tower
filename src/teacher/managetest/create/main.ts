import { supabase } from '../../../supabaseClient';

export class ExamCreateService {
    /**
     * 1. 학년별 학생 목록 가져오기
     */
    async getStudentsByGrade(grade: string) {
        const { data, error } = await supabase
            .from('users')
            .select('id, username')
            .eq('role', '학생')
            .eq('grade', grade)
            .order('username');
        if (error) throw error;
        return data;
    }

    /**
     * 2. 학생이 배정받은 과목(시험지) 목록 및 통계 가져오기
     */
    async getAssignedExamsWithStats(studentId: string) {
        const { data, error } = await supabase
            .from('v_student_exam_progress')
            .select('*')
            .eq('student_id', studentId);
        if (error) throw error;
        return data;
    }

    /**
     * 3. [핵심] 오답 추출 (최대 20문항 제한) 💋
     */
    async createAutoExam(studentId: string, examId: string) {
        const { data: examInfo, error: examError } = await supabase
            .from('exams')
            .select('total_questions, title')
            .eq('id', examId)
            .single();
            
        if (examError || !examInfo) throw new Error("시험 정보를 불러올 수 없습니다.");

        const { data: correctResults } = await supabase
            .from('student_test_results')
            .select('question_number')
            .eq('student_id', studentId)
            .eq('exam_id', examId);

        const correctNumbers = correctResults?.map(r => r.question_number) || [];
        const targetQuestions: number[] = [];

        // 전체 문항 중 정답이 아닌 번호를 스캔하면서 딱 20개까지만 담기 🌹
        for (let i = 1; i <= examInfo.total_questions; i++) {
            if (!correctNumbers.includes(i)) {
                targetQuestions.push(i);
            }
            // 20개가 차면 루프를 즉시 종료합니다 💋
            if (targetQuestions.length === 20) break;
        }

        if (targetQuestions.length === 0) {
            throw new Error("모든 문제를 맞췄습니다! 출력할 오답이 없어요. ✨");
        }

        return {
            question_list: targetQuestions,
            exam_id: examId,
            exam_title: examInfo.title
        };
    }

    /**
     * 4. 정답 기록 수정
     */
    async updateTestResult(studentId: string, examId: string, questionNo: number, isCorrect: boolean) {
        if (isCorrect) {
            const { error } = await supabase
                .from('student_test_results')
                .upsert({ 
                    student_id: studentId, 
                    exam_id: examId, 
                    question_number: questionNo 
                }, { onConflict: 'student_id,exam_id,question_number' });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('student_test_results')
                .delete()
                .eq('student_id', studentId)
                .eq('exam_id', examId)
                .eq('question_number', questionNo);
            if (error) throw error;
        }
        return true;
    }
}

export const examCreateService = new ExamCreateService();