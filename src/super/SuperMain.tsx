import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * [인터페이스] 사용자 데이터 구조 정의
 */
interface UserData {
    id: string;
    username: string;
    role: string;
    grade: string | null;
    created_at: string;
}

interface Props {
    user: any; // 로그인된 수퍼 관리자 정보
}

/**
 * 수퍼 관리자 메인 대시보드
 * 앨리트 비서 모드: 시스템 전체 사용자 관리 및 현황 모니터링 기능
 */
const SuperMain: React.FC<Props> = ({ user }) => {
    // 1. 상태 관리 (사용자 목록, 로딩 상태)
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    /**
     * 전체 사용자 목록 불러오기
     */
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // 앨리트 비서 모드: users 테이블의 모든 레코드를 최신순으로 조회합니다.
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUsers(data);
        } catch (error: any) {
            console.error("[시스템 오류] 데이터 로드 실패:", error.message);
            alert("사용자 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 호출
    useEffect(() => {
        fetchUsers();
    }, []);

    // 2. UI 렌더링
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h2 style={styles.title}>통합 관리자 패널</h2>
                    <p style={styles.welcome}>접속 계정: <strong>{user.username} (수퍼)</strong></p>
                </div>
                <button onClick={() => window.location.reload()} style={styles.logoutBtn}>로그아웃</button>
            </header>

            <main style={styles.main}>
                <section style={styles.statsSection}>
                    <div style={styles.statCard}>전체 사용자: <strong>{users.length}</strong>명</div>
                    <div style={styles.statCard}>선생님: <strong>{users.filter(u => u.role === '선생').length}</strong>명</div>
                    <div style={styles.statCard}>학생: <strong>{users.filter(u => u.role === '학생').length}</strong>명</div>
                </section>

                <section style={styles.tableSection}>
                    <h3 style={styles.sectionTitle}>사용자 계정 리스트</h3>
                    {loading ? (
                        <p>데이터를 불러오는 중입니다...</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeadRow}>
                                    <th style={styles.th}>이름</th>
                                    <th style={styles.th}>역할</th>
                                    <th style={styles.th}>학년</th>
                                    <th style={styles.th}>생성일</th>
                                    <th style={styles.th}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={styles.tableRow}>
                                        <td style={styles.td}>{u.username}</td>
                                        <td style={styles.td}>
                                            <span style={{...styles.badge, backgroundColor: u.role === '수퍼' ? '#e74c3c' : u.role === '선생' ? '#f39c12' : '#3498db'}}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{u.grade || '-'}</td>
                                        <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <button style={styles.editBtn}>수정</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    );
};

// 3. 스타일 정의 (수퍼 관리자용 다크&블루 테마)
const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #2c3e50', paddingBottom: '15px' },
    headerLeft: { textAlign: 'left' },
    title: { margin: 0, color: '#2c3e50', fontSize: '24px' },
    welcome: { margin: '5px 0 0', color: '#7f8c8d' },
    logoutBtn: { padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    main: { display: 'flex', flexDirection: 'column', gap: '20px' },
    statsSection: { display: 'flex', gap: '20px' },
    statCard: { flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '18px', textAlign: 'center', border: '1px solid #e1e8ed' },
    tableSection: { background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    sectionTitle: { marginTop: 0, marginBottom: '20px', color: '#34495e', textAlign: 'left' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeadRow: { borderBottom: '2px solid #ecf0f1', textAlign: 'left' },
    th: { padding: '12px', color: '#7f8c8d', fontWeight: 'bold' },
    td: { padding: '12px', borderBottom: '1px solid #ecf0f1', textAlign: 'left' },
    tableRow: { transition: 'background 0.2s' },
    badge: { padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: 'bold' },
    editBtn: { padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }
};

export default SuperMain;