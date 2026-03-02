import { supabase } from '../../../supabaseClient';

export class ExamRegistService {
    /**
     * 이미지 압축 및 JPEG 변환 로직
     * PNG 파일도 압축률이 좋은 JPEG로 변환하여 저장 공간을 절약합니다.
     */
    async compressImage(file: File): Promise<Blob> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob as Blob);
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    }

    /**
     * 폴더 업로드, 번호 검증 및 수량 체크 로직
     */
    async uploadFolder(
        examId: string, 
        expectedCount: number, 
        files: FileList, 
        onProgress: (current: number, total: number) => void
    ) {
        // 1. 파일 확장자 필터링 (.png, .jpg, .jpeg) 및 숫자 기반 정렬
        const fileArray = Array.from(files)
            .filter(f => /\.(png|jpe?g)$/i.test(f.name))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        
        const actualCount = fileArray.length;

        // 2. 수량 검증
        if (actualCount === 0) {
            throw new Error("폴더 내에 인식 가능한 이미지(.png, .jpg)가 없습니다.");
        }

        if (actualCount !== expectedCount) {
            throw new Error(`수량 불일치: 설정은 ${expectedCount}문항이나, 폴더 내 이미지는 ${actualCount}개입니다.`);
        }

        // 3. 번호 누락 검증 (0001, 0002... 순서대로 있는지 확인)
        const fileNumbers = fileArray.map(f => {
            const match = f.name.match(/\d+/);
            return match ? parseInt(match[0], 10) : -1;
        });

        const missingNums: number[] = [];
        for (let i = 1; i <= expectedCount; i++) {
            if (!fileNumbers.includes(i)) {
                missingNums.push(i);
            }
        }

        if (missingNums.length > 0) {
            throw new Error(`이미지 번호 누락: [${missingNums.slice(0, 5).join(', ')}${missingNums.length > 5 ? '...' : ''}] 번호가 없습니다.`);
        }

        // 4. 업로드 시작
        const bucketFolderName = `exam_${examId}`;

        for (let i = 0; i < actualCount; i++) {
            const file = fileArray[i];
            const compressedBlob = await this.compressImage(file);
            
            // 파일명 포맷팅: 0001.jpg 형식으로 통일
            const seq = (i + 1).toString().padStart(4, '0');
            const filePath = `${bucketFolderName}/${seq}.jpg`;

            const { error } = await supabase.storage
                .from('exam-images')
                .upload(filePath, compressedBlob, { upsert: true });

            if (!error) {
                onProgress(i + 1, actualCount);
            } else {
                console.error(`${seq}번 파일 업로드 실패:`, error.message);
            }
        }

        // 5. DB 업데이트 (버킷 폴더명 기록)
        await supabase
            .from('exams')
            .update({ bucket_folder: bucketFolderName })
            .eq('id', examId);
    }

    /**
     * 기초 정보 생성
     */
    async createExamTitle(title: string, totalQuestions: number) {
        const { data, error } = await supabase
            .from('exams')
            .insert([{ title, total_questions: totalQuestions }])
            .select();
        if (error) throw error;
        return data[0];
    }

    /**
     * 시험 목록 로드
     */
    async getExams() {
        const { data } = await supabase
            .from('exams')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }

    /**
     * 시험 삭제 (DB 기록 삭제)
     */
    async deleteExam(id: string) {
        const { error: dbError } = await supabase
            .from('exams')
            .delete()
            .eq('id', id);
        if (dbError) throw dbError;
        return true;
    }
}

export const examRegistService = new ExamRegistService();