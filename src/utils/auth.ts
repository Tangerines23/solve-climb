/**
 * Supabase Auth 기반 로그인 유틸 (구글 OAuth 등)
 */
import { Capacitor } from '@capacitor/core';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { config } from './env';

const DEFAULT_GOOGLE_CLIENT_ID =
  '422673840720-etmtujb3lrt4966pv2j212sqf39votil.apps.googleusercontent.com';

let googleSignInInitPromise: Promise<void> | null = null;

function getValidClientId(): string {
  const envId = config.GOOGLE_CLIENT_ID;
  return envId && envId.trim() !== '' ? envId : DEFAULT_GOOGLE_CLIENT_ID;
}

export function isNativeAppPlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (typeof win.Capacitor?.isNativePlatform === 'function') {
    return win.Capacitor.isNativePlatform();
  }
  return Capacitor.isNativePlatform();
}

/**
 * 네이티브 환경(Capacitor)에서 Google Sign-In 플러그인을 1회 초기화합니다.
 * 싱글톤 프로미스를 사용하여 중복 호출 시에도 안전하게 단 한 번만 초기화하거나 완료를 기다립니다.
 */
export async function initializeGoogleSignIn(): Promise<void> {
  if (!isNativeAppPlatform()) return;

  if (!googleSignInInitPromise) {
    googleSignInInitPromise = (async () => {
      try {
        const clientId = getValidClientId();
        console.log('[GoogleSignIn] Native Google Sign-In 초기화 중... (clientId:', clientId, ')');
        await GoogleSignIn.initialize({
          clientId,
          scopes: ['profile', 'email'],
        });
        console.log('[GoogleSignIn] Native Google Sign-In 초기화 성공');
      } catch (err) {
        console.error('[GoogleSignIn] Initialization failed:', err);
        googleSignInInitPromise = null;
        throw err;
      }
    })();
  }

  return googleSignInInitPromise;
}

/**
 * 테스트 환경용 초기화 상태 리셋 함수
 */
export function _resetGoogleSignInInitForTest(): void {
  googleSignInInitPromise = null;
}

/**
 * 구글 로그인: 한 번 클릭 후 구글 페이지로 이동 → 로그인 완료 시 redirectTo로 돌아옴.
 * 네이티브 환경(Capacitor)에서는 @capawesome/capacitor-google-sign-in 플러그인을 통해
 * 디바이스 계정 선택 팝업으로 idToken을 획득한 후 supabase.auth.signInWithIdToken으로 세션을 설정합니다.
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const isNativeApp = isNativeAppPlatform();

  if (isNativeApp) {
    try {
      console.log('[Auth] Native Google Sign-In 시작');
      // 1. Google Sign-In 초기화 보장
      await initializeGoogleSignIn();

      // 2. 로그인 실행 (clientId 호환성 옵션 포함)
      const clientId = getValidClientId();
      // @ts-expect-error: clientId option compatibility
      const result = await GoogleSignIn.signIn({ clientId });
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
    } catch (e: unknown) {
      console.error('[Auth] Native Google Sign-In 에러:', e);
      const errorMessage = e instanceof Error ? e.message : 'Google Sign-In failed';
      return {
        error: {
          name: 'AuthError',
          status: 400,
          message: errorMessage,
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
