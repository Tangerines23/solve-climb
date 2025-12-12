/**
 * 성능 모니터링 유틸리티
 * 개발 환경에서만 활성화되며, 컴포넌트 렌더링 시간과 API 호출 시간을 측정합니다.
 */

import { logger } from './logger';

const isDevelopment = import.meta.env.DEV;

/**
 * 성능 측정 결과 인터페이스
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 성능 측정 결과 저장소
 */
const metrics: PerformanceMetric[] = [];

/**
 * 성능 측정 시작
 * @param name 측정할 작업의 이름
 * @returns 측정을 종료하는 함수
 */
export function measurePerformance(name: string): () => void {
  if (!isDevelopment) {
    return () => {}; // 프로덕션에서는 아무것도 하지 않음
  }

  const startTime = performance.now();
  const timestamp = Date.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp,
    };

    metrics.push(metric);

    // 100ms 이상 걸린 작업만 로깅
    if (duration > 100) {
      logger.warn('Performance', `${name} took ${duration.toFixed(2)}ms`);
    } else {
      logger.debug('Performance', `${name} took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * 컴포넌트 렌더링 시간 측정 (React Hook)
 * @param componentName 컴포넌트 이름
 * @returns 측정 함수
 */
export function useComponentPerformance(componentName: string) {
  if (!isDevelopment) {
    return;
  }

  const endMeasure = measurePerformance(`Render: ${componentName}`);
  
  // useEffect를 사용하여 렌더링 후 측정 종료
  if (typeof window !== 'undefined') {
    // 다음 프레임에서 측정 종료 (렌더링 완료 후)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        endMeasure();
      });
    });
  }
}

/**
 * API 호출 시간 측정
 * @param apiName API 이름
 * @param apiCall API 호출 함수
 * @returns API 호출 결과
 */
export async function measureApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const endMeasure = measurePerformance(`API: ${apiName}`);
  try {
    const result = await apiCall();
    return result;
  } finally {
    endMeasure();
  }
}

/**
 * 모든 성능 측정 결과 가져오기
 * @returns 성능 측정 결과 배열
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * 성능 측정 결과 초기화
 */
export function clearPerformanceMetrics(): void {
  metrics.length = 0;
}

/**
 * 성능 측정 결과 요약 출력
 */
export function logPerformanceSummary(): void {
  if (!isDevelopment || metrics.length === 0) {
    return;
  }

  const summary = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
      };
    }

    const stat = acc[metric.name];
    stat.count++;
    stat.total += metric.duration;
    stat.min = Math.min(stat.min, metric.duration);
    stat.max = Math.max(stat.max, metric.duration);

    return acc;
  }, {} as Record<string, { count: number; total: number; min: number; max: number }>);

  logger.group('Performance', 'Performance Summary', () => {
    Object.entries(summary).forEach(([name, stat]) => {
      const avg = stat.total / stat.count;
      logger.info(
        'Performance',
        `${name}: avg ${avg.toFixed(2)}ms, min ${stat.min.toFixed(2)}ms, max ${stat.max.toFixed(2)}ms (${stat.count} calls)`
      );
    });
  });
}


