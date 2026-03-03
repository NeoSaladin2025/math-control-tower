import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
    user: any; 
}

const StudentMain: React.FC<Props> = ({ user }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [assignedExams, setAssignedExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [startNo, setStartNo] = useState(1);
    const [questions, setQuestions] = useState<{ no: number, isCorrect: boolean }[]>([]);

    useEffect(() => {
        const fetchExams = async () => {
            if (!user?.id) return;

            // 1. 할당된 시험 정보(exam_assignments)에서 해당 학생의 시험 ID들을 가져옵니다.
            // 2. .select('exams(...)'를 통해 exams 테이블과 조인하여 제목(title)까지 한 번에 가져옵니다.
            const { data, error } = await supabase
                .from('exam_assignments') // 실제 DB의 할당 테이블 명칭 확인 필요
                .select(`
                    exam_id,
                    exams (
                        id,
                        title
                    )
                `)
                .eq('student_id', user.id); // 현재 로그인한 학생 ID로 필터링

            if (!error && data) {
                // 조인된 데이터에서 exams 객체만 추출하여 가공
                const myExams = data
                    .map((item: any) => item.exams)
                    .filter((exam: any) => exam !== null); // 연결된 시험 정보가 있는 경우만

                setAssignedExams(myExams);
            } else if (error) {
                console.error("시험 목록 로드 실패:", error.message);
            }
        };
        fetchExams();
    }, [user.id]);

    /**
     * 🚀 수정된 로직: 타입 불일치 방지 및 오답 제외
     */
    const handleStart = async () => {
        if (!selectedExamId) return alert("시험지를 선택해주세요.");
        
        try {
            // DB 조회: 해당 학생/시험지의 'wrong'(이미 맞힌) 문항만 가져옴
            const { data: solvedData, error } = await supabase
                .from('student_test_results')
                .select('question_number')
                .eq('student_id', user.id)
                .eq('exam_id', selectedExamId)
                .eq('status', 'wrong');

            if (error) throw error;

            // 💡 중요: DB에서 온 번호를 강제로 Number 타입으로 변환하여 Set 생성 💋
            const solvedSet = new Set(
                (solvedData || []).map(item => Number(item.question_number))
            );

            console.log("제외할 번호들 (solvedSet):", Array.from(solvedSet)); // 디버깅용

            const list = [];
            let currentNo = Number(startNo); // 입력값도 숫자로 확실히 변환 🌹
            
            // "solvedSet에 없는(아직 안 맞힌) 실제 번호"만 20개 리스트업
            while (list.length < 20) {
                // Number vs Number 비교로 타입 에러 원천 차단 💋
                if (!solvedSet.has(currentNo)) {
                    list.push({ no: currentNo, isCorrect: false });
                }
                currentNo++;
                
                if (currentNo > Number(startNo) + 1000) break; 
            }

            if (list.length === 0) {
                alert("이후 범위에 더 이상 입력할 문항이 없습니다.");
                return;
            }

            setQuestions(list);
            setIsPopupOpen(false);
        } catch (e: any) {
            console.error(e);
            alert("데이터 조회 중 오류가 발생했습니다.");
        }
    };

    const toggleResult = (idx: number) => {
        const newList = [...questions];
        newList[idx].isCorrect = !newList[idx].isCorrect;
        setQuestions(newList);
    };

    const handleSave = async () => {
        const solvedItems = questions
            .filter(q => q.isCorrect)
            .map(q => ({
                student_id: user.id,
                exam_id: selectedExamId,
                question_number: q.no,
                status: 'wrong' // 맞힌 문제는 'wrong'으로 저장하는 자기만의 규칙 반영 🌹
            }));

        if (solvedItems.length === 0) return alert("맞은 문항을 선택해주세요.");

        try {
            const { error } = await supabase
                .from('student_test_results')
                .upsert(solvedItems, { onConflict: 'student_id,exam_id,question_number' });

            if (error) throw error;
            alert("저장되었습니다.");
            setQuestions([]);
            setSelectedExamId("");
        } catch (e: any) {
            alert("저장 오류: " + e.message);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.userInfo}>
                    <span style={styles.gradeText}>{user?.grade}</span>
                    <span style={styles.nameText}>{user?.username}</span>
                </div>
                <div style={styles.headerRight}>
                    <button style={styles.subBtn}>비번변경</button>
                    <button onClick={() => window.location.reload()} style={styles.logoutBtn}>로그아웃</button>
                </div>
            </header>

            <main style={styles.main}>
                {questions.length === 0 ? (
                    <div style={styles.centerWrapper}>
                        <button style={styles.mainCenterBtn} onClick={() => setIsPopupOpen(true)}>
                            진단평가 답안 입력
                        </button>
                    </div>
                ) : (
                    <div style={styles.gridWrapper}>
                        <h3 style={styles.gridTitle}>맞은 문항만 터치해서 초록색으로 바꾸세요</h3>
                        <div style={styles.grid}>
                            {questions.map((q, idx) => (
                                <div 
                                    key={q.no}
                                    onClick={() => toggleResult(idx)}
                                    style={{
                                        ...styles.qButton,
                                        backgroundColor: q.isCorrect ? '#00b894' : '#ff7675'
                                    }}
                                >
                                    {q.no}
                                </div>
                            ))}
                        </div>
                        <div style={styles.actionRow}>
                            <button onClick={handleSave} style={styles.saveBtn}>저장하기</button>
                            <button onClick={() => setQuestions([])} style={styles.cancelBtn}>취소</button>
                        </div>
                    </div>
                )}
            </main>

            {isPopupOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>시험 선택</h2>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>시험지 선택</label>
                            <select 
                                style={styles.select}
                                value={selectedExamId}
                                onChange={e => setSelectedExamId(e.target.value)}
                            >
                                <option value="">시험지를 선택하세요</option>
                                {assignedExams.map(exam => (
                                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>시작 번호</label>
                            <input 
                                type="number"
                                style={styles.input}
                                value={startNo}
                                onChange={e => setStartNo(Number(e.target.value))}
                            />
                        </div>
                        <button onClick={handleStart} style={styles.popupStartBtn}>시작하기</button>
                        <button onClick={() => setIsPopupOpen(false)} style={styles.popupCloseBtn}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 스타일 객체는 기존과 동일하게 사용하세요 🌹
const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '30px 50px', backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' },
    userInfo: { display: 'flex', gap: '10px', alignItems: 'baseline' },
    gradeText: { fontSize: '20px', color: '#636e72', fontWeight: '500' },
    nameText: { fontSize: '28px', color: '#2d3436', fontWeight: '800' },
    headerRight: { display: 'flex', gap: '12px' },
    subBtn: { padding: '10px 18px', backgroundColor: '#f1f2f6', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' },
    logoutBtn: { padding: '10px 18px', backgroundColor: '#2d3436', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' },
    main: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    centerWrapper: { textAlign: 'center' },
    mainCenterBtn: { padding: '40px 80px', backgroundColor: '#00b894', color: 'white', borderRadius: '20px', fontSize: '32px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,184,148,0.25)' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', width: '360px', textAlign: 'center' },
    modalTitle: { marginTop: 0, color: '#2d3436', marginBottom: '25px' },
    inputGroup: { textAlign: 'left', marginBottom: '15px' },
    label: { fontSize: '12px', color: '#636e72', marginLeft: '5px' },
    select: { width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #dfe6e9', fontSize: '16px', appearance: 'none', backgroundColor: '#fff' },
    input: { width: '100%', padding: '12px', marginTop: '5px', borderRadius: '10px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '16px' },
    popupStartBtn: { width: '100%', padding: '15px', backgroundColor: '#00b894', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    popupCloseBtn: { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#b2bec3', border: 'none', cursor: 'pointer', marginTop: '5px' },
    gridWrapper: { textAlign: 'center', width: '100%', maxWidth: '500px' },
    gridTitle: { marginBottom: '25px', color: '#2d3436', fontSize: '20px', fontWeight: '700' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' },
    qButton: { height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '22px', fontWeight: '900', borderRadius: '15px', cursor: 'pointer' },
    actionRow: { display: 'flex', gap: '15px', marginTop: '35px' },
    saveBtn: { flex: 2, padding: '20px', backgroundColor: '#2d3436', color: '#fff', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    cancelBtn: { flex: 1, padding: '20px', backgroundColor: '#f1f2f6', borderRadius: '15px', fontSize: '18px', border: 'none', cursor: 'pointer' }
};

export default StudentMain;