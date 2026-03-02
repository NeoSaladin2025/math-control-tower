import React, { useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from './supabaseClient';

// 권한별 컴포넌트 임포트
import TeacherMain from './teacher/TeacherMain';
import StudentMain from './student/StudentMain';
import SuperMain from './super/SuperMain';

/**
 * 진단평가 시스템 메인 애플리케이션
 * 앨리트 비서 모드: 에러 방지를 위해 표준 함수형 컴포넌트(React.FC)로 작성됨
 */
export const App: React.FC = () => {
    // 1. 상태 관리
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [userSession, setUserSession] = useState<any>(null);

    /**
     * 로그인 핸들러
     */
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!username || !password) {
            alert("이름과 비밀번호를 입력해 주세요.");
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, role, grade')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error || !data) {
                alert("로그인 정보가 올바르지 않습니다.");
            } else {
                setUserSession(data);
                alert(`${data.username}님, 환영합니다!`);
            }
        } catch (err) {
            alert("서버 연결에 문제가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 2. 로그인 후 권한별 화면 분기
    if (userSession) {
        switch (userSession.role) {
            case '선생': return <TeacherMain user={userSession} />;
            case '수퍼': return <SuperMain user={userSession} />;
            case '학생': return <StudentMain user={userSession} />;
            default: return <div>정의되지 않은 권한입니다.</div>;
        }
    }

    // 3. 로그인 폼 UI
    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>진단평가 로그인</h1>
                <form onSubmit={handleLogin} style={styles.form}>
                    <input 
                        type="text" 
                        placeholder="이름" 
                        value={username} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        style={styles.input}
                    />
                    <input 
                        type="password" 
                        placeholder="비밀번호" 
                        value={password} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// 스타일 정의
const styles: { [key: string]: React.CSSProperties } = {
    wrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    card: { background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
    title: { fontSize: '24px', color: '#1a73e8', marginBottom: '25px', fontWeight: 'bold' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' },
    button: { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#1a73e8', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};