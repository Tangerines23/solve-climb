import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGameLoginHash } from '../tossGameLogin';

// @apps-in-toss/web-framework 제거 시 mock 제거. 패키지 복구 시 mock 및 기대값 복구.
// vi.mock('@apps-in-toss/web-framework', () => ({
//   getUserKeyForGame: vi.fn(),
//   getIsTossLoginIntegratedService: vi.fn(),
//   appLogin: vi.fn(),
// }));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

vi.mock('../env', () => ({
  ENV: {
    TOSS_GAME_CATEGORY: 'test-category',
  },
}));

describe('tossGameLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it('should return error when not in Toss app environment', async () => {
    const result = await getGameLoginHash();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return stub error when in Toss app (web-framework 비활성)', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};

    const result = await getGameLoginHash();

    expect(result.success).toBe(false);
    expect(result.error).toContain('비활성화');
    expect(result.errorType).toBe('ERROR');
  });
});
