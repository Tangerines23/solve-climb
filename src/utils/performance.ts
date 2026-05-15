import { analytics } from '@/services/analytics';
import { logger } from './logger';

export interface EnhancedPerformanceEntry extends PerformanceEntry {
  processingStart?: number;
  value?: number;
}

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
    // INP (Interaction to Next Paint) 측정
    this.observeMetric('INP');

    if (import.meta.env.DEV) {
      logger.info('Performance', 'Runtime performance monitoring initialized.');
    }
  },

  /**
   * 브라우저 API를 사용한 지표 관찰
   */
  observeMetric(metricName: 'LCP' | 'FID' | 'CLS' | 'INP'): void {
    try {
      const typeMap: Record<'LCP' | 'FID' | 'CLS' | 'INP', string> = {
        LCP: 'largest-contentful-paint',
        FID: 'first-input',
        CLS: 'layout-shift',
        INP: 'event',
      };
      const entryType = typeMap[metricName];

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();

        entries.forEach((entry: PerformanceEntry) => {
          let value = 0;
          if (metricName === 'LCP') value = entry.startTime;
          else if (metricName === 'FID')
            value = (entry as EnhancedPerformanceEntry).processingStart! - entry.startTime;
          else if (metricName === 'CLS') value = (entry as EnhancedPerformanceEntry).value!;
          else if (metricName === 'INP') value = entry.duration;

          this.report(metricName, value);
        });
      });

      observer.observe({ type: entryType, buffered: true });
    } catch {
      // 구형 브라우저 미지원
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
      data: { metric: name, value: roundedValue },
    });

    if (import.meta.env.DEV) {
      logger.debug('Performance', `${name}: ${roundedValue}`);
    }
  },
};
