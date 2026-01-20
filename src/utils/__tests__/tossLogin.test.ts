import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTossLogin } from '../tossLogin';
import { appLogin } from '@apps-in-toss/web-framework';

// Mock dependencies
vi.mock('@apps-in-toss/web-framework', () => ({
  appLogin: vi.fn(),
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('tossLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.ReactNativeWebView
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it('should return error when not in Toss app environment', async () => {
    const result = await handleTossLogin();

    expect(result.success).toBe(false);
    expect(result.error).toContain('토스 앱에서만');
  });

  it('should handle successful login', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(appLogin).mockResolvedValue({
      authorizationCode: 'test-code',
      referrer: 'DEFAULT',
    } as { authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' });

    const result = await handleTossLogin();

    expect(result.success).toBe(true);
    expect(result.authorizationCode).toBe('test-code');
  });

  it('should handle login error', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(appLogin).mockRejectedValue(new Error('Login failed'));

    const result = await handleTossLogin();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing authorization code', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(appLogin).mockResolvedValue({
      authorizationCode: null,
    } as unknown as { authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' });

    const result = await handleTossLogin();

    expect(result.success).toBe(false);
    expect(result.error).toContain('authorizationCode');
  });
});
