import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../logger';
import { useErrorLogStore } from '../../stores/useErrorLogStore';

describe('logger.util', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages and add to store', () => {
    const addLogSpy = vi.spyOn(useErrorLogStore.getState(), 'addLog');
    logger.info('TestContext', 'Test Message', { data: 1 });

    expect(console.info).toHaveBeenCalled();
    expect(addLogSpy).toHaveBeenCalledWith('info', 'Test Message', undefined, 'TestContext');
  });

  it('should log debug messages', () => {
    logger.debug('TestContext', 'Debug Message');
    expect(console.debug).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('TestContext', 'Warn Message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error messages with Error object', () => {
    const error = new Error('Test Error');
    logger.error('TestContext', 'Error Message', error);
    expect(console.error).toHaveBeenCalled();
  });

  it('should log error messages without Error object', () => {
    logger.error('TestContext', 'String Error Message', 'Some details');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle groups', () => {
    logger.group('GroupContext', 'Group Label', () => {
      logger.info('GroupContext', 'Inside Group');
    });
    expect(console.group).toHaveBeenCalledWith('[GroupContext] Group Label');
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it('should handle tables', () => {
    logger.table('TableContext', [{ id: 1 }]);
    expect(console.group).toHaveBeenCalledWith('[TableContext] Table');
    expect(console.table).toHaveBeenCalled();
  });

  it('should log system messages via log()', () => {
    logger.log('System Message', '#ff0000');
    expect(console.log).toHaveBeenCalled();
  });
});
