// 토스 로그인 유틸리티
// 참고: https://developers-apps-in-toss.toss.im/login/develop.html

import { appLogin } from '@apps-in-toss/web-framework';
import { APP_CONFIG } from '../config/app';

export interface TossUser {
  userKey: number;
  name?: string;
  phone?: string;
  ci?: string;
  birthday?: string;
  nationality?: string;
  gender?: string;
}

/**
 * 토스 로그인 실행
 * @returns 인가 코드와 referrer
 */
export async function openTossLogin(): Promise<{ authorizationCode: string; referrer: string }> {
  try {
    // 브라우저 환경에서는 토스 앱이 아니므로 에러 처리
    if (typeof window === 'undefined' || !(window as any).ReactNativeWebView) {
      throw new Error('토스 앱 환경에서만 사용할 수 있습니다.');
    }

    const result = await appLogin();

    if (!result) {
      throw new Error('토스 로그인에 실패했습니다.');
    }

    if (result.statusCode !== 'SUCCESS') {
      throw new Error(`토스 로그인 실패: ${result.statusCode}`);
    }

    return {
      authorizationCode: result.authorizationCode,
      referrer: result.referrer || 'DEFAULT',
    };
  } catch (error) {
    console.error('토스 로그인 오류:', error);
    throw error;
  }
}

/**
 * 인가 코드로 AccessToken 받기
 * @param authorizationCode 인가 코드
 * @param referrer referrer
 * @returns AccessToken 정보
 */
export async function getAccessToken(
  authorizationCode: string,
  referrer: string
): Promise<{
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  scope: string;
}> {
  try {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorizationCode,
        referrer,
      }),
    });

    if (!response.ok) {
      throw new Error(`AccessToken 발급 실패: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.resultType !== 'SUCCESS') {
      throw new Error(`AccessToken 발급 실패: ${data.resultType}`);
    }

    return data.success;
  } catch (error) {
    console.error('AccessToken 발급 오류:', error);
    throw error;
  }
}

/**
 * AccessToken으로 사용자 정보 조회
 * @param accessToken AccessToken
 * @returns 사용자 정보
 */
export async function getUserInfo(accessToken: string): Promise<TossUser> {
  try {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api-partner/v1/apps-in-toss/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`사용자 정보 조회 실패: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.resultType !== 'SUCCESS') {
      throw new Error(`사용자 정보 조회 실패: ${data.resultType}`);
    }

    return data.success;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 토스 로그인 전체 프로세스 실행
 * @returns 사용자 정보
 */
export async function loginWithToss(): Promise<TossUser> {
  try {
    // 1. 인가 코드 받기
    const { authorizationCode, referrer } = await openTossLogin();

    // 2. AccessToken 받기
    const { accessToken } = await getAccessToken(authorizationCode, referrer);

    // 3. 사용자 정보 조회
    const userInfo = await getUserInfo(accessToken);

    return userInfo;
  } catch (error) {
    console.error('토스 로그인 프로세스 오류:', error);
    throw error;
  }
}

