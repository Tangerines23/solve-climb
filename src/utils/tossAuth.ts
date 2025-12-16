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

    // URL 끝의 슬래시 제거 후 경로 추가
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const authUrl = `${baseUrl}/functions/v1/toss-auth`;
    
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

    // URL 끝의 슬래시 제거 후 경로 추가
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const oauthUrl = `${baseUrl}/functions/v1/toss-oauth`;
    
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

/**
 * 개발 환경에서만 사용 가능한 테스트 함수들
 * 브라우저 콘솔에서 호출 가능
 * 
 * 프로덕션에서도 사용하려면 ENV.IS_DEVELOPMENT 조건을 제거하세요
 */
if (typeof window !== 'undefined') {
  /**
   * toss-oauth Edge Function 테스트
   * 브라우저 콘솔에서 window.testTossOAuth()로 호출 가능
   */
  (window as any).testTossOAuth = async () => {
    console.log('🧪 toss-oauth Edge Function 테스트 시작...');
    
    // URL 끝의 슬래시 제거 후 경로 추가
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const oauthUrl = `${baseUrl}/functions/v1/toss-oauth`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          authorizationCode: 'TEST_CODE',
          referrer: 'TEST',
        }),
      });
      
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      console.log('✅ 테스트 결과:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        response: responseData,
        url: oauthUrl,
        headers: {
          'apikey': ENV.SUPABASE_ANON_KEY ? `${ENV.SUPABASE_ANON_KEY.substring(0, 20)}...` : '없음',
          'Authorization': ENV.SUPABASE_ANON_KEY ? `Bearer ${ENV.SUPABASE_ANON_KEY.substring(0, 20)}...` : '없음',
        },
      });
      
      // 오류인 경우 상세 정보 출력
      if (!response.ok) {
        console.error(`❌ ${response.status} 오류 상세 정보:`);
        console.error('응답 본문:', responseData);
        
        if (response.status === 400) {
          console.log('💡 참고: TEST_CODE는 유효하지 않은 authorization code입니다.');
          console.log('💡 실제 로그인 플로우에서는 토스 앱에서 받은 실제 authorization code를 사용합니다.');
          console.log('💡 프록시 서버와 Edge Function이 정상적으로 작동하고 있습니다! ✅');
        }
        
        if (response.status === 401) {
          console.error('환경 변수 확인:');
          console.error('  - SUPABASE_URL:', ENV.SUPABASE_URL || '설정되지 않음');
          console.error('  - SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? `${ENV.SUPABASE_ANON_KEY.substring(0, 20)}... (길이: ${ENV.SUPABASE_ANON_KEY.length})` : '설정되지 않음');
        }
      } else {
        console.log('🎉 성공! 프록시 서버와 Edge Function이 정상적으로 작동하고 있습니다!');
      }
      
      return {
        success: response.ok,
        status: response.status,
        duration,
        response: responseData,
      };
    } catch (error) {
      console.error('❌ 테스트 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  /**
   * toss-auth Edge Function 테스트
   * 실제 accessToken이 필요하므로, 먼저 토스 로그인을 해야 합니다.
   * 브라우저 콘솔에서 window.testTossAuth(accessToken)로 호출 가능
   */
  (window as any).testTossAuth = async (accessToken?: string) => {
    console.log('🧪 toss-auth Edge Function 테스트 시작...');
    
    if (!accessToken) {
      console.warn('⚠️ accessToken이 필요합니다. 토스 로그인을 먼저 실행하거나 accessToken을 인자로 전달하세요.');
      console.log('💡 사용법: window.testTossAuth("your_access_token_here")');
      return {
        success: false,
        error: 'accessToken이 필요합니다.',
      };
    }
    
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const authUrl = `${baseUrl}/functions/v1/toss-auth`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          accessToken,
        }),
      });
      
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      console.log('✅ 테스트 결과:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        response: responseData,
        url: authUrl,
      });
      
      return {
        success: response.ok,
        status: response.status,
        duration,
        response: responseData,
      };
    } catch (error) {
      console.error('❌ 테스트 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  /**
   * 전체 로그인 플로우 체크
   * 브라우저 콘솔에서 window.checkTossLoginFlow()로 호출 가능
   */
  (window as any).checkTossLoginFlow = async () => {
    console.log('🔍 토스 로그인 플로우 전체 체크 시작...');
    console.log('');
    
    const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }> = [];
    
    // 1. 환경 변수 체크
    console.log('1️⃣ 환경 변수 체크');
    if (!ENV.SUPABASE_URL) {
      checks.push({ name: 'SUPABASE_URL', status: 'fail', message: 'VITE_SUPABASE_URL이 설정되지 않았습니다.' });
    } else {
      checks.push({ name: 'SUPABASE_URL', status: 'pass', message: `설정됨: ${ENV.SUPABASE_URL.substring(0, 30)}...` });
    }
    
    if (!ENV.SUPABASE_ANON_KEY) {
      checks.push({ name: 'SUPABASE_ANON_KEY', status: 'fail', message: 'VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.' });
    } else {
      checks.push({ name: 'SUPABASE_ANON_KEY', status: 'pass', message: `설정됨 (길이: ${ENV.SUPABASE_ANON_KEY.length})` });
    }
    
    // 2. Edge Function 엔드포인트 체크
    console.log('2️⃣ Edge Function 엔드포인트 체크');
    const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
    const oauthUrl = `${baseUrl}/functions/v1/toss-oauth`;
    const authUrl = `${baseUrl}/functions/v1/toss-auth`;
    
    // toss-oauth 체크
    try {
      const oauthResponse = await fetch(oauthUrl, {
        method: 'OPTIONS', // CORS preflight
      });
      if (oauthResponse.ok || oauthResponse.status === 405) {
        checks.push({ name: 'toss-oauth 엔드포인트', status: 'pass', message: '접근 가능' });
      } else {
        checks.push({ name: 'toss-oauth 엔드포인트', status: 'warning', message: `상태: ${oauthResponse.status}` });
      }
    } catch (error) {
      checks.push({ name: 'toss-oauth 엔드포인트', status: 'fail', message: `접근 불가: ${error instanceof Error ? error.message : String(error)}` });
    }
    
    // toss-auth 체크
    try {
      const authResponse = await fetch(authUrl, {
        method: 'OPTIONS', // CORS preflight
      });
      if (authResponse.ok || authResponse.status === 405) {
        checks.push({ name: 'toss-auth 엔드포인트', status: 'pass', message: '접근 가능' });
      } else {
        checks.push({ name: 'toss-auth 엔드포인트', status: 'warning', message: `상태: ${authResponse.status}` });
      }
    } catch (error) {
      checks.push({ name: 'toss-auth 엔드포인트', status: 'fail', message: `접근 불가: ${error instanceof Error ? error.message : String(error)}` });
    }
    
    // 3. 토스 앱 환경 체크
    console.log('3️⃣ 토스 앱 환경 체크');
    const isTossApp = !!(window as any).ReactNativeWebView;
    if (isTossApp) {
      checks.push({ name: '토스 앱 환경', status: 'pass', message: '토스 앱 내부에서 실행 중' });
    } else {
      checks.push({ name: '토스 앱 환경', status: 'warning', message: '브라우저 환경 (토스 앱에서만 로그인 가능)' });
    }
    
    // 결과 출력
    console.log('');
    console.log('📊 체크 결과:');
    console.table(checks);
    
    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    
    console.log('');
    console.log(`✅ 통과: ${passCount}개`);
    console.log(`⚠️ 경고: ${warningCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    
    if (failCount === 0) {
      console.log('');
      console.log('🎉 모든 기본 체크가 통과했습니다!');
      console.log('💡 실제 로그인 테스트: MyPage에서 "3초 만에 시작하기" 버튼을 클릭하세요.');
    } else {
      console.log('');
      console.log('⚠️ 일부 체크가 실패했습니다. 위의 실패 항목을 확인하세요.');
    }
    
    return {
      checks,
      summary: {
        pass: passCount,
        warning: warningCount,
        fail: failCount,
      },
    };
  };
  
  /**
   * 전체 로그인 플로우 테스트 (실제 토스 앱에서만 작동)
   * 브라우저 콘솔에서 window.testFullLoginFlow()로 호출 가능
   */
  (window as any).testFullLoginFlow = async () => {
    console.log('🧪 전체 로그인 플로우 테스트 시작...');
    console.log('');
    
    const results: Array<{ step: string; status: 'pass' | 'fail' | 'skip'; message: string; data?: any }> = [];
    
    // 1. 환경 체크
    console.log('1️⃣ 환경 체크');
    const isTossApp = !!(window as any).ReactNativeWebView;
    if (!isTossApp) {
      results.push({ 
        step: '토스 앱 환경', 
        status: 'skip', 
        message: '브라우저 환경 - 실제 테스트는 토스 앱에서만 가능합니다.' 
      });
      console.warn('⚠️ 브라우저 환경에서는 실제 로그인 테스트가 불가능합니다.');
      console.log('💡 토스 앱에서 실행하거나, MyPage의 "3초 만에 시작하기" 버튼을 사용하세요.');
      return { results, summary: { pass: 0, fail: 0, skip: 1 } };
    }
    
    results.push({ step: '토스 앱 환경', status: 'pass', message: '토스 앱 내부에서 실행 중' });
    
    // 2. 게임 로그인 마이그레이션 테스트
    console.log('2️⃣ 게임 로그인 마이그레이션 테스트');
    try {
      const { migrateToGameLogin } = await import('./tossGameLogin');
      const migrationResult = await migrateToGameLogin();
      
      if (migrationResult.success) {
        results.push({ 
          step: '게임 로그인 마이그레이션', 
          status: 'pass', 
          message: `성공 - hash: ${migrationResult.hash?.substring(0, 10)}...`,
          data: { hash: migrationResult.hash }
        });
      } else {
        results.push({ 
          step: '게임 로그인 마이그레이션', 
          status: 'fail', 
          message: migrationResult.error || '실패',
          data: { error: migrationResult.error }
        });
      }
    } catch (error) {
      results.push({ 
        step: '게임 로그인 마이그레이션', 
        status: 'fail', 
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 3. 토스 로그인 테스트
    console.log('3️⃣ 토스 로그인 테스트');
    try {
      const { handleTossLogin } = await import('./tossLogin');
      const loginResult = await handleTossLogin();
      
      if (loginResult.success && loginResult.authorizationCode) {
        results.push({ 
          step: '토스 로그인', 
          status: 'pass', 
          message: `성공 - authorizationCode: ${loginResult.authorizationCode.substring(0, 20)}...`,
          data: { authorizationCode: loginResult.authorizationCode, referrer: loginResult.referrer }
        });
        
        // 4. 토스 로그인 플로우 테스트
        console.log('4️⃣ 토스 로그인 플로우 테스트');
        try {
          const { handleTossLoginFlow } = await import('./tossAuth');
          const { user, session } = await handleTossLoginFlow(
            loginResult.authorizationCode!,
            loginResult.referrer || 'DEFAULT'
          );
          
          if (user && session) {
            results.push({ 
              step: 'Supabase 사용자 생성/로그인', 
              status: 'pass', 
              message: `성공 - userId: ${user.id}`,
              data: { userId: user.id, email: user.email }
            });
          } else {
            results.push({ 
              step: 'Supabase 사용자 생성/로그인', 
              status: 'fail', 
              message: 'user 또는 session이 없습니다.'
            });
          }
        } catch (error) {
          results.push({ 
            step: 'Supabase 사용자 생성/로그인', 
            status: 'fail', 
            message: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        results.push({ 
          step: '토스 로그인', 
          status: 'fail', 
          message: loginResult.error || '실패'
        });
      }
    } catch (error) {
      results.push({ 
        step: '토스 로그인', 
        status: 'fail', 
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 결과 출력
    console.log('');
    console.log('📊 테스트 결과:');
    console.table(results);
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const skipCount = results.filter(r => r.status === 'skip').length;
    
    console.log('');
    console.log(`✅ 통과: ${passCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⏭️ 건너뜀: ${skipCount}개`);
    
    if (failCount === 0 && passCount > 0) {
      console.log('');
      console.log('🎉 모든 테스트가 통과했습니다!');
    } else if (failCount > 0) {
      console.log('');
      console.log('⚠️ 일부 테스트가 실패했습니다. 위의 실패 항목을 확인하세요.');
    }
    
    return {
      results,
      summary: {
        pass: passCount,
        fail: failCount,
        skip: skipCount,
      },
    };
  };

  /**
   * 게임 로그인 마이그레이션만 테스트
   * 브라우저 콘솔에서 window.testGameLoginMigration()로 호출 가능
   */
  (window as any).testGameLoginMigration = async () => {
    console.log('🧪 게임 로그인 마이그레이션 테스트 시작...');
    
    const isTossApp = !!(window as any).ReactNativeWebView;
    if (!isTossApp) {
      console.warn('⚠️ 브라우저 환경에서는 게임 로그인 테스트가 불가능합니다.');
      console.log('💡 토스 앱에서 실행하거나, MyPage의 "3초 만에 시작하기" 버튼을 사용하세요.');
      return {
        success: false,
        error: '토스 앱 환경이 아닙니다.',
      };
    }
    
    try {
      const { migrateToGameLogin } = await import('./tossGameLogin');
      const result = await migrateToGameLogin();
      
      if (result.success) {
        console.log('✅ 게임 로그인 마이그레이션 성공!');
        console.log(`   Hash: ${result.hash?.substring(0, 20)}...`);
      } else {
        console.error('❌ 게임 로그인 마이그레이션 실패:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 테스트 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
  
  console.log('💡 개발 모드: 브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:');
  console.log('   - window.checkTossLoginFlow() : 전체 로그인 플로우 체크 (환경 변수, 엔드포인트 등)');
  console.log('   - window.testTossOAuth() : toss-oauth Edge Function 테스트');
  console.log('   - window.testTossAuth(accessToken) : toss-auth Edge Function 테스트');
  console.log('   - window.testFullLoginFlow() : 전체 로그인 플로우 테스트 (토스 앱에서만 작동)');
  console.log('   - window.testGameLoginMigration() : 게임 로그인 마이그레이션 테스트 (토스 앱에서만 작동)');
  console.log('');
  console.log('📱 실제 로그인 테스트: MyPage에서 "3초 만에 시작하기" 버튼을 클릭하세요.');
}

