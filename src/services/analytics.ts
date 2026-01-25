import * as Sentry from '@sentry/react';
import { logger } from '@/utils/logger';

/**
 * 분석 이벤트 카테고리
 */
export type EventCategory = 'auth' | 'quiz' | 'shop' | 'system' | 'navigation';

/**
 * 분석 이벤트 정의
 */
export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  data?: Record<string, any>;
}

/**
 * 분석 인터페이스
 */
interface IAnalyticsProvider {
  trackEvent(event: AnalyticsEvent): void;
  setUser(userId: string | null, properties?: Record<string, any>): void;
}

/**
 * Sentry 프로바이더
 */
class SentryProvider implements IAnalyticsProvider {
  trackEvent(event: AnalyticsEvent): void {
    Sentry.addBreadcrumb({
      category: event.category,
      message: `${event.action}${event.label ? `: ${event.label}` : ''}`,
      data: event.data,
      level: 'info',
    });
  }

  setUser(userId: string | null, properties?: Record<string, any>): void {
    Sentry.setUser(userId ? { id: userId, ...properties } : null);
  }
}

/**
 * 통합 분석 서비스 (Singleton)
 */
class AnalyticsService {
  private providers: IAnalyticsProvider[] = [];

  constructor() {
    // 기본적으로 Sentry 연결
    this.providers.push(new SentryProvider());
  }

  /**
   * 사용자 정보 설정
   */
  setUser(userId: string | null, properties?: Record<string, any>): void {
    if (import.meta.env.DEV) {
      logger.info('Analytics', `User set: ${userId}`, properties);
    }
    this.providers.forEach((p) => p.setUser(userId, properties));
  }

  /**
   * 이벤트 기록
   */
  trackEvent(event: AnalyticsEvent): void {
    if (import.meta.env.DEV) {
      logger.group('Analytics', `Event: ${event.category} > ${event.action}`, () => {
        if (event.label) logger.info('Analytics', `Label: ${event.label}`);
        if (event.value !== undefined) logger.info('Analytics', `Value: ${event.value}`);
        if (event.data) logger.table('Analytics', event.data);
      });
    }

    this.providers.forEach((p) => p.trackEvent(event));
  }

  /**
   * 편의 함수: 퀴즈 시작
   */
  trackQuizStart(mountainId: string, categoryId: string): void {
    this.trackEvent({
      category: 'quiz',
      action: 'start',
      data: { mountainId, categoryId },
    });
  }

  /**
   * 편의 함수: 퀴즈 종료
   */
  trackQuizEnd(mountainId: string, categoryId: string, score: number, isSuccess: boolean): void {
    this.trackEvent({
      category: 'quiz',
      action: 'end',
      value: score,
      data: { mountainId, categoryId, isSuccess },
    });
  }
}

export const analytics = new AnalyticsService();
