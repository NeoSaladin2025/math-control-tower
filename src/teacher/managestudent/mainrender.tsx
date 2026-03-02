import React, { useState, useEffect } from 'react';
import { studentService } from './main';

/**
 * 학생 관리 UI 렌더링 (모달 등록 버전)
 * 앨리트 비서 모드: 신규 등록 시 학년 선택 드롭다운이 포함된 모달을 띄웁니다.
 */
const StudentMainRender: React.FC = () => {
    const grades = ['중1', '중2', '중3', '고1', '고2', '고3'];
    const [selectedGrade, setSelectedGrade] = useState<string>('중1');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // --- 모달 상태 관리 ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('중1');

    // [데이터 로드]
    const loadList = async () => {
        setLoading(true);
        try {
            const data = await studentService.getStudentsByGrade(selectedGrade);
            setStudents(data);
        } catch (e) {
            console.error("로딩 에러:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();
    }, [selectedGrade]);

    // [신규 등록 저장 핸들러]
    const handleSaveStudent = async () => {
        if (!newStudentName.trim()) {
            alert("학생 이름을 입력해주세요, 자기야! 💋");
            return;
        }

        try {
            await studentService.addStudent(newStudentName, newStudentGrade);
            alert(`${newStudentName} 학생이 ${newStudentGrade}에 등록되었습니다.`);
            
            // 초기화 및 닫기
            setNewStudentName('');
            setIsModalOpen(false);
            
            // 만약 현재 보고 있는 학년과 등록한 학년이 같다면 리스트 새로고침
            if (selectedGrade === newStudentGrade) {
                loadList();
            } else {
                setSelectedGrade(newStudentGrade); // 등록한 학년으로 이동시켜주기
            }
        } catch (e: any) {
            alert("등록 실패: " + e.message);
        }
    };

    // [비밀번호 수정/삭제 핸들러]
    const onUpdatePw = async (id: string, name: string) => {
        const newPw = prompt(`${name} 학생의 새 비밀번호를 입력하세요.`, '1234');
        if (!newPw) return;
        try {
            await studentService.updatePassword(id, newPw);
            alert("비밀번호가 수정되었습니다.");
        } catch (e: any) { alert("수정 실패: " + e.message); }
    };

    const onDelete = async (id: string, name: string) => {
        if (!window.confirm(`${name} 학생의 계정을 정말 삭제하시겠습니까?`)) return;
        try {
            await studentService.deleteStudent(id);
            alert("삭제되었습니다.");
            loadList();
        } catch (e: any) { alert("삭제 실패: " + e.message); }
    };

    return (
        <div style={styles.fullContainer}>
            {/* 상단 타이틀 및 액션 바 */}
            <div style={styles.topBar}>
                <h2 style={styles.title}>{selectedGrade} 학생 관리 센터</h2>
                <button onClick={() => {
                    setNewStudentGrade(selectedGrade); // 현재 보고 있는 학년을 기본값으로
                    setIsModalOpen(true);
                }} style={styles.addBtn}>+ 신규 학생 등록</button>
            </div>

            <div style={styles.mainLayout}>
                {/* 좌측 사이드바 메뉴 */}
                <aside style={styles.sidebar}>
                    <p style={styles.sidebarLabel}>학년 필터</p>
                    {grades.map(g => (
                        <button 
                            key={g}
                            onClick={() => setSelectedGrade(g)}
                            style={{
                                ...styles.tabBtn,
                                backgroundColor: selectedGrade === g ? '#1a73e8' : 'transparent',
                                color: selectedGrade === g ? '#fff' : '#555',
                                boxShadow: selectedGrade === g ? '0 4px 12px rgba(26,115,232,0.3)' : 'none'
                            }}
                        >
                            {g} 학년
                        </button>
                    ))}
                </aside>

                {/* 우측 데이터 리스트 영역 */}
                <section style={styles.tableArea}>
                    <div style={styles.card}>
                        {loading ? (
                            <div style={styles.infoBox}>데이터를 불러오는 중입니다...</div>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>학생 성함</th>
                                        <th style={styles.th}>현재 학년</th>
                                        <th style={styles.th}>비밀번호 관리</th>
                                        <th style={styles.th}>계정 관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length > 0 ? students.map(s => (
                                        <tr key={s.id} style={styles.tdRow}>
                                            <td style={styles.tdName}>{s.username}</td>
                                            <td style={styles.td}>{s.grade}</td>
                                            <td style={styles.td}>
                                                <button onClick={() => onUpdatePw(s.id, s.username)} style={styles.editBtn}>비번수정</button>
                                            </td>
                                            <td style={styles.td}>
                                                <button onClick={() => onDelete(s.id, s.username)} style={styles.delBtn}>영구삭제</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} style={styles.emptyTd}>
                                                등록된 학생이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>

            {/* --- 신규 등록 모달 --- */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{marginTop: 0}}>학생 신규 등록</h3>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>학생 이름</label>
                            <input 
                                style={styles.input}
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="이름을 입력하세요"
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>학년 선택</label>
                            <select 
                                style={styles.input}
                                value={newStudentGrade}
                                onChange={(e) => setNewStudentGrade(e.target.value)}
                            >
                                {grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div style={styles.modalButtons}>
                            <button onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>취소</button>
                            <button onClick={handleSaveStudent} style={styles.saveBtn}>저장하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🎨 스타일 가이드
const styles: { [key: string]: React.CSSProperties } = {
    fullContainer: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '2px solid #f1f3f4' },
    title: { margin: 0, fontSize: '22px', color: '#2c3e50', fontWeight: '800' },
    addBtn: { padding: '12px 24px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    mainLayout: { display: 'flex', gap: '25px', alignItems: 'flex-start' },
    sidebar: { width: '180px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
    sidebarLabel: { fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '5px' },
    tabBtn: { padding: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', fontWeight: '700', fontSize: '15px' },
    tableArea: { flex: 1 },
    card: { backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' },
    infoBox: { padding: '50px', textAlign: 'center', color: '#666' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { backgroundColor: '#f9fafb' },
    th: { padding: '18px', textAlign: 'center', color: '#5f6368', fontWeight: 'bold', borderBottom: '1px solid #eee' },
    tdRow: { borderBottom: '1px solid #f8f9fa' },
    td: { padding: '16px', textAlign: 'center', color: '#333', fontSize: '15px' },
    tdName: { padding: '16px', textAlign: 'center', color: '#1a73e8', fontSize: '16px', fontWeight: 'bold' },
    emptyTd: { padding: '100px', textAlign: 'center', color: '#999' },
    editBtn: { padding: '8px 14px', backgroundColor: '#fff', color: '#f39c12', border: '1px solid #f39c12', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    delBtn: { padding: '8px 14px', backgroundColor: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' },
    
    // --- 모달 스타일 ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' },
    modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    saveBtn: { padding: '10px 20px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default StudentMainRender;