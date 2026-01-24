import { vi } from 'vitest';

/**
 * 토스 게임 센터 SDK 통합 Mock
 * 모든 테스트에서 동일한 인터페이스와 성공/실패 패턴을 보장합니다.
 */
export const setupTossSDKMock = () => {
    vi.mock('@apps-in-toss/web-framework', () => ({
        submitGameCenterLeaderBoardScore: vi.fn(async ({ score }) => {
            if (!score) return null;
            return { statusCode: 'SUCCESS' };
        }),
        openGameCenterLeaderboard: vi.fn(),
        isMinVersionSupported: vi.fn(() => true),
        getOperationalEnvironment: vi.fn(() => 'toss'),
    }));
};

/**
 * 토스 앱 환경 시뮬레이션
 */
export const simulateTossApp = () => {
    (window as any).ReactNativeWebView = {};
    Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
        configurable: true,
    });
};

/**
 * 일반 브라우저 환경 시뮬레이션
 */
export const simulateBrowser = () => {
    delete (window as any).ReactNativeWebView;
    Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
        configurable: true,
    });
};
