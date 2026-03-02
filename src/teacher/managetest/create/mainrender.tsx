import React, { useState, useEffect } from 'react';
import { examCreateService } from './main';
import PrintView from './PrintView';

interface MainRenderProps {
    selectedStudent?: any; 
}

const MainRender: React.FC<MainRenderProps> = ({ selectedStudent: propStudent }) => {
    // 학년 리스트에서 초등 과정을 제거하고 중고등 위주로 재구성
    const [grades] = useState(['중1', '중2', '중3', '고1', '고2', '고3']);
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [activeStudent, setActiveStudent] = useState<any>(propStudent || null);
    const [assignedExams, setAssignedExams] = useState<any[]>([]);

    // 모달 상태
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printData, setPrintData] = useState<any>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [currentExam, setCurrentExam] = useState<any>(null);
    const [updateList, setUpdateList] = useState([{ qNo: 1, isCorrect: true }]);

    // 1. 학년 선택 시 학생 리스트 로드
    const loadStudents = async (grade: string) => {
        setSelectedGrade(grade);
        setActiveStudent(null);
        setAssignedExams([]);
        try {
            const data = await examCreateService.getStudentsByGrade(grade);
            setStudents(data || []);
        } catch (e) {
            console.error("학생 로드 실패:", e);
        }
    };

    // 2. 학생 선택 시 시험 현황 로드
    const loadStudentDetails = async (student: any) => {
        setActiveStudent(student);
        try {
            const data = await examCreateService.getAssignedExamsWithStats(student.id);
            setAssignedExams(data || []);
        } catch (e) {
            console.error("시험 데이터 로드 실패:", e);
        }
    };

    // 3. 다중 문항 정정 로직
    const handleOpenUpdateModal = (exam: any) => {
        setCurrentExam(exam);
        setUpdateList([{ qNo: 1, isCorrect: true }]);
        setShowUpdateModal(true);
    };

    const addUpdateField = () => setUpdateList([...updateList, { qNo: 1, isCorrect: true }]);
    
    const removeUpdateField = (index: number) => {
        if (updateList.length === 1) return;
        setUpdateList(updateList.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index: number, field: string, value: any) => {
        const newList = [...updateList];
        newList[index] = { ...newList[index], [field]: value };
        setUpdateList(newList);
    };

    const handleBulkUpdate = async () => {
        if (!activeStudent || !currentExam) return;
        try {
            await Promise.all(
                updateList.map(item => 
                    examCreateService.updateTestResult(
                        activeStudent.id, 
                        currentExam.exam_id, 
                        item.qNo, 
                        item.isCorrect
                    )
                )
            );
            alert("정정 사항이 성공적으로 반영되었습니다.");
            setShowUpdateModal(false);
            loadStudentDetails(activeStudent);
        } catch (e: any) {
            alert("저장 오류: " + e.message);
        }
    };

    // 4. 오답지 생성
    const handleOpenPrintModal = async (exam: any) => {
        if (!activeStudent) return;
        try {
            const result = await examCreateService.createAutoExam(activeStudent.id, exam.exam_id);
            if (result) {
                setPrintData({
                    studentName: activeStudent.username,
                    examTitle: exam.exam_title,
                    examId: exam.exam_id,
                    questionList: result.question_list
                });
                setShowPrintModal(true);
            }
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div style={styles.layout}>
            {/* 왼쪽: 학년 리스트 (중1~고3) */}
            <div style={styles.sidebar}>
                <h4 style={styles.sideTitle}>학년 선택</h4>
                {grades.map(grade => (
                    <div 
                        key={grade} 
                        onClick={() => loadStudents(grade)}
                        style={{
                            ...styles.gradeItem,
                            backgroundColor: selectedGrade === grade ? '#27ae60' : 'transparent',
                            color: selectedGrade === grade ? '#fff' : '#333'
                        }}
                    >
                        {grade}
                    </div>
                ))}
            </div>

            {/* 중앙: 학생 리스트 */}
            <div style={styles.studentList}>
                <h4 style={styles.sideTitle}>학생 명단</h4>
                {students.length > 0 ? (
                    students.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => loadStudentDetails(s)}
                            style={{
                                ...styles.studentItem,
                                borderLeft: activeStudent?.id === s.id ? '5px solid #27ae60' : '5px solid transparent',
                                backgroundColor: activeStudent?.id === s.id ? '#f0f9f4' : 'transparent'
                            }}
                        >
                            {s.username}
                        </div>
                    ))
                ) : (
                    <div style={styles.infoText}>학년을 선택해주세요.</div>
                )}
            </div>

            {/* 오른쪽: 메인 대시보드 */}
            <div style={styles.mainContent}>
                {activeStudent ? (
                    <>
                        <h3 style={styles.dashboardTitle}>{activeStudent.username} 학생의 평가 관리</h3>
                        <div style={styles.grid}>
                            {assignedExams.map(exam => (
                                <div key={exam.exam_id} style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <h5 style={styles.examTitle}>{exam.exam_title}</h5>
                                        <span style={styles.wrongBadge}>{exam.wrong_count}개 오답</span>
                                    </div>
                                    <div style={styles.progressRow}>
                                        <div style={styles.progressLabel}>정답률 {exam.correct_rate}%</div>
                                        <div style={styles.barBg}>
                                            <div style={{...styles.barFill, width: `${exam.correct_rate}%`}}></div>
                                        </div>
                                    </div>
                                    <div style={styles.btnGroup}>
                                        <button style={styles.printBtn} onClick={() => handleOpenPrintModal(exam)} disabled={exam.wrong_count === 0}>오답지 생성</button>
                                        <button style={styles.editBtn} onClick={() => handleOpenUpdateModal(exam)}>정답 정정</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={styles.emptyDash}>관리할 학생을 선택해 주세요.</div>
                )}
            </div>

            {/* 정정 모달 */}
            {showUpdateModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h4 style={{marginTop: 0}}>다중 문항 정정</h4>
                        <div style={styles.scrollArea}>
                            {updateList.map((item, index) => (
                                <div key={index} style={styles.updateRow}>
                                    <input type="number" style={styles.smallInput} value={item.qNo} onChange={(e) => handleFieldChange(index, 'qNo', Number(e.target.value))} placeholder="번호" />
                                    <select style={styles.smallSelect} value={String(item.isCorrect)} onChange={(e) => handleFieldChange(index, 'isCorrect', e.target.value === 'true')}>
                                        <option value="true">정답추가</option>
                                        <option value="false">오답삭제</option>
                                    </select>
                                    <button onClick={() => removeUpdateField(index)} style={styles.delBtn}>삭제</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addUpdateField} style={styles.addFieldBtn}>+ 문항 추가</button>
                        <div style={styles.modalFooter}>
                            <button onClick={handleBulkUpdate} style={styles.saveBtn}>일괄 저장</button>
                            <button onClick={() => setShowUpdateModal(false)} style={styles.cancelBtn}>취소</button>
                        </div>
                    </div>
                </div>
            )}

            {showPrintModal && (
                <div style={styles.printOverlay}>
                    <PrintView data={printData} onClose={() => setShowPrintModal(false)} />
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    layout: { display: 'flex', height: '100%', minHeight: '700px', backgroundColor: '#fff', border: '1px solid #eee' },
    sidebar: { width: '120px', borderRight: '1px solid #eee', padding: '15px', backgroundColor: '#fcfcfc' },
    studentList: { width: '180px', borderRight: '1px solid #eee', padding: '15px', backgroundColor: '#fff' },
    mainContent: { flex: 1, padding: '25px', backgroundColor: '#f9f9f9', overflowY: 'auto' },
    sideTitle: { fontSize: '14px', color: '#888', marginBottom: '15px', fontWeight: '600' },
    gradeItem: { padding: '10px', marginBottom: '5px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', textAlign: 'center', transition: '0.2s' },
    studentItem: { padding: '12px', marginBottom: '8px', cursor: 'pointer', fontSize: '14px', borderRadius: '4px', transition: '0.2s' },
    dashboardTitle: { margin: '0 0 25px 0', fontSize: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #eee' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    examTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold' },
    wrongBadge: { fontSize: '11px', color: '#ff4d4f', fontWeight: 'bold' },
    progressRow: { marginBottom: '15px' },
    progressLabel: { fontSize: '12px', color: '#666', marginBottom: '5px' },
    barBg: { height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#27ae60' },
    btnGroup: { display: 'flex', gap: '8px' },
    printBtn: { flex: 1, padding: '8px', backgroundColor: '#2d3436', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    editBtn: { flex: 1, padding: '8px', backgroundColor: '#f1f2f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    emptyDash: { height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa' },
    infoText: { fontSize: '12px', color: '#ccc', textAlign: 'center', marginTop: '20px' },
    
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '380px' },
    scrollArea: { maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' },
    updateRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
    smallInput: { width: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    smallSelect: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    delBtn: { padding: '8px', border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer' },
    addFieldBtn: { width: '100%', padding: '10px', border: '1px dashed #ccc', background: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' },
    modalFooter: { display: 'flex', gap: '8px' },
    saveBtn: { flex: 2, padding: '12px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
    cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#eee', border: 'none', borderRadius: '8px' },
    printOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#202124', zIndex: 3000, overflowY: 'auto' }
};

export default MainRender;