import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  measurePerformance,
  measureApiCall,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  logPerformanceSummary,
} from '../performance';
import { logger as _logger } from '../logger';

describe('performance', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    vi.clearAllMocks();
  });

  describe('measurePerformance', () => {
    it('should measure performance and return end function', () => {
      const endMeasure = measurePerformance('test-operation');
      expect(typeof endMeasure).toBe('function');

      endMeasure();

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe('test-operation');
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should record multiple performance measurements', () => {
      const endMeasure1 = measurePerformance('operation-1');
      const endMeasure2 = measurePerformance('operation-2');

      endMeasure1();
      endMeasure2();

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBe(2);
      expect(metrics[0].name).toBe('operation-1');
      expect(metrics[1].name).toBe('operation-2');
    });

    it('should calculate duration correctly', async () => {
      const endMeasure = measurePerformance('async-operation');

      await new Promise((resolve) => setTimeout(resolve, 10));

      endMeasure();

      const metrics = getPerformanceMetrics();
      // 타이밍 이슈를 방지하기 위해 넉넉한 시간을 기다리거나, 부동소수점 오차를 고려합니다.
      expect(metrics[0].duration).toBeGreaterThanOrEqual(8); // 10ms 근처면 허용 (CI 환경 고려하여 완화)
    });
  });

  describe('measureApiCall', () => {
    it('should measure API call duration', async () => {
      const apiCall = vi.fn(() => Promise.resolve('result'));

      const result = await measureApiCall('test-api', apiCall);

      expect(result).toBe('result');
      expect(apiCall).toHaveBeenCalled();

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('API: test-api');
    });

    it('should measure API call even if it throws', async () => {
      const apiCall = vi.fn(() => Promise.reject(new Error('API error')));

      await expect(measureApiCall('test-api', apiCall)).rejects.toThrow('API error');

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('API: test-api');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return empty array when no metrics recorded', () => {
      const metrics = getPerformanceMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return copy of metrics array', () => {
      const endMeasure = measurePerformance('test');
      endMeasure();

      const metrics1 = getPerformanceMetrics();
      const metrics2 = getPerformanceMetrics();

      expect(metrics1).not.toBe(metrics2); // Different array instances
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });

  describe('clearPerformanceMetrics', () => {
    it('should clear all performance metrics', () => {
      const endMeasure = measurePerformance('test');
      endMeasure();

      expect(getPerformanceMetrics().length).toBe(1);

      clearPerformanceMetrics();

      expect(getPerformanceMetrics().length).toBe(0);
    });
  });

  describe('logPerformanceSummary', () => {
    it('should not throw when called with no metrics', () => {
      expect(() => {
        logPerformanceSummary();
      }).not.toThrow();
    });

    it('should not throw when called with metrics', () => {
      const endMeasure1 = measurePerformance('operation-1');
      const endMeasure2 = measurePerformance('operation-2');
      endMeasure1();
      endMeasure2();

      expect(() => {
        logPerformanceSummary();
      }).not.toThrow();
    });
  });

  describe('measurePerformance - duration thresholds', () => {
    it('should record metrics with different durations', () => {
      const endMeasure1 = measurePerformance('fast-operation');
      const endMeasure2 = measurePerformance('slow-operation');

      // Fast operation
      endMeasure1();

      // Wait a bit for slow operation
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          endMeasure2();

          const metrics = getPerformanceMetrics();
          expect(metrics.length).toBeGreaterThanOrEqual(2);

          // Both operations should be recorded
          const fastOp = metrics.find((m) => m.name === 'fast-operation');
          const slowOp = metrics.find((m) => m.name === 'slow-operation');

          expect(fastOp).toBeDefined();
          expect(slowOp).toBeDefined();
          expect(slowOp!.duration).toBeGreaterThan(fastOp!.duration);

          resolve();
        }, 10);
      });
    });

    it('should handle multiple measurements correctly', () => {
      const endMeasure1 = measurePerformance('op1');
      const endMeasure2 = measurePerformance('op2');
      const endMeasure3 = measurePerformance('op3');

      endMeasure1();
      endMeasure2();
      endMeasure3();

      const metrics = getPerformanceMetrics();
      expect(metrics.length).toBe(3);
      expect(metrics.map((m) => m.name)).toEqual(['op1', 'op2', 'op3']);
    });
  });
});
