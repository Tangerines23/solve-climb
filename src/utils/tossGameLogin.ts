// 게임 로그인 및 토스 로그인 마이그레이션 유틸리티
// @apps-in-toss/web-framework 제거 시 주석 처리. 패키지 복구 시 아래 주석 해제.
// import {
//   getUserKeyForGame,
//   getIsTossLoginIntegratedService,
//   appLogin,
// } from '@apps-in-toss/web-framework';
import { logError } from './errorHandler';
import { ENV } from './env';

/**
 * 토스 앱 환경인지 확인
 * @returns 토스 앱 내부에서 실행 중인지 여부
 */
function isTossAppEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // ReactNativeWebView가 있으면 토스 앱 내부
  return !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
}

/**
 * 게임 로그인 hash 발급 결과 타입
 */
export interface GameLoginHashResult {
  success: boolean;
  hash?: string;
  error?: string;
  errorType?: 'UNSUPPORTED_VERSION' | 'INVALID_CATEGORY' | 'ERROR' | 'UNKNOWN';
}

/**
 * 게임 로그인 hash 발급
 * @returns 게임 로그인 hash 값
 */
export async function getGameLoginHash(): Promise<GameLoginHashResult> {
  try {
    // 토스 앱 환경 확인
    if (!isTossAppEnvironment()) {
      const isLocalDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('192.168.'));

      return {
        success: false,
        error: isLocalDev
          ? '로컬 개발 환경에서는 게임 로그인을 테스트할 수 없습니다. 실제 토스 앱에서 테스트해주세요.'
          : '토스 앱에서만 게임 로그인을 사용할 수 있습니다.',
        errorType: 'ERROR',
      };
    }

    // @apps-in-toss/web-framework 제거 시: getUserKeyForGame 미호출. 패키지 복구 시 아래 주석 해제.
    // const result = await getUserKeyForGame();
    // if (!result) { return { success: false, error: '지원하지 않는 앱 버전이에요.', errorType: 'UNSUPPORTED_VERSION' }; }
    // if (result === 'INVALID_CATEGORY') { return { success: false, error: '게임 카테고리가 아닌 미니앱이에요.', errorType: 'INVALID_CATEGORY' }; }
    // if (result === 'ERROR') { return { success: false, error: '사용자 키 조회 중 오류가 발생했어요.', errorType: 'ERROR' }; }
    // if (result.type !== 'HASH') { return { success: false, error: '알 수 없는 반환값입니다.', errorType: 'UNKNOWN' }; }
    // return { success: true, hash: result.hash };

    return {
      success: false,
      error: '토스 웹 프레임워크가 비활성화되어 있습니다. (패키지 제거 상태)',
      errorType: 'ERROR',
    };
  } catch (error) {
    logError('게임 로그인 hash 발급', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '게임 로그인 hash 발급 중 오류가 발생했습니다.',
      errorType: 'ERROR',
    };
  }
}

/**
 * 토스 로그인 연동 여부 확인 결과 타입
 */
export interface TossLoginIntegrationStatus {
  success: boolean;
  isIntegrated?: boolean;
  error?: string;
}

/**
 * 토스 로그인 연동 여부 확인
 * @returns 토스 로그인 연동 여부
 */
export async function checkTossLoginIntegration(): Promise<TossLoginIntegrationStatus> {
  // @apps-in-toss/web-framework 제거 시: getIsTossLoginIntegratedService 미호출. 패키지 복구 시 아래 주석 해제.
  // const status = await getIsTossLoginIntegratedService();
  // if (status === undefined) { return { success: false, error: '지원하지 않는 앱 버전이에요.' }; }
  // return { success: true, isIntegrated: status === true };
  return {
    success: true,
    isIntegrated: false,
  };
}

/**
 * 마이그레이션 상태 조회 결과 타입
 */
export interface MigrationStatusResult {
  success: boolean;
  isMapped?: boolean;
  error?: string;
}

/**
 * 마이그레이션 상태 조회
 * @param hash 게임 로그인 hash
 * @returns 매핑 여부
 */
