/**
 * Supabase Auth 기반 로그인 유틸 (구글 OAuth 등)
 */
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

/**
 * 구글 로그인: 한 번 클릭 후 구글 페이지로 이동 → 로그인 완료 시 redirectTo로 돌아옴.
 * 사전 설정: Supabase 대시보드 → Authentication → Providers → Google 활성화 (Client ID/Secret),
 * Redirect URLs에 https://yourdomain.com/my-page 및 로컬 http://localhost:5173/my-page 추가.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const redirectTo = `${window.location.origin}/my-page`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { error: error ?? null };
}
