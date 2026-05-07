// 성능 측정 관련 타입 정의

export interface EnhancedPerformanceEntry extends PerformanceEntry {
  processingStart?: number;
  value?: number;
}

export type MetricName = 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';
