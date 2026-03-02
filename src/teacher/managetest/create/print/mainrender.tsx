import React, { useEffect } from 'react';

interface Props {
    data: any;
    expandedQuestions: Set<number>;
    onBack: () => void;
}

const PrintMainRender: React.FC<Props> = ({ data, expandedQuestions, onBack }) => {
    const questions = data.questionList;
    const baseUrl = "https://uiasidzcyzdburjxtpsb.supabase.co/storage/v1/object/public/exam-images";

    // 컴포넌트 마운트 시 자동 인쇄 실행
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // 페이지 분할 로직 (열 우선 배열)
    const pages = (() => {
        const result: any[] = [];
        let leftCol: any[] = [];
        let rightCol: any[] = [];
        let leftSlots = 0;
        let rightSlots = 0;

        questions.forEach((qNo: number, idx: number) => {
            const size = expandedQuestions.has(qNo) ? 2 : 1;
            const item = { qNo, size, originalIndex: idx + 1 };

            if (leftSlots + size <= 2) {
                leftCol.push(item);
                leftSlots += size;
            } else if (rightSlots + size <= 2) {
                rightCol.push(item);
                rightSlots += size;
            } else {
                result.push({ left: leftCol, right: rightCol });
                leftCol = [item];
                rightCol = [];
                leftSlots = size;
                rightSlots = 0;
            }
        });
        if (leftCol.length > 0 || rightCol.length > 0) result.push({ left: leftCol, right: rightCol });
        return result;
    })();

    return (
        <div className="print-main-root">
            {/* 상단 네비게이션 바 (인쇄 시 숨김) */}
            <div className="no-print" style={styles.nav}>
                <button onClick={onBack} style={styles.backBtn}>← 편집 화면으로 돌아가기</button>
                <span style={{color: '#333', fontSize: '14px'}}>인쇄 미리보기가 자동으로 뜨지 않으면 [Ctrl+P]를 눌러주세요.</span>
            </div>

            <div className="print-area">
                {pages.map((page, pIdx) => (
                    <div key={pIdx} className="a4-page">
                        <div className="page-header">
                            <span className="student-name">{data.studentName} 학생 진단 평가</span>
                            <span className="exam-title">{data.examTitle}</span>
                        </div>

                        <div className="content-columns">
                            {/* 왼쪽 컬럼 */}
                            <div className="column">
                                {page.left.map((item: any) => (
                                    <div key={item.qNo} className="question-slot" style={{ height: item.size === 2 ? '100%' : '50%' }}>
                                        <div className="q-number">{item.originalIndex}번</div>
                                        <div className="image-shield">
                                            <img src={`${baseUrl}/exam_${data.examId}/${String(item.qNo).padStart(4, '0')}.jpg`} alt="q" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* 오른쪽 컬럼 */}
                            <div className="column">
                                {page.right.map((item: any) => (
                                    <div key={item.qNo} className="question-slot" style={{ height: item.size === 2 ? '100%' : '50%' }}>
                                        <div className="q-number">{item.originalIndex}번</div>
                                        <div className="image-shield">
                                            <img src={`${baseUrl}/exam_${data.examId}/${String(item.qNo).padStart(4, '0')}.jpg`} alt="q" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @page { size: A4; margin: 0; }
                @media print {
                    body { margin: 0; padding: 0; background: #fff !important; }
                    .no-print { display: none !important; }
                    .print-area { display: block !important; }
                    * { -webkit-print-color-adjust: exact !important; border-color: transparent !important; }
                }
                .a4-page {
                    width: 210mm; height: 297mm; padding: 15mm;
                    box-sizing: border-box; background: #fff;
                    display: flex; flex-direction: column;
                    page-break-after: always; position: relative;
                }
                .page-header {
                    display: flex; justify-content: space-between; align-items: flex-end;
                    border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;
                }
                .student-name { font-size: 24px; font-weight: bold; }
                .exam-title { font-size: 14px; color: #666; }
                .content-columns { flex: 1; display: flex; width: 100%; height: 100%; }
                .column { flex: 1; display: flex; flex-direction: column; height: 100%; }
                .question-slot { display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; }
                .q-number { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .image-shield { 
                    flex: 1; position: relative; overflow: hidden; 
                    display: flex; align-items: flex-start; justify-content: center; 
                }
                .image-shield::before, .image-shield::after {
                    content: ""; position: absolute; top: 0; width: 2px; height: 100%;
                    background: #fff; z-index: 10;
                }
                .image-shield::before { left: 0; }
                .image-shield::after { right: 0; }
                .image-shield img { max-width: 100%; max-height: 100%; object-fit: contain; }
            `}</style>
        </div>
    );
};

// 에러 해결: styles 객체에 backBtn 스타일 추가 💋
const styles: { [key: string]: React.CSSProperties } = {
    nav: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 1000, 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6', 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center' 
    },
    backBtn: { 
        padding: '10px 20px', 
        cursor: 'pointer', 
        borderRadius: '5px', 
        border: '1px solid #333', 
        background: '#fff',
        fontWeight: 'bold'
    }
};

export default PrintMainRender;