export async function getMigrationStatus(hash: string): Promise<MigrationStatusResult> {
  try {
    if (!ENV.VITE_SUPABASE_URL || !ENV.VITE_SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: '환경 변수가 설정되지 않았습니다.',
      };
    }

    const baseUrl = ENV.VITE_SUPABASE_URL.replace(/\/$/, '');
    const migrationStatusUrl = `${baseUrl}/functions/v1/migration-status`;

    const response = await fetch(migrationStatusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ hash }),
    });

    if (!response.ok) {
      let errorData: unknown = {};
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        errorData = { message: text || `HTTP ${response.status}` };
      }

      return {
        success: false,
        error:
          (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          `마이그레이션 상태 조회 실패 (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      isMapped: data.isMapped === true,
    };
  } catch (error) {
    logError('마이그레이션 상태 조회', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '마이그레이션 상태 조회 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 마이그레이션 링크 생성 결과 타입
 */
export interface MigrationLinkResult {
  success: boolean;
  error?: string;
}

/**
 * 마이그레이션 링크 생성
 * @param hash 게임 로그인 hash
 * @param authorizationCode 토스 인가 코드
 * @param referrer 토스 referrer
 * @returns 성공 여부
 */
export async function createMigrationLink(
  hash: string,
  authorizationCode: string,
  referrer?: string
): Promise<MigrationLinkResult> {
  try {
    if (!ENV.VITE_SUPABASE_URL || !ENV.VITE_SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: '환경 변수가 설정되지 않았습니다.',
      };
    }

    const baseUrl = ENV.VITE_SUPABASE_URL.replace(/\/$/, '');
    const migrationLinkUrl = `${baseUrl}/functions/v1/migration-link`;

    const response = await fetch(migrationLinkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        hash,
        authorizationCode,
        referrer: referrer || 'DEFAULT',
      }),
    });

    if (!response.ok) {
      let errorData: unknown = {};
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        errorData = { message: text || `HTTP ${response.status}` };
      }

      return {
        success: false,
        error:
          (errorData as { error?: string; message?: string })?.error ||
          (errorData as { error?: string; message?: string })?.message ||
          `마이그레이션 링크 생성 실패 (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: data.success === true,
    };
  } catch (error) {
    logError('마이그레이션 링크 생성', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '마이그레이션 링크 생성 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 게임 로그인 마이그레이션 전체 플로우
 * @returns 성공 여부 및 hash 값
 */
export async function migrateToGameLogin(): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  try {
    // 1. 게임 hash 발급
    const hashResult = await getGameLoginHash();
    if (!hashResult.success || !hashResult.hash) {
      return {
        success: false,
        error: hashResult.error || '게임 로그인 hash를 발급받을 수 없습니다.',
      };
    }

    const hash = hashResult.hash;

    // 2. 토스 로그인 연동 여부 확인
    const integrationStatus = await checkTossLoginIntegration();
    if (!integrationStatus.success) {
      return {
        success: false,
        error: integrationStatus.error || '토스 로그인 연동 확인 중 오류가 발생했습니다.',
      };
    }

    // 3. 토스 로그인이 연동되지 않은 사용자는 hash만 반환
    if (integrationStatus.isIntegrated !== true) {
      return {
        success: true,
        hash,
      };
    }

    // 4. 토스 로그인 연동 사용자는 매핑 여부 확인
    const migrationStatus = await getMigrationStatus(hash);
    if (!migrationStatus.success) {
      return {
        success: false,
        error: migrationStatus.error || '마이그레이션 상태 조회 중 오류가 발생했습니다.',
      };
    }

    // 5. 이미 매핑된 사용자는 hash만 반환
    if (migrationStatus.isMapped === true) {
      return {
        success: true,
        hash,
      };
    }

    // 6. 미매핑 사용자는 토스 로그인 후 매핑 생성
    // @apps-in-toss/web-framework 제거 시: appLogin 미호출. 패키지 복구 시 아래 주석 해제 후 createMigrationLink 호출부 복구.
    // let loginResult;
    // try { loginResult = await appLogin(); } catch (error) { ... }
    // const linkResult = await createMigrationLink(hash, loginResult.authorizationCode, loginResult.referrer);
    // if (!linkResult.success) { return { success: false, error: linkResult.error }; }
    return {
      success: false,
      error: '토스 웹 프레임워크가 비활성화되어 있습니다. (패키지 제거 상태)',
    };
  } catch (error) {
    logError('게임 로그인 마이그레이션', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '게임 로그인 마이그레이션 중 오류가 발생했습니다.',
    };
  }
}
