import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('should log info messages', () => {
    logger.info('test message');
    expect(console.log).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('warn message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('debug message');
    expect(console.log).toHaveBeenCalled();
  });
});
