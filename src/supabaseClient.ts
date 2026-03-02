import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 클라이언트 설정 모듈
 * 앨리트 비서 모드: 모듈 시스템 호환성 강화
 */

const SUPABASE_URL: string = 'https://uiasidzcyzdburjxtpsb.supabase.co';
const SUPABASE_ANON_KEY: string = 'sb_publishable_TuZyMzI0hAMU1oKzBih9ag_ZXaoST5-';

// 인스턴스를 먼저 생성합니다.
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 현재 로그인된 사용자 정보를 가져오는 함수
 */
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error("사용자 정보를 가져오는 중 오류 발생:", error.message);
        return null;
    }
    return user;
}

/**
 * 로그아웃 처리 함수
 */
async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("로그아웃 오류:", error.message);
    } else {
        alert("성공적으로 로그아웃되었습니다.");
        window.location.reload();
    }
}

// 앨리트 비서 모드: CommonJS 및 ESM 호환을 위해 객체 형태로 내보냅니다.
export { supabase, getCurrentUser, signOut };