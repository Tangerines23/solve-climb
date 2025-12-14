// 토스 인증 및 Supabase 연동 유틸리티
import { supabase } from './supabaseClient';
import { ENV } from './env';
import { logError } from './errorHandler';

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
    const response = await fetch('https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

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
): Promise<{ user: any; loginInfo: { email: string; password: string } }> {
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

    const authUrl = `${ENV.SUPABASE_URL}/functions/v1/toss-auth`;
    
    // Edge Function 호출 (인증 없이 호출 가능하도록 설정)
    let response: Response;
    try {
      response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY,
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
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기 시도
        const text = await response.text().catch(() => '');
        errorData = { message: text || `HTTP ${response.status}` };
      }
      
      throw new Error(
        `사용자 생성/업데이트 실패 (${response.status}):\n` +
        `${errorData.error || errorData.message || JSON.stringify(errorData)}\n\n` +
        `Edge Function URL: ${authUrl}`
      );
    }

    const data = await response.json().catch((parseError) => {
      throw new Error(`응답 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    });

    if (!data.success || !data.user || !data.loginInfo) {
      throw new Error(
        data.error || 
        '사용자를 생성할 수 없습니다. Edge Function 응답을 확인해주세요.'
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
): Promise<{ user: any; session: any }> {
  // 호출 추적 로깅
  console.log('[토스 로그인 플로우] 함수 호출됨', {
    timestamp: new Date().toISOString(),
    authorizationCode: authorizationCode?.substring(0, 20) + '...',
    referrer,
    stack: new Error().stack?.split('\n').slice(0, 5).join('\n'),
  });

  try {
    // 환경 변수 검증
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      const missing = [];
      if (!ENV.SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
      if (!ENV.SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
      throw new Error(
        `환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
        `Edge Function에 접근할 수 없습니다. .env 파일을 확인해주세요.`
      );
    }

    const oauthUrl = `${ENV.SUPABASE_URL}/functions/v1/toss-oauth`;
    
    console.log('[토스 로그인 플로우] toss-oauth Edge Function 호출 시작', {
      url: oauthUrl,
      timestamp: new Date().toISOString(),
    });
    
    // 1. Edge Function으로 AccessToken 받기
    let accessTokenResponse: Response;
    try {
      const fetchStartTime = Date.now();
      accessTokenResponse = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          authorizationCode,
          referrer,
        }),
      });
      
      const fetchEndTime = Date.now();
      console.log('[토스 로그인 플로우] toss-oauth fetch 완료', {
        duration: `${fetchEndTime - fetchStartTime}ms`,
        status: accessTokenResponse.status,
        statusText: accessTokenResponse.statusText,
        ok: accessTokenResponse.ok,
      });
    } catch (fetchError) {
      // 네트워크 오류 (fail to fetch)
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
      let errorData: any = {};
      try {
        errorData = await accessTokenResponse.json();
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기 시도
        const text = await accessTokenResponse.text().catch(() => '');
        errorData = { message: text || `HTTP ${accessTokenResponse.status}` };
      }
      
      // 401 에러인 경우 특별 처리
      if (accessTokenResponse.status === 401) {
        const errorMessage = errorData.message || errorData.error || '인증 실패';
        const details = errorData.details;
        
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
      throw new Error(
        `AccessToken 요청 실패 (${accessTokenResponse.status}):\n` +
        `${errorData.error || errorData.message || JSON.stringify(errorData)}\n\n` +
        `Edge Function URL: ${oauthUrl}`
      );
    }

    const accessTokenData = await accessTokenResponse.json().catch((parseError) => {
      throw new Error(`응답 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
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
    // 가상 이메일과 비밀번호로 로그인
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
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
      session
    };
  } catch (error) {
    logError('토스 로그인 플로우', error);
    throw error;
  }
}

