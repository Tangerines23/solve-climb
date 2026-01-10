// 토스 인증 및 Supabase 연동 유틸리티
import { supabase } from './supabaseClient';
import { ENV } from './env';
import { logError } from './errorHandler';
import type { User } from '@supabase/supabase-js';

/**
 * 토스 사용자 정보 타입
 */
export interface TossUserInfo {
  userKey: number;
  ci: string;
  name: string;
  phone: string;
  birthday?: string;
  gender?: string;
  nationality?: string;
}

/**
 * 토스 API로 사용자 정보 조회
 * @param accessToken 토스 AccessToken
 * @returns 사용자 정보
 */
export async function getTossUserInfo(accessToken: string): Promise<TossUserInfo | null> {
  try {
    const response = await fetch(
      'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/info',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`토스 API 오류: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.resultType === 'SUCCESS' && data.success) {
      return {
        userKey: data.success.userKey,
        ci: data.success.ci || '',
        name: data.success.name || '',
        phone: data.success.phone || '',
        birthday: data.success.birthday,
        gender: data.success.gender,
        nationality: data.success.nationality,
      };
    }

    return null;
  } catch (error) {
    logError('토스 사용자 정보 조회', error);
    throw error;
  }
}

/**
 * Edge Function을 통해 Supabase에 토스 사용자 생성 또는 업데이트
 * @param accessToken 토스 AccessToken
 * @returns Supabase 사용자 정보 및 로그인 정보
 */
export async function createOrUpdateSupabaseUser(
  accessToken: string
): Promise<{ user: User | null; loginInfo: { email: string; password: string } }> {
  try {
    // 환경 변수 검증
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      const missing = [];
      if (!ENV.SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
      if (!ENV.SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
      throw new Error(
        `환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
        `Edge Function에 접근할 수 없습니다.`
      );
    }

    // URL 끝의 슬래시 제거 후 경로 추가
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const authUrl = `${baseUrl}/functions/v1/toss-auth`;

    // Edge Function 호출
    let response: Response;
    try {
      response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ENV.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          accessToken,
        }),
      });
    } catch (fetchError) {
      // 네트워크 오류 (fail to fetch)
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        throw new Error(
          `Edge Function에 연결할 수 없습니다.\n\n` +
          `가능한 원인:\n` +
          `1. Edge Function이 배포되지 않았습니다 (supabase functions deploy toss-auth)\n` +
          `2. Supabase URL이 잘못되었습니다: ${ENV.SUPABASE_URL}\n` +
          `3. 네트워크 연결 문제 또는 CORS 설정 문제\n\n` +
          `원본 오류: ${errorMessage}`
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      let errorData: unknown = {};
      try {
        errorData = await response.json();
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기 시도
        const text = await response.text().catch(() => '');
        errorData = { message: text || `HTTP ${response.status}` };
      }

      const errorMessage =
        (errorData as { error?: string; message?: string })?.error ||
        (errorData as { error?: string; message?: string })?.message ||
        JSON.stringify(errorData);
      throw new Error(
        `사용자 생성/업데이트 실패 (${response.status}):\n` +
        `${errorMessage}\n\n` +
        `Edge Function URL: ${authUrl}`
      );
    }

    const data = await response.json().catch((parseError) => {
      throw new Error(
        `응답 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    });

    if (!data.success || !data.user || !data.loginInfo) {
      throw new Error(
        data.error || '사용자를 생성할 수 없습니다. Edge Function 응답을 확인해주세요.'
      );
    }

    return {
      user: data.user,
      loginInfo: data.loginInfo,
    };
  } catch (error) {
    logError('Supabase 사용자 생성/업데이트', error);
    throw error;
  }
}

/**
 * 토스 로그인 전체 플로우
 * @param authorizationCode 토스 인가 코드
 * @param referrer 토스 referrer
 * @returns Supabase 사용자 정보
 */
export async function handleTossLoginFlow(
  authorizationCode: string,
  referrer: string
): Promise<{ user: User | null; session: { access_token: string; refresh_token: string } | null }> {
  try {
    // 환경 변수 검증
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      // ... error handling ...
      const missing = [];
      if (!ENV.SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
      if (!ENV.SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
      throw new Error(
        `환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
        `Edge Function에 접근할 수 없습니다. .env 파일을 확인해주세요.`
      );
    }

    // URL 끝의 슬래시 제거 후 경로 추가
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const oauthUrl = `${baseUrl}/functions/v1/toss-oauth`;

    // 1. Edge Function으로 AccessToken 받기
    let accessTokenResponse: Response;
    try {
      accessTokenResponse = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ENV.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          authorizationCode,
          referrer,
        }),
      });
    } catch (fetchError) {
      // ... existing error handling ...
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        throw new Error(
          `Edge Function에 연결할 수 없습니다.\n\n` +
          `가능한 원인:\n` +
          `1. Edge Function이 배포되지 않았습니다 (supabase functions deploy toss-oauth)\n` +
          `2. Supabase URL이 잘못되었습니다: ${ENV.SUPABASE_URL}\n` +
          `3. 네트워크 연결 문제 또는 CORS 설정 문제\n\n` +
          `원본 오류: ${errorMessage}`
        );
      }
      throw fetchError;
    }

    if (!accessTokenResponse.ok) {
      // ... existing error handling ...
      let errorData: unknown = {};
      try {
        errorData = await accessTokenResponse.json();
      } catch {
        const text = await accessTokenResponse.text().catch(() => '');
        errorData = { message: text || `HTTP ${accessTokenResponse.status}` };
      }

      // 개발 모드 authorization code 감지
      const isDevMode = authorizationCode.startsWith('DEV_MODE_');

      if (accessTokenResponse.status === 400) {
        // ... existing 400 handling ...
        const errorMessage =
          (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          JSON.stringify(errorData);

        if (isDevMode) {
          throw new Error(
            '개발 모드: 유효하지 않은 authorization code입니다.\n\n' +
            '✅ Edge Function 호출 플로우는 정상적으로 작동하고 있습니다.'
          );
        }

        throw new Error(
          `AccessToken 요청 실패 (400):\n` +
          `${errorMessage}\n\n` +
          `Edge Function URL: ${oauthUrl}`
        );
      }

      // 401 에러인 경우 특별 처리
      if (accessTokenResponse.status === 401) {
        // ... existing 401 handling ...
        const errorDataTyped = errorData as {
          message?: string;
          error?: string;
          details?: {
            hint?: string;
            checkSecrets?: string;
            tossApiError?: { error?: string; message?: string };
          };
        };
        const errorMessage = errorDataTyped.message || errorDataTyped.error || '인증 실패';
        const details = errorDataTyped.details;

        let userMessage = '토스 API 인증에 실패했습니다.\n\n';

        if (details?.hint) {
          userMessage += `${details.hint}\n\n`;
        }

        if (details?.checkSecrets) {
          userMessage += `${details.checkSecrets}\n\n`;
        }

        if (details?.tossApiError) {
          const tossError = details.tossApiError;
          if (tossError.error || tossError.message) {
            userMessage += `토스 API 오류: ${tossError.error || tossError.message}`;
          }
        } else {
          userMessage += errorMessage;
        }

        throw new Error(userMessage);
      }

      // 기타 HTTP 에러
      const errorDataTyped = errorData as { error?: string; message?: string };
      const errorMessage =
        errorDataTyped.error || errorDataTyped.message || JSON.stringify(errorData);
      throw new Error(
        `AccessToken 요청 실패 (${accessTokenResponse.status}):\n` +
        `${errorMessage}\n\n` +
        `Edge Function URL: ${oauthUrl}`
      );
    }

    const accessTokenData = await accessTokenResponse.json().catch((parseError) => {
      throw new Error(
        `응답 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    });

    if (!accessTokenData.success || !accessTokenData.accessToken) {
      throw new Error(
        accessTokenData.error ||
        'AccessToken을 받을 수 없습니다. Edge Function 응답을 확인해주세요.'
      );
    }

    // 2. Edge Function으로 Supabase 사용자 생성/업데이트
    const { user, loginInfo } = await createOrUpdateSupabaseUser(accessTokenData.accessToken);

    // 3. 생성된 사용자로 Supabase 세션 생성
    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: loginInfo.email,
      password: loginInfo.password,
    });

    if (signInError) {
      throw new Error(`로그인 실패: ${signInError.message}`);
    }

    if (!session) {
      throw new Error('세션을 생성할 수 없습니다.');
    }

    return {
      user,
      session,
    };
  } catch (error) {
    logError('토스 로그인 플로우', error);
    throw error;
  }
}


