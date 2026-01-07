import { describe, it, expect, beforeEach } from 'vitest';
import { useErrorLogStore } from '../useErrorLogStore';

describe('useErrorLogStore', () => {
  beforeEach(() => {
    useErrorLogStore.getState().clearLogs();
  });

  it('should initialize with empty logs', () => {
    const { logs } = useErrorLogStore.getState();
    expect(logs).toEqual([]);
  });

  it('should add error log', () => {
    const { addLog } = useErrorLogStore.getState();
    addLog('error', 'Test error message', 'stack trace', 'context');

    const { logs } = useErrorLogStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('Test error message');
    expect(logs[0].stack).toBe('stack trace');
    expect(logs[0].context).toBe('context');
  });

  it('should add warning log', () => {
    const { addLog } = useErrorLogStore.getState();
    addLog('warning', 'Test warning');

    const { logs } = useErrorLogStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('warning');
  });

  it('should add info log', () => {
    const { addLog } = useErrorLogStore.getState();
    addLog('info', 'Test info');

    const { logs } = useErrorLogStore.getState();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
  });

  it('should maintain maximum 1000 logs', () => {
    const { addLog } = useErrorLogStore.getState();
    
    // 1001개의 로그 추가
    for (let i = 0; i < 1001; i++) {
      addLog('info', `Log ${i}`);
    }

    const { logs } = useErrorLogStore.getState();
    expect(logs).toHaveLength(1000);
    expect(logs[0].message).toBe('Log 1000'); // 가장 최근 로그
  });

  it('should clear logs', () => {
    const { addLog, clearLogs } = useErrorLogStore.getState();
    addLog('error', 'Test error');
    addLog('warning', 'Test warning');

    clearLogs();

    const { logs } = useErrorLogStore.getState();
    expect(logs).toEqual([]);
  });

  it('should filter logs by level', () => {
    const { addLog, filterLogs } = useErrorLogStore.getState();
    addLog('error', 'Error 1');
    addLog('warning', 'Warning 1');
    addLog('error', 'Error 2');
    addLog('info', 'Info 1');

    const errorLogs = filterLogs('error');
    expect(errorLogs).toHaveLength(2);
    expect(errorLogs.every((log) => log.level === 'error')).toBe(true);
  });

  it('should filter logs by time range', () => {
    const { addLog, filterLogs } = useErrorLogStore.getState();
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000);
    const endTime = new Date(now.getTime() + 1000);

    addLog('info', 'Log 1');
    
    // 시간을 조작하기 위해 약간의 지연
    setTimeout(() => {
      addLog('info', 'Log 2');
    }, 10);

    const filtered = filterLogs(undefined, startTime, endTime);
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });
});

