import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resilientLazy } from '../resilientLazy';
import { logger } from '../logger';

// React.lazy를 모칭하여 내부 팩토리 함수를 가로챕니다.
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn((factory) => ({
      _payload: { _result: factory },
      $$typeof: Symbol.for('react.lazy'),
    })),
  };
});

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('resilientLazy', () => {
  const mockComponent = { default: () => null };
  const mockImportFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('성공적으로 컴포넌트를 로드하면 sessionStorage를 정리하고 컴포넌트를 반환해야 함', async () => {
    mockImportFn.mockResolvedValueOnce(mockComponent);

    const lazyComponent = resilientLazy(mockImportFn, 'TestComponent') as any;
    const factory = lazyComponent._payload._result;

    const result = await factory();

    expect(result).toBe(mockComponent);
    expect(mockImportFn).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('resilient-lazy-retry-TestComponent')).toBeNull();
  });

  it('네트워크 에러 발생 시 최대 2회까지 재시도해야 함 (총 3회 시도)', async () => {
    const networkError = new Error('Failed to fetch (Loading chunk failed)');

    mockImportFn
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockComponent);

    const lazyComponent = resilientLazy(mockImportFn, 'RetryComponent') as any;
    const factory = lazyComponent._payload._result;

    const promise = factory();

    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe(mockComponent);
    expect(mockImportFn).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('네트워크 에러가 아닌 경우 즉시 에러를 던져야 함', async () => {
    const runtimeError = new Error('Normal runtime error');
    mockImportFn.mockRejectedValueOnce(runtimeError);

    const lazyComponent = resilientLazy(mockImportFn, 'RuntimeErrorComp') as any;
    const factory = lazyComponent._payload._result;

    const promise = factory();
    promise.catch(() => {}); // Swallow global unhandled rejection

    let caughtError: any;
    try {
      await promise;
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Normal runtime error');
    expect(mockImportFn).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('MAX_RETRIES 초과 시 isChunkLoadError 마킹을 하고 최종 실패해야 함', async () => {
    const networkError = new Error('Loading chunk failed');
    mockImportFn.mockRejectedValue(networkError);

    const lazyComponent = resilientLazy(mockImportFn, 'FailComponent') as any;
    const factory = lazyComponent._payload._result;

    const promise = factory();
    promise.catch(() => {}); // Swallow global unhandled rejection

    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    let caughtError: any;
    try {
      await promise;
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.isChunkLoadError).toBe(true);
    expect(caughtError.componentName).toBe('FailComponent');

    expect(logger.error).toHaveBeenCalled();
    expect(mockImportFn).toHaveBeenCalledTimes(3);
  });
});
