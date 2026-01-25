import { vi } from 'vitest';

/**
 * Toss SDK 통합 Mock
 * 모든 테스트에서 동일한 인터페이스를 보장합니다.
 */
export const mockTossSdk = {
  // 광고 관련
  showAd: vi.fn().mockResolvedValue({ success: true }),
  hideAd: vi.fn().mockResolvedValue({ success: true }),

  // 브라우저/시스템
  openUrl: vi.fn().mockResolvedValue({ success: true }),
  vibrate: vi.fn(),

  // 세션/인증
  getTossToken: vi.fn().mockResolvedValue('test-toss-token'),
};

// Global injection (if needed)
if (typeof window !== 'undefined') {
  (window as any).TossAds = mockTossSdk;
}
