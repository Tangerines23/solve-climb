import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGameLoginHash } from '../tossGameLogin';
import {
  getUserKeyForGame,
  getIsTossLoginIntegratedService,
  appLogin as _appLogin,
} from '@apps-in-toss/web-framework';

// Mock dependencies
vi.mock('@apps-in-toss/web-framework', () => ({
  getUserKeyForGame: vi.fn(),
  getIsTossLoginIntegratedService: vi.fn(),
  appLogin: vi.fn(),
}));

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

  it('should return error when not integrated service', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(getIsTossLoginIntegratedService).mockResolvedValue(false);

    const result = await getGameLoginHash();

    expect(result.success).toBe(false);
    expect(result.errorType).toBe('UNSUPPORTED_VERSION');
  });

  it('should get game login hash successfully', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(getIsTossLoginIntegratedService).mockResolvedValue(true);
    vi.mocked(getUserKeyForGame).mockResolvedValue({
      type: 'HASH',
      hash: 'test-hash',
    } as { type: 'HASH'; hash: string });

    const result = await getGameLoginHash();

    expect(result.success).toBe(true);
    expect(result.hash).toBe('test-hash');
  });

  it('should handle getUserKeyForGame error', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {};
    vi.mocked(getIsTossLoginIntegratedService).mockResolvedValue(true);
    vi.mocked(getUserKeyForGame).mockRejectedValue(new Error('API error'));

    const result = await getGameLoginHash();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
