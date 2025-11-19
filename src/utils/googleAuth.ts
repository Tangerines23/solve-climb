// 구글 로그인 유틸리티
import { APP_CONFIG } from '../config/app';

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

/**
 * Google Identity Services를 사용한 구글 로그인
 */
export const openGoogleLogin = (): Promise<GoogleUser> => {
  return new Promise((resolve, reject) => {
    if (!APP_CONFIG.GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID가 설정되지 않았습니다. 환경변수 VITE_GOOGLE_CLIENT_ID를 설정해주세요.'));
      return;
    }

    // Google Identity Services 스크립트 로드
    const scriptId = 'google-identity-services';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const initializeGoogleAuth = () => {
      try {
        // @ts-ignore - Google Identity Services는 전역 객체로 로드됨
        if (typeof (window as any).google === 'undefined' || !(window as any).google.accounts) {
          reject(new Error('Google Identity Services를 로드할 수 없습니다.'));
          return;
        }

        // @ts-ignore
        (window as any).google.accounts.oauth2.initTokenClient({
          client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            try {
              // 사용자 정보 가져오기
              const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
              );
              
              if (!userInfoResponse.ok) {
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
              }
              
              const userInfo = await userInfoResponse.json();
              
              const user: GoogleUser = {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                sub: userInfo.id,
              };
              
              resolve(user);
            } catch (error) {
              reject(new Error('사용자 정보를 가져오는데 실패했습니다.'));
            }
          },
        }).requestAccessToken();
      } catch (error) {
        reject(new Error('구글 로그인 초기화에 실패했습니다.'));
      }
    };

    if (script.onload) {
      script.onload = initializeGoogleAuth;
    } else {
      // 이미 로드된 경우
      if (typeof window !== 'undefined' && (window as any).google?.accounts) {
        initializeGoogleAuth();
      } else {
        script.onload = initializeGoogleAuth;
      }
    }
  });
};

/**
 * 구글 OAuth 콜백 처리 (리다이렉트 방식)
 */
export const handleGoogleCallback = async (code: string): Promise<GoogleUser> => {
  try {
    // 실제로는 서버에서 토큰 교환을 해야 하지만, 
    // 여기서는 간단히 클라이언트에서 처리하는 예시입니다.
    // 프로덕션에서는 반드시 서버를 통해 처리해야 합니다.
    
    const response = await fetch(`https://oauth2.googleapis.com/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
        client_secret: '', // 클라이언트 시크릿은 서버에서만 사용
        redirect_uri: window.location.origin,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('토큰 교환 실패');
    }

    const data = await response.json();
    
    // 사용자 정보 가져오기
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('사용자 정보 가져오기 실패');
    }

    const userInfo = await userResponse.json();
    
    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      sub: userInfo.id,
    };
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

/**
 * 이메일이 어드민 이메일 목록에 있는지 확인
 */
export const isAdminEmail = (email: string): boolean => {
  return APP_CONFIG.ADMIN_EMAILS.includes(email.toLowerCase());
};

