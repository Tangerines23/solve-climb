import { describe, it, expect, beforeEach } from 'vitest';
import { useErrorLogStore } from '../useErrorLogStore';

describe('useErrorLogStore', () => {
  beforeEach(() => {
    useErrorLogStore.getState().clearLogs();
  });

  it('should initialize with empty logs', () => {
    expect(useErrorLogStore.getState().logs).toEqual([]);
  });

  it('should add a log entry', () => {
    const store = useErrorLogStore.getState();
    store.addLog('info', 'Test Message', 'Stack', 'Context');

    const logs = useErrorLogStore.getState().logs;
    expect(logs.length).toBe(1);
    expect(logs[0].message).toBe('Test Message');
    expect(logs[0].level).toBe('info');
    expect(logs[0].context).toBe('Context');
    expect(logs[0].stack).toBe('Stack');
  });

  it('should clear logs', () => {
    const store = useErrorLogStore.getState();
    store.addLog('error', 'Error');
    store.clearLogs();
    expect(useErrorLogStore.getState().logs.length).toBe(0);
  });

  it('should filter logs by level', () => {
    const store = useErrorLogStore.getState();
    store.addLog('info', 'Info Msg');
    store.addLog('error', 'Error Msg');

    const infoLogs = store.filterLogs('info');
    expect(infoLogs.length).toBe(1);
    expect(infoLogs[0].message).toBe('Info Msg');

    const errorLogs = store.filterLogs('error');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe('Error Msg');
  });

  it('should filter logs by time', () => {
    const store = useErrorLogStore.getState();
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + 1000);

    store.addLog('info', 'Timed Msg');

    const valid = store.filterLogs(undefined, past, future);
    expect(valid.length).toBe(1);

    const invalid = store.filterLogs(undefined, future);
    expect(invalid.length).toBe(0);
  });
});
