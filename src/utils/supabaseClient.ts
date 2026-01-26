import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, logEnvInfo } from '@/utils/env';
import { Database } from '@/types/database.types';

// 개발 환경에서 환경 변수 정보 출력
logEnvInfo();

/**
 * 콜백 URL 생성
 * 토스 앱 인앱 환경에서는 현재 origin을 기반으로 콜백 URL 생성
 */
const getRedirectUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  // 현재 origin을 기반으로 콜백 URL 생성
  const origin = window.location.origin;
  const callbackPath = '/auth/callback';

  return `${origin}${callbackPath}`;
};

// 환경 변수 검증은 env.ts에서 자동으로 수행됨
// 환경 변수가 없을 때는 더미 클라이언트를 생성 (심사 환경 대응)
const createSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = ENV.VITE_SUPABASE_URL;
  const supabaseKey = ENV.VITE_SUPABASE_ANON_KEY;

  if (import.meta.env.DEV) {
    console.log(`[Supabase] 연결 시도 중... URL: ${supabaseUrl || 'http://localhost (Fallback)'}`);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '❌ [Supabase] 필수 환경 변수가 누락되었습니다. .env 파일을 확인하고 dev 서버를 재시작해주세요.'
    );
    return createClient('http://localhost', 'dummy-key');
  }

  // Supabase 클라이언트 옵션 설정
  const redirectUrl = getRedirectUrl();
  const options = {
    auth: {
      // 콜백 URL 설정
      redirectTo: redirectUrl,
      // 자동 새로고침 활성화
      autoRefreshToken: true,
      // 세션 지속 활성화
      persistSession: true,
      // URL에서 세션 감지 활성화 (콜백 처리용)
      detectSessionInUrl: true,
    },
  };

  // 개발 환경에서 콜백 URL 로그 출력
  if (import.meta.env.DEV && redirectUrl) {
    console.log('[Supabase] 콜백 URL:', redirectUrl);
  }

  const client = createClient<Database>(supabaseUrl, supabaseKey, options);

  // 익명 사용자 인증 자동 수행 (RLS 정책을 통과하기 위해)
  // 세션이 없을 때만 익명 로그인 시도 (비동기, 실패해도 무시)
  if (typeof window !== 'undefined') {
    client.auth.getSession().then(({ data: { session } }) => {
      // 더미 URL이 아닐 때만 익명 로그인 시도
      if (!session && ENV.VITE_SUPABASE_URL) {
        client.auth.signInAnonymously().catch(() => {
          // 익명 로그인 실패는 무시
        });
      }
    });
  }

  return client;
};

export const supabase = createSupabaseClient();
