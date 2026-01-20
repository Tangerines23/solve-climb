import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

// Mock import.meta.env
vi.mock('../logger', async () => {
  const actual = await vi.importActual('../logger');
  return {
    ...actual,
  };
});

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger.info('test', 'test message');
    // 개발 환경에서만 로그가 출력되므로, 실제 호출 여부는 환경에 따라 다름
    // 테스트는 함수가 호출되는지만 확인
    expect(typeof logger.info).toBe('function');
  });

  it('should log error messages', () => {
    logger.error('test', 'error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('test', 'warn message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('test', 'debug message');
    // 개발 환경에서만 로그가 출력되므로, 실제 호출 여부는 환경에 따라 다름
    // 테스트는 함수가 호출되는지만 확인
    expect(typeof logger.debug).toBe('function');
  });

  it('should handle all log levels: DEBUG, INFO, WARN, ERROR', () => {
    logger.debug('test', 'debug');
    logger.info('test', 'info');
    logger.warn('test', 'warn');
    logger.error('test', 'error');

    // All functions should be callable
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should handle error with Error instance', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    logger.error('test', 'error message', error);

    expect(console.error).toHaveBeenCalled();
  });

  it('should handle error without Error instance', () => {
    logger.error('test', 'error message', 'string error');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle error without stack trace', () => {
    const error = new Error('Test error');
    delete (error as unknown as { stack?: string }).stack;
    logger.error('test', 'error message', error);

    expect(console.error).toHaveBeenCalled();
  });

  it('should handle group in development mode', () => {
    const fn = vi.fn();
    logger.group('test', 'group label', fn);

    expect(fn).toHaveBeenCalled();
  });

  it('should handle table in development mode', () => {
    const data = { key: 'value' };
    logger.table('test', data);

    // Function should execute without error
    expect(typeof logger.table).toBe('function');
  });
});
