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
    } catch (_e) {
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
      data: { metric: name, value: roundedValue },
    });

    if (import.meta.env.DEV) {
      logger.debug('Performance', `${name}: ${roundedValue}`);
    }
  },
};

/**
 * 성능 측정 메트릭 저장소
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
}

let metricsStore: PerformanceMetric[] = [];

/**
 * 성능 측정 시작 함수
 * @param name 측정 이름
 * @returns 측정 종료 함수
 */
export const measurePerformance = (name: string) => {
  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    metricsStore.push({ name, duration, startTime });

    // 개발 모드에서 로깅
    if (import.meta.env.DEV) {
      if (duration > 100) {
        console.warn(`[Performance] Slow operation '${name}': ${duration.toFixed(2)}ms`);
      }
    }
  };
};

/**
 * API 호출 성능 측정 래퍼
 * @param name API 이름
 * @param apiCall 실행할 API 함수
 */
export const measureApiCall = async <T>(name: string, apiCall: () => Promise<T>): Promise<T> => {
  const endMeasure = measurePerformance(`API: ${name}`);
  try {
    const result = await apiCall();
    endMeasure();
    return result;
  } catch (error) {
    endMeasure();
    throw error;
  }
};

/**
 * 저장된 성능 메트릭 조회
 */
export const getPerformanceMetrics = () => {
  return [...metricsStore];
};

/**
 * 성능 메트릭 초기화
 */
export const clearPerformanceMetrics = () => {
  metricsStore = [];
};

/**
 * 성능 요약 로그 출력
 */
export const logPerformanceSummary = () => {
  if (metricsStore.length === 0) return;

  console.group('Performance Summary');
  metricsStore.forEach((m) => {
    console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
  });
  console.groupEnd();
};
