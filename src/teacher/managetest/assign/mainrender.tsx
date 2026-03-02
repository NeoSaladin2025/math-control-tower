import React, { useState, useEffect } from 'react';
import { examAssignService } from './main';

const ExamAssignRender: React.FC = () => {
    // 초1~초6 제거! 중고등 전용으로 
    const [grades] = useState(['중1', '중2', '중3', '고1', '고2', '고3']);
    const [selectedGrade, setSelectedGrade] = useState('중1');
    const [students, setStudents] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [statusList, setStatusList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadInitialData = async () => {
        const eData = await examAssignService.getAllExams();
        setExams(eData);
    };

    const loadStudents = async (grade: string) => {
        const sData = await examAssignService.getStudentsByGrade(grade);
        setStudents(sData);
        setSelectedStudent(null);
        setStatusList([]);
    };

    const loadStatus = async (studentId: string) => {
        setLoading(true);
        try {
            const data = await examAssignService.getStudentAssignments(studentId);
            setStatusList(data);
        } catch (error) {
            console.error("현황 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); loadStudents(selectedGrade); }, [selectedGrade]);

    const handleAssign = async () => {
        if (!selectedStudent || !selectedExamId) {
            alert("학생과 시험지를 모두 선택해 주십시오");
            return;
        }
        try {
            await examAssignService.assignExam(selectedStudent.id, selectedExamId);
            alert("배정 성공! 🌹");
            loadStatus(selectedStudent.id); 
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm("배정을 취소할까요? ")) return;
        await examAssignService.cancelAssignment(id);
        loadStatus(selectedStudent.id);
    };

    return (
        <div style={styles.container}>
            <section style={styles.left}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>진단 배정 설정</h3>
                    
                    <label style={styles.label}>학년 선택</label>
                    <select style={styles.select} value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <label style={styles.label}>학생 명단 ({selectedGrade})</label>
                    <div style={styles.studentList}>
                        {students.length > 0 ? students.map(s => (
                            <div 
                                key={s.id} 
                                style={{...styles.studentItem, backgroundColor: selectedStudent?.id === s.id ? '#e8f0fe' : '#fff'}}
                                onClick={() => { setSelectedStudent(s); loadStatus(s.id); }}
                            >
                                {s.username}
                            </div>
                        )) : <div style={{padding:'10px', color:'#999'}}>해당 학년 학생이 없어.</div>}
                    </div>

                    <label style={styles.label}>배정할 시험지</label>
                    <select style={styles.select} value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
                        <option value="">시험지를 선택하세요</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>

                    <button style={styles.assignBtn} onClick={handleAssign}>선택 학생 배정하기</button>
                </div>
            </section>

            <section style={styles.right}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        {selectedStudent ? `${selectedStudent.username} 학생 배정 현황` : '학생을 선택해줘! 🌹'}
                    </h3>
                    
                    {loading ? <p>데이터 분석 중...</p> : (
                        <div style={styles.gridContainer}>
                            {statusList.length > 0 ? statusList.map(item => (
                                <div key={item.id} style={styles.statusCard}>
                                    <div style={styles.statusHeader}>
                                        <span style={styles.examTitle}>{item.title}</span>
                                        <button style={styles.cancelBtn} onClick={() => handleCancel(item.id)}>취소</button>
                                    </div>
                                    
                                    <div style={styles.statsRow}>
                                        <div style={styles.statBox}>
                                            <div style={styles.statLabel}>총 문항</div>
                                            <div style={styles.statValue}>{item.total}</div>
                                        </div>
                                        <div style={styles.statBox}>
                                            <div style={styles.statLabel}>오답(미완)</div>
                                            <div style={{...styles.statValue, color: '#ff4d4f'}}>{item.wrongCount}</div>
                                        </div>
                                        <div style={styles.statBox}>
                                            <div style={styles.statLabel}>정답률</div>
                                            <div style={{...styles.statValue, color: '#52c41a'}}>{item.accuracy}%</div>
                                        </div>
                                    </div>

                                    <div style={styles.progressBg}>
                                        <div style={{...styles.progressFill, width: `${item.accuracy}%`}} />
                                    </div>
                                </div>
                            )) : <p style={{color: '#999'}}>배정된 내역이 없습니다. </p>}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', gap: '20px', padding: '10px' },
    left: { flex: 1 },
    right: { flex: 1.5 },
    card: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    cardTitle: { marginTop: 0, fontSize: '18px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#333' },
    label: { display: 'block', marginTop: '15px', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#666' },
    select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' },
    studentList: { height: '220px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', marginTop: '5px' },
    studentItem: { padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontSize: '14px' },
    assignBtn: { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr', gap: '15px' },
    statusCard: { padding: '15px', borderRadius: '10px', border: '1px solid #f0f0f0', background: '#fafafa' },
    statusHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    examTitle: { fontWeight: 'bold', fontSize: '15px' },
    cancelBtn: { padding: '2px 8px', fontSize: '11px', color: '#ff4d4f', border: '1px solid #ff4d4f', background: 'none', borderRadius: '4px', cursor: 'pointer' },
    statsRow: { display: 'flex', justifyContent: 'space-around', marginBottom: '12px', textAlign: 'center' },
    statBox: { flex: 1 },
    statLabel: { fontSize: '11px', color: '#888' },
    statValue: { fontSize: '18px', fontWeight: 'bold' },
    progressBg: { width: '100%', height: '8px', background: '#e8e8e8', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', background: '#52c41a', transition: 'width 0.4s ease' }
};

export default ExamAssignRender;