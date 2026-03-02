/**
 * src/main.tsx
 * 앨리트 비서 모드: React 18 기준으로 작성된 메인 진입점 파일입니다.
 * .tsx 확장자를 사용하여 JSX 문법 에러를 원천 봉쇄합니다.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
// App.tsx에서 'export const App'으로 내보냈으므로 중괄호 { App }을 사용합니다.
import { App } from './App'; 

/**
 * [렌더링 프로세스]
 * 1. index.html에 정의된 <div id="app"> 요소를 찾습니다.
 * 2. React 18의 createRoot API를 사용하여 루트를 생성합니다.
 * 3. App 컴포넌트를 StrictMode와 함께 렌더링합니다.
 */
const rootElement = document.getElementById('app');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    // 앨리트 비서의 예외 처리: index.html에 #app이 없을 경우 에러 출력
    console.error(
        "데이터 렌더링 실패: index.html 파일 내에 id가 'app'인 <div> 요소가 존재하지 않습니다."
    );
}