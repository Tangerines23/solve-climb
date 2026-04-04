import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analytics } from '../analytics';
import * as Sentry from '@sentry/react';
import { logger } from '@/utils/logger';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    group: vi.fn((_tag, _title, cb) => cb()),
    table: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setUser', () => {
    it('should set Sentry user', () => {
      analytics.setUser('test-user-id', { email: 'test@example.com' });
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'test-user-id',
        email: 'test@example.com',
      });
    });

    it('should clear Sentry user if userId is null', () => {
      analytics.setUser(null);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should log in dev mode', () => {
      // analytics.ts uses import.meta.env.DEV
      // Assuming test environment correctly flags DEV or we just check if it's called
      analytics.setUser('log-test');
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('should add Sentry breadcrumb', () => {
      analytics.trackEvent({
        category: 'auth',
        action: 'login',
        label: 'google',
        data: { success: true },
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'auth',
        message: 'login: google',
        data: { success: true },
        level: 'info',
      });
    });

    it('should handle missing label in message', () => {
      analytics.trackEvent({
        category: 'system',
        action: 'boot',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'system',
        message: 'boot',
        data: undefined,
        level: 'info',
      });
    });
  });

  describe('Helper Functions', () => {
    it('should trackQuizStart', () => {
      const spy = vi.spyOn(analytics, 'trackEvent');
      analytics.trackQuizStart('mountain-1', 'category-1');

      expect(spy).toHaveBeenCalledWith({
        category: 'quiz',
        action: 'start',
        data: { mountainId: 'mountain-1', categoryId: 'category-1' },
      });
      spy.mockRestore();
    });

    it('should trackQuizEnd', () => {
      const spy = vi.spyOn(analytics, 'trackEvent');
      analytics.trackQuizEnd('mountain-1', 'category-1', 100, true);

      expect(spy).toHaveBeenCalledWith({
        category: 'quiz',
        action: 'end',
        value: 100,
        data: { mountainId: 'mountain-1', categoryId: 'category-1', isSuccess: true },
      });
      spy.mockRestore();
    });
  });
});
