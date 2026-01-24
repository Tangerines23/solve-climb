import { analytics } from '@/services/analytics';
import { logger } from './logger';

/**
 * 전역 성능 지표 측정 (Web Vitals)
 */
export const performanceMonitor = {
  /**
   * 성능 측정 시작
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint) 측정
    this.observeMetric('LCP');
    // FID (First Input Delay) 측정
    this.observeMetric('FID');
    // CLS (Cumulative Layout Shift) 측정
    this.observeMetric('CLS');

    if (import.meta.env.DEV) {
      logger.info('Performance', 'Runtime performance monitoring initialized.');
    }
  },

  /**
   * 브라우저 API를 사용한 지표 관찰
   */
  observeMetric(metricName: 'LCP' | 'FID' | 'CLS'): void {
    try {
      const typeMap = { LCP: 'largest-contentful-paint', FID: 'first-input', CLS: 'layout-shift' };
      const entryType = typeMap[metricName];

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();

        // CLS는 누적값이므로 마지막 엔트리까지 합산이 필요할 수 있으나, 
        // 여기서는 단순화를 위해 개별 엔트리 발생 시 보고 (필요 시 로직 고도화 가능)
        entries.forEach((entry: any) => {
          let value = 0;
          if (metricName === 'LCP') value = entry.startTime;
          else if (metricName === 'FID') value = entry.processingStart - entry.startTime;
          else if (metricName === 'CLS') value = entry.value;

          this.report(metricName, value);
        });
      });

      observer.observe({ type: entryType, buffered: true });
    } catch (e) {
      // 일부 구형 브라우저에서는 지원되지 않을 수 있음
    }
  },

  /**
   * 분석 서비스로 성능 지표 보고
   */
  report(name: string, value: number): void {
    const roundedValue = Math.round(value * 1000) / 1000;

    analytics.trackEvent({
      category: 'system',
      action: 'performance_metric',
      label: name,
      value: roundedValue,
      data: { metric: name, value: roundedValue }
    });

    if (import.meta.env.DEV) {
      logger.debug('Performance', `${name}: ${roundedValue}`);
    }
  }
};
