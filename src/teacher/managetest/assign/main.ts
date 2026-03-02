import { supabase } from '../../../supabaseClient';

/**
 * ExamAssignService
 * 앨리트 비서 모드: 학생별 시험 배정 및 뷰(View) 기반의 상세 통계를 관리합니다.
 */
export class ExamAssignService {
    
    /**
     * 1. 학년별 학생 목록 가져오기 (배정 대상자 조회)
     */
    async getStudentsByGrade(grade: string) {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, grade')
            .eq('role', '학생')
            .eq('grade', grade)
            .order('username', { ascending: true });

        if (error) {
            console.error("학생 로드 실패:", error.message);
            return [];
        }
        return data || [];
    }

    /**
     * 2. 모든 등록된 진단평가 목록 가져오기 (배정할 시험지 선택용)
     */
    async getAllExams() {
        const { data, error } = await supabase
            .from('exams')
            .select('id, title, total_questions')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("시험 목록 로드 실패:", error.message);
            return [];
        }
        return data || [];
    }

    /**
     * 3. 특정 학생에게 진단평가 배정하기
     */
    async assignExam(studentId: string, examId: string) {
        // 중복 배정 체크
        const { data: existing } = await supabase
            .from('exam_assignments')
            .select('id')
            .eq('student_id', studentId)
            .eq('exam_id', examId)
            .maybeSingle(); // single() 대신 maybeSingle()을 써야 데이터가 없을 때 에러가 안 나요 💋

        if (existing) {
            throw new Error("이미 이 학생에게 배정된 시험입니다.");
        }

        const { data, error } = await supabase
            .from('exam_assignments')
            .insert([{
                student_id: studentId,
                exam_id: examId
                // status는 이제 진행률로 대체하므로 넣지 않아도 됨 🌹
            }])
            .select();

        if (error) throw new Error(`배정 실패: ${error.message}`);
        return data;
    }

    /**
     * 4. 특정 학생의 배정 현황 및 상세 통계 가져오기 (View 연동)
     * DB 뷰(v_student_exam_progress)를 사용하여 성능을 극대화합니다.
     */
    async getStudentAssignments(studentId: string) {
        const { data, error } = await supabase
            .from('v_student_exam_progress')
            .select('*')
            .eq('student_id', studentId)
            .order('assignment_id', { ascending: false });

        if (error) {
            console.error("배정 현황 로드 실패:", error.message);
            return [];
        }

        // 화면 렌더러 스타일과 필드명을 맞추기 위해 리매핑 💋
        return data.map(item => ({
            id: item.assignment_id,
            exam_id: item.exam_id,
            title: item.exam_title,
            total: item.total_questions,
            correctCount: item.correct_count,
            wrongCount: item.wrong_count,
            accuracy: item.accuracy_rate
        }));
    }

    /**
     * 5. 배정 취소
     */
    async cancelAssignment(assignmentId: string) {
        const { error } = await supabase
            .from('exam_assignments')
            .delete()
            .eq('id', assignmentId);

        if (error) throw new Error(`취소 실패: ${error.message}`);
        return true;
    }
}

export const examAssignService = new ExamAssignService();