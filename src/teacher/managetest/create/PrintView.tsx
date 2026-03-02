import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintViewProps {
    data: {
        studentName: string;
        examTitle: string;
        examId: string;
        questionList: number[];
    };
    onClose: () => void;
}

interface SlotItem {
    qNo: number;
    size: number;
    originalIndex: number;
}

const PrintView: React.FC<PrintViewProps> = ({ data, onClose }) => {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false); // 로딩 상태 추가 💋
    const questions = data?.questionList || [];
    const baseUrl = "https://uiasidzcyzdburjxtpsb.supabase.co/storage/v1/object/public/exam-images";

    const toggleExpand = (qNo: number) => {
        const newSet = new Set(expandedQuestions);
        if (newSet.has(qNo)) newSet.delete(qNo);
        else newSet.add(qNo);
        setExpandedQuestions(newSet);
    };

    // 지능형 페이지 및 컬럼 분배 (열 우선 방식)
    const pages = useMemo(() => {
        const result: { left: SlotItem[], right: SlotItem[] }[] = [];
        let leftCol: SlotItem[] = [];
        let rightCol: SlotItem[] = [];
        let leftSlots = 0;
        let rightSlots = 0;

        questions.forEach((qNo, idx) => {
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

        if (leftCol.length > 0 || rightCol.length > 0) {
            result.push({ left: leftCol, right: rightCol });
        }
        return result;
    }, [questions, expandedQuestions]);

    /**
     * 🔥 핵심: PDF 생성 및 인쇄 함수
     */
    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageElements = document.getElementsByClassName('a4-page-unit');

        for (let i = 0; i < pageElements.length; i++) {
            const element = pageElements[i] as HTMLElement;
            
            // html2canvas로 화면을 캡처 (고해상도를 위해 scale 조절)
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true, // Supabase 이미지를 불러오기 위해 필수! 💋
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        // PDF 저장 후 바로 브라우저에서 열거나 인쇄 창 호출 가능
        pdf.save(`${data.studentName}_오답지.pdf`);
        setIsGenerating(false);
    };

    if (!data) return null;

    return (
        <div style={styles.viewContainer}>
            <div className="no-print" style={styles.controlBar}>
                <div style={styles.info}>
                    <strong>{data.studentName}</strong> 학생 오답지 (PDF 생성 방식)
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleDownloadPDF} 
                        style={{...styles.printBtn, backgroundColor: isGenerating ? '#aaa' : '#4CAF50'}}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'PDF 생성 중...' : 'PDF 인쇄/저장'}
                    </button>
                    <button onClick={onClose} style={styles.closeBtn}>닫기</button>
                </div>
            </div>

            <div id="print-area" style={styles.printArea}>
                {pages.map((page, pIdx) => (
                    <div key={pIdx} className="a4-page-unit" style={styles.a4Page}>
                        <div style={styles.pageHeader}>
                            <div style={styles.headerLeft}>{data.studentName} 학생 진단 평가</div>
                            <div style={styles.headerRight}>{data.examTitle}</div>
                        </div>

                        <div style={styles.columnsWrapper}>
                            <div style={styles.column}>
                                {page.left.map((item) => (
                                    <div 
                                        key={item.qNo} 
                                        onClick={() => toggleExpand(item.qNo)}
                                        style={{
                                            ...styles.questionBox,
                                            height: item.size === 2 ? '100%' : '50%'
                                        }}
                                    >
                                        <div style={styles.qNum}>{item.originalIndex}번</div>
                                        <div className="white-shield-container" style={styles.imgWrapper}>
                                            <img 
                                                src={`${baseUrl}/exam_${data.examId}/${String(item.qNo).padStart(4, '0')}.jpg`} 
                                                style={styles.image} 
                                                alt="question"
                                                crossOrigin="anonymous" // 중요: PDF 생성을 위한 CORS 허용 💋
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.column}>
                                {page.right.map((item) => (
                                    <div 
                                        key={item.qNo} 
                                        onClick={() => toggleExpand(item.qNo)}
                                        style={{
                                            ...styles.questionBox,
                                            height: item.size === 2 ? '100%' : '50%'
                                        }}
                                    >
                                        <div style={styles.qNum}>{item.originalIndex}번</div>
                                        <div className="white-shield-container" style={styles.imgWrapper}>
                                            <img 
                                                src={`${baseUrl}/exam_${data.examId}/${String(item.qNo).padStart(4, '0')}.jpg`} 
                                                style={styles.image} 
                                                alt="question"
                                                crossOrigin="anonymous" // 중요: PDF 생성을 위한 CORS 허용 💋
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                /* PDF 생성 시 가림막 잔선 방지 🌹 */
                .white-shield-container {
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                }
                .white-shield-container::before,
                .white-shield-container::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background-color: #ffffff;
                    z-index: 10;
                }
                .white-shield-container::before { left: 0; }
                .white-shield-container::after { right: 0; }
            `}</style>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    viewContainer: { backgroundColor: '#525659', minHeight: '100vh', paddingBottom: '40px' },
    controlBar: { position: 'sticky', top: 0, left: 0, width: '100%', padding: '15px 30px', backgroundColor: '#202124', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, color: '#fff' },
    printBtn: { padding: '10px 25px', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    closeBtn: { padding: '10px 20px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    printArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' },
    a4Page: { width: '210mm', height: '297mm', backgroundColor: '#fff', padding: '15mm', marginBottom: '20px', boxSizing: 'border-box', boxShadow: '0 0 10px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' },
    headerLeft: { fontSize: '24px', fontWeight: 'bold' },
    headerRight: { fontSize: '14px', color: '#666' },
    columnsWrapper: { flex: 1, display: 'flex', width: '100%', height: '100%', backgroundColor: '#fff' },
    column: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' },
    questionBox: { display: 'flex', flexDirection: 'column', padding: '10px', boxSizing: 'border-box', cursor: 'pointer', border: 'none', backgroundColor: '#fff' },
    qNum: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' },
    imgWrapper: { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }
};

export default PrintView;