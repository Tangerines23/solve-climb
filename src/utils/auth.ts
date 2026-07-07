/**
 * Supabase Auth 기반 로그인 유틸 (구글 OAuth 등)
 */
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { ENV } from './env';

/**
 * 구글 로그인: 한 번 클릭 후 구글 페이지로 이동 → 로그인 완료 시 redirectTo로 돌아옴.
 * 사전 설정: Supabase 대시보드 → Authentication → Providers → Google 활성화 (Client ID/Secret),
 * Redirect URLs에 https://yourdomain.com/my-page 및 로컬 http://localhost:5173/my-page 추가.
 *
 * 참고: 구글 계정 선택/동의 화면(accounts.google.com) 테마는 Google이 제어합니다.
 * 공식 OAuth 파라미터로 다크 테마를 지정할 수 없으며, 기기/브라우저가 다크 모드일 때
 * 구글 로그인 화면이 어둡게 나올 수 있습니다. 앱 내 로그인 버튼·배경은 MyPage.css에서 다크 테마로 맞춤.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  // 네이티브 앱(Capacitor) 환경에서는 capacitor://localhost 같은 스킴이
  // Google OAuth redirectTo에서 작동하지 않으므로, 고정 프로덕션 URL을 사용.
  // 웹 환경에서는 VITE_SITE_URL 우선, 없으면 현재 도메인 사용.
  // @ts-expect-error: Capacitor global check
  const isNativeApp = typeof window !== 'undefined' && !!window.Capacitor;
  const redirectTo = isNativeApp
    ? `${ENV.VITE_SITE_URL ?? 'https://solve-climb.vercel.app'}/my-page`
    : `${window.location.origin}/my-page`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // 구글 측에서 미지원할 수 있음. 일부 환경에서 다크 UI 힌트로 전달 시도.
        theme: 'dark',
      },
    },
  });
  return { error: error ?? null };
}
