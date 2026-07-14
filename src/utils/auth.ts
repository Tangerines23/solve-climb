/**
 * Supabase Auth 기반 로그인 유틸 (구글 OAuth 등)
 */
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

/**
 * 구글 로그인: 한 번 클릭 후 구글 페이지로 이동 → 로그인 완료 시 redirectTo로 돌아옴.
 * 네이티브 환경(Capacitor)에서는 @capawesome/capacitor-google-sign-in 플러그인을 통해
 * 디바이스 계정 선택 팝업으로 idToken을 획득한 후 supabase.auth.signInWithIdToken으로 세션을 설정합니다.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  // @ts-expect-error: Capacitor global check
  const isNativeApp = typeof window !== 'undefined' && !!window.Capacitor;

  if (isNativeApp) {
    try {
      console.log('[Auth] Native Google Sign-In 시작');
      const result = await GoogleSignIn.signIn();
      const idToken = result.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token received.');
      }

      console.log('[Auth] Supabase signInWithIdToken 호출');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('[Auth] Supabase idToken auth 실패:', error.message);
      } else {
        console.log('[Auth] Supabase idToken auth 성공');
      }

      return { error: error ?? null };
    } catch (e: any) {
      console.error('[Auth] Native Google Sign-In 에러:', e);
      return {
        error: {
          name: 'AuthError',
          status: 400,
          message: e.message || 'Google Sign-In failed',
        } as AuthError,
      };
    }
  }

  // 웹 환경: 기존 OAuth 리다이렉트 흐름 유지
  const redirectTo = `${window.location.origin}/my-page`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        theme: 'dark',
      },
    },
  });
  return { error: error ?? null };
}
