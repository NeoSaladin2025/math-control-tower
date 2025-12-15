// [Math Control Tower] 설정 파일
// Supabase 프로젝트 연결 정보
const SUPABASE_URL = '
const SUPABASE_KEY = '/ 제공해주신 Key

// 1. Supabase 클라이언트 초기화
let _supabase;

if (typeof supabase !== 'undefined') {
    // Supabase 라이브러리가 로드된 경우 클라이언트 생성
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("오류: Supabase 라이브러리가 로드되지 않았습니다. HTML의 <head> 태그 내 스크립트를 확인해주세요.");
}

// 2. 로그인 상태 확인 (인증 가드)
// 페이지 로드 시 로그인 여부를 확인하고, 비로그인 상태일 경우 로그인 페이지로 이동시킵니다.
function checkAuth() {
    const userJson = sessionStorage.getItem('currentUser');
    
    // 세션 정보가 없는 경우
    if (!userJson) {
        alert("로그인이 필요한 서비스입니다.");
        // 현재 페이지가 로그인 페이지(index.html)가 아니라면 이동
        if (!location.pathname.endsWith('index.html')) {
            location.href = 'index.html';
        }
        return null;
    }

    // 유저 정보를 객체로 반환
    return JSON.parse(userJson);
}

// 3. 로그아웃 처리
function logout() {
    if(confirm("로그아웃 하시겠습니까?")) {
        sessionStorage.removeItem('currentUser'); // 세션 정보 삭제
        location.href = 'index.html'; // 로그인 페이지로 이동
    }
}