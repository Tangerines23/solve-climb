/**
 * Supabase 인증 테스트 유틸리티
 * 개발 환경에서 인증 설정을 확인하고 테스트하는 데 사용됩니다.
 */

import { supabase } from './supabaseClient';
import { ENV } from './env';

export interface AuthTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 콜백 URL 확인
 */
export function getCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
}

/**
 * Supabase 연결 테스트
 */
export async function testSupabaseConnection(): Promise<AuthTestResult> {
  try {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      return {
        success: false,
        message: 'Supabase 환경 변수가 설정되지 않았습니다.',
        details: {
          SUPABASE_URL: ENV.SUPABASE_URL ? '설정됨' : '미설정',
          SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? '설정됨' : '미설정',
        },
      };
    }

    // 간단한 API 호출로 연결 테스트
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        details: {
          error: error.message,
          code: error.status,
        },
      };
    }

    return {
      success: true,
      message: 'Supabase 연결 성공',
      details: {
        hasSession: !!data.session,
        userId: data.session?.user?.id || null,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Supabase 연결 테스트 중 오류 발생',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * 콜백 URL 설정 확인
 */
export function testCallbackUrl(): AuthTestResult {
  const callbackUrl = getCallbackUrl();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // URL 형식 검증
  const isValidUrl = callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://');
  const hasCallbackPath = callbackUrl.includes('/auth/callback');

  return {
    success: isValidUrl && hasCallbackPath,
    message:
      isValidUrl && hasCallbackPath
        ? '콜백 URL 설정이 올바릅니다'
        : '콜백 URL 설정에 문제가 있습니다',
    details: {
      callbackUrl,
      currentUrl,
      isValidUrl,
      hasCallbackPath,
      expectedFormat: `${window.location.origin}/auth/callback`,
    },
  };
}

/**
 * 전체 인증 설정 테스트
 */
export async function testAuthSetup(): Promise<{
  callbackUrl: AuthTestResult;
  connection: AuthTestResult;
  summary: {
    allPassed: boolean;
    passed: number;
    total: number;
  };
}> {
  const callbackUrlTest = testCallbackUrl();
  const connectionTest = await testSupabaseConnection();

  const tests = [callbackUrlTest, connectionTest];
  const passed = tests.filter((t) => t.success).length;

  return {
    callbackUrl: callbackUrlTest,
    connection: connectionTest,
    summary: {
      allPassed: tests.every((t) => t.success),
      passed,
      total: tests.length,
    },
  };
}

/**
 * OAuth 로그인 테스트 (Google)
 */
export async function testGoogleLogin(): Promise<AuthTestResult> {
  try {
    const callbackUrl = getCallbackUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return {
        success: false,
        message: 'Google 로그인 시작 실패',
        details: {
          error: error.message,
        },
      };
    }

    // OAuth는 리디렉션을 시작하므로 여기서는 성공만 반환
    return {
      success: true,
      message: 'Google 로그인 리디렉션 시작됨',
      details: {
        url: data.url,
        callbackUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Google 로그인 테스트 중 오류 발생',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
