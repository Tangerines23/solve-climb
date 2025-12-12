import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, logEnvInfo } from './env';

// 개발 환경에서 환경 변수 정보 출력
logEnvInfo();

/**
 * 토스 앱 인앱 환경 확인
 */
const isTossEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator?.userAgent || '';
  return userAgent.includes('Toss');
};

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
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    // 환경 변수가 없으면 더미 URL과 키로 클라이언트 생성
    // 실제 API 호출은 실패하지만 앱은 크래시하지 않음
    return createClient('https://dummy.supabase.co', 'dummy-key');
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
  if (ENV.IS_DEVELOPMENT && redirectUrl) {
    console.log('[Supabase] 콜백 URL:', redirectUrl);
  }
  
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, options);
};

export const supabase = createSupabaseClient();
