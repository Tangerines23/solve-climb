import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTossLogin } from '../tossLogin';

// @apps-in-toss/web-framework 제거 시 mock 제거. 패키지 복구 시 아래 mock 및 기대값 복구.
// vi.mock('@apps-in-toss/web-framework', () => ({ appLogin: vi.fn() }));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('tossLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it('should return error when not in Toss app environment', async () => {
    const result = await handleTossLogin();

    expect(result.success).toBe(false);
    expect(result.error).toContain('토스 앱에서만');
  });

  it('should return stub error when in Toss app (web-framework 비활성)', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};

    const result = await handleTossLogin();

    expect(result.success).toBe(false);
    expect(result.error).toContain('비활성화');
  });
});
