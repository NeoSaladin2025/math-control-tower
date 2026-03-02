import React, { useState } from 'react';
import ExamRegistRender from './regist/mainrender';
import ExamAssignRender from './assign/mainrender';
import ExamCreateRender from './create/mainrender';

/**
 * 진단평가 관리 통합 제어 센터
 * 등록, 배정, 출제 기능을 탭 메뉴로 관리합니다.
 */
const TestMainRender: React.FC = () => {
    // 내부 탭 상태 관리 ('regist' | 'assign' | 'create')
    const [subTab, setSubTab] = useState<'regist' | 'assign' | 'create'>('regist');
    
    // 부모에서 학생 상태를 관리하여 자식 컴포넌트 간의 데이터 일관성을 유지합니다.
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    return (
        <div style={styles.container}>
            {/* 상단 서브 탭 메뉴 */}
            <div style={styles.tabBar}>
                <button 
                    onClick={() => setSubTab('regist')}
                    style={{
                        ...styles.tabItem,
                        color: subTab === 'regist' ? '#27ae60' : '#a0a0a0',
                        borderBottom: subTab === 'regist' ? '3px solid #27ae60' : '3px solid transparent'
                    }}
                >
                    진단평가 등록
                </button>
                <button 
                    onClick={() => setSubTab('assign')}
                    style={{
                        ...styles.tabItem,
                        color: subTab === 'assign' ? '#27ae60' : '#a0a0a0',
                        borderBottom: subTab === 'assign' ? '3px solid #27ae60' : '3px solid transparent'
                    }}
                >
                    학생별 평가 배정
                </button>
                <button 
                    onClick={() => setSubTab('create')}
                    style={{
                        ...styles.tabItem,
                        color: subTab === 'create' ? '#27ae60' : '#a0a0a0',
                        borderBottom: subTab === 'create' ? '3px solid #27ae60' : '3px solid transparent'
                    }}
                >
                    오답지 출제 및 관리
                </button>
            </div>

            {/* 탭 내용 렌더링 영역 */}
            <div style={styles.content}>
                {subTab === 'regist' && <ExamRegistRender />}
                
                {/* 배정 탭: 학생 선택 로직이 포함되어 있을 수 있으므로 연동 확인 필요 */}
                {subTab === 'assign' && <ExamAssignRender />}
                
                {/* 출제 및 관리 탭: selectedStudent 속성을 반드시 전달하여 TS 에러를 해결합니다. */}
                {subTab === 'create' && (
                    <ExamCreateRender selectedStudent={selectedStudent} />
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        width: '100%' 
    },
    tabBar: { 
        display: 'flex', 
        gap: '30px', 
        borderBottom: '1px solid #eee',
        marginBottom: '10px'
    },
    tabItem: { 
        padding: '12px 10px', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        border: 'none', 
        background: 'none', 
        transition: '0.2s',
        outline: 'none'
    },
    content: { 
        width: '100%',
        minHeight: '600px'
    }
};

export default TestMainRender;