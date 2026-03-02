import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import StudentMainRender from './managestudent/mainrender';
import TestMainRender from './managetest/mainrender';

interface Props {
    user: any;
}

const TeacherMain: React.FC<Props> = ({ user }) => {
    const [activeMenu, setActiveMenu] = useState<'student' | 'test'>('student');
    
    const [isPwModalOpen, setIsPwModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 비밀번호 변경 로직 (users 테이블 반영 및 제한 해제)
    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            return alert('비밀번호를 입력해주세요.');
        }
        if (newPassword !== confirmPassword) {
            return alert('비밀번호가 일치하지 않습니다.');
        }

        try {
            // users 테이블의 해당 사용자 비밀번호 업데이트
            const { error } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', user.id);

            if (error) throw error;

            alert('비밀번호가 성공적으로 변경되었습니다.');
            setIsPwModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            alert('변경 실패: ' + error.message);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h2 style={styles.logo}>진단평가 관리 시스템</h2>
                    <nav style={styles.nav}>
                        <button 
                            onClick={() => setActiveMenu('student')}
                            style={{
                                ...styles.navItem, 
                                color: activeMenu === 'student' ? '#1a73e8' : '#636e72',
                                borderBottom: activeMenu === 'student' ? '4px solid #1a73e8' : '4px solid transparent'
                            }}
                        >
                            학생관리
                        </button>
                        <button 
                            onClick={() => setActiveMenu('test')}
                            style={{
                                ...styles.navItem, 
                                color: activeMenu === 'test' ? '#1a73e8' : '#636e72',
                                borderBottom: activeMenu === 'test' ? '4px solid #1a73e8' : '4px solid transparent'
                            }}
                        >
                            진단평가관리
                        </button>
                    </nav>
                </div>

                <div style={styles.headerRight}>
                    <span style={styles.userInfo}>
                        <strong>{user.username}</strong> 선생님 접속 중
                    </span>
                    <button 
                        onClick={() => setIsPwModalOpen(true)} 
                        style={styles.passwordBtn}
                    >
                        비밀번호 변경
                    </button>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={styles.logoutBtn}
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.contentWrapper}>
                    {activeMenu === 'student' ? (
                        <StudentMainRender />
                    ) : (
                        <TestMainRender />
                    )}
                </div>
            </main>

            {isPwModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>비밀번호 변경</h3>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>새 비밀번호</label>
                            <input 
                                type="password" 
                                style={styles.input} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>비밀번호 확인</label>
                            <input 
                                type="password" 
                                style={styles.input} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <div style={styles.modalActions}>
                            <button onClick={handleUpdatePassword} style={styles.saveBtn}>변경하기</button>
                            <button onClick={() => {
                                setIsPwModalOpen(false);
                                setNewPassword('');
                                setConfirmPassword('');
                            }} style={styles.cancelBtn}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { minHeight: '100vh', backgroundColor: '#f8f9fa', width: '100%', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '80px', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '50px' },
    logo: { fontSize: '22px', color: '#1a73e8', fontWeight: '900', letterSpacing: '-1px', margin: 0 },
    nav: { display: 'flex', gap: '5px', height: '80px' },
    navItem: { border: 'none', background: 'none', fontSize: '17px', fontWeight: '700', cursor: 'pointer', padding: '0 25px', height: '100%', transition: 'all 0.2s ease', outline: 'none' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    userInfo: { fontSize: '14px', color: '#495057', backgroundColor: '#f1f3f5', padding: '8px 16px', borderRadius: '30px', fontWeight: '500' },
    passwordBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#495057' },
    logoutBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#fa5252' },
    main: { padding: '20px', width: '100%', maxWidth: '100%', flex: 1, display: 'flex', boxSizing: 'border-box' },
    contentWrapper: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', width: '100%', minHeight: 'calc(100vh - 140px)', boxSizing: 'border-box' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { margin: '0 0 20px 0', textAlign: 'center', fontSize: '18px', color: '#2d3436' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '13px', color: '#636e72', marginBottom: '5px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dee2e6', boxSizing: 'border-box', outline: 'none' },
    modalActions: { display: 'flex', gap: '10px', marginTop: '25px' },
    saveBtn: { flex: 1, padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TeacherMain;