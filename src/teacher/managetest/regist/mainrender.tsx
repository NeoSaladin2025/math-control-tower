import React, { useState, useEffect } from 'react';
import { examRegistService } from './main';

/**
 * ExamRegistRender Component
 * Handles the registration of exam titles and bulk image uploads.
 */
const ExamRegistRender: React.FC = () => {
    const [title, setTitle] = useState('');
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [exams, setExams] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [uploadStatus, setUploadStatus] = useState({ current: 0, total: 0 });
    const [isUploading, setIsUploading] = useState(false);

    /**
     * Loads the list of registered exams.
     */
    const loadExams = async () => {
        try {
            const data = await examRegistService.getExams();
            setExams(data);
        } catch (error) {
            console.error("Data load error:", error);
        }
    };

    useEffect(() => {
        loadExams();
    }, []);

    /**
     * Registers basic exam info (title, question count).
     */
    const handleCreateExam = async () => {
        if (!title.trim() || totalQuestions <= 0) {
            alert("제목과 문항 수를 정확히 입력해 주세요.");
            return;
        }
        try {
            await examRegistService.createExamTitle(title, totalQuestions);
            setTitle('');
            setTotalQuestions(0);
            loadExams();
        } catch (e: any) {
            alert(e.message);
        }
    };

    /**
     * Handles bulk folder upload and validation.
     */
    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedExam) return;

        setIsUploading(true);
        // Pre-initialize progress based on selected files
        setUploadStatus({ current: 0, total: files.length });

        try {
            await examRegistService.uploadFolder(
                selectedExam.id,
                selectedExam.total_questions,
                files,
                (current: number, total: number) => setUploadStatus({ current, total })
            );
            alert("이미지 일괄 업로드 성공!");
            setIsModalOpen(false);
            loadExams();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsUploading(false);
            setUploadStatus({ current: 0, total: 0 });
            e.target.value = '';
        }
    };

    /**
     * Deletes an exam record.
     */
    const handleDelete = async (id: string, folder: string) => {
        if (!window.confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return;
        try {
            await examRegistService.deleteExam(id);
            loadExams();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div style={styles.container}>
            <section style={styles.left}>
                <div style={styles.card}>
                    <h3>진단평가 생성</h3>
                    <input 
                        style={styles.input} 
                        placeholder="시험 제목" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                    />
                    <input 
                        style={styles.input} 
                        type="number" 
                        placeholder="총 문항 수" 
                        value={totalQuestions || ''} 
                        onChange={e => setTotalQuestions(Number(e.target.value))} 
                    />
                    <button style={styles.saveBtn} onClick={handleCreateExam}>기초 정보 저장</button>
                </div>
            </section>

            <section style={styles.right}>
                <div style={styles.card}>
                    <h3>평가 리스트</h3>
                    {exams.map(exam => (
                        <div key={exam.id} style={styles.listItem}>
                            <span>{exam.title} ({exam.total_questions}문항)</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    style={styles.uploadBtn} 
                                    onClick={() => { setSelectedExam(exam); setIsModalOpen(true); }}
                                >
                                    이미지 업로드
                                </button>
                                <button 
                                    style={styles.delBtn} 
                                    onClick={() => handleDelete(exam.id, exam.bucket_folder)}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {isModalOpen && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h4>{selectedExam?.title} 이미지 등록</h4>
                        <div style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                            설정 문항 수: {selectedExam?.total_questions}개
                        </div>
                        {!isUploading ? (
                            <input 
                                type="file" 
                                //@ts-ignore
                                webkitdirectory="" 
                                directory="" 
                                onChange={handleFolderUpload} 
                            />
                        ) : (
                            <div style={styles.progressText}>
                                업로드 중... ({uploadStatus.current} / {uploadStatus.total})
                            </div>
                        )}
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button 
                                style={styles.closeBtn} 
                                onClick={() => setIsModalOpen(false)} 
                                disabled={isUploading}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', gap: '20px', width: '100%' },
    left: { flex: 1 },
    right: { flex: 1.5 },
    card: { background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
    saveBtn: { width: '100%', padding: '15px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
    uploadBtn: { padding: '5px 10px', background: '#34a853', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
    delBtn: { padding: '5px 10px', background: '#fff', color: '#fa5252', border: '1px solid #fa5252', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '30px', borderRadius: '15px', minWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    progressText: { margin: '15px 0', fontWeight: 'bold', color: '#1a73e8', textAlign: 'center' },
    closeBtn: { padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default ExamRegistRender;