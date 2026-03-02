import { supabase } from '../../supabaseClient';

/**
 * 학생 관리 데이터 로직 전담 클래스
 * 앨리트 비서 모드: DB와의 모든 통신(CRUD)을 관리합니다.
 */
export class StudentService {
    
    // 1. 특정 학년의 학생 목록 가져오기
    async getStudentsByGrade(grade: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', '학생')
            .eq('grade', grade)
            .order('username', { ascending: true });

        if (error) {
            console.error("목록 로드 실패:", error.message);
            return [];
        }
        return data || [];
    }

    // 2. 신규 학생 등록 (초기비번 1234)
    async addStudent(name: string, grade: string) {
        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                username: name, 
                password: '1234', 
                role: '학생', 
                grade: grade 
            }])
            .select();

        if (error) throw new Error(error.message);
        return data;
    }

    // 3. 학생 비밀번호 수정
    async updatePassword(id: string, newPw: string) {
        const { error } = await supabase
            .from('users')
            .update({ password: newPw })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }

    // 4. 학생 계정 삭제
    async deleteStudent(id: string) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }
}

// 싱글톤 패턴으로 인스턴스 하나만 내보내기
export const studentService = new StudentService();