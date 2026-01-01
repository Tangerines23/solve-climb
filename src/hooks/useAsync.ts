/**
 * 비동기 작업을 위한 재사용 가능한 Hook
 * 로딩 상태, 에러 상태, 데이터를 통합 관리합니다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logError, getUserErrorMessage } from '../utils/errorHandler';

/**
 * useAsync Hook의 반환 타입
 */
export interface UseAsyncResult<T> {
  /** 비동기 작업의 결과 데이터 */
  data: T | null;
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 (없으면 null) */
  error: string | null;
  /** 비동기 작업을 다시 실행하는 함수 */
  refetch: () => Promise<void>;
  /** 에러를 수동으로 설정하는 함수 */
  setError: (error: string | null) => void;
  /** 데이터를 수동으로 설정하는 함수 */
  setData: (data: T | null) => void;
}

/**
 * useAsync Hook 옵션
 */
export interface UseAsyncOptions<T> {
  /** 초기 데이터 값 */
  initialData?: T | null;
  /** 의존성 배열 (변경 시 자동으로 refetch) */
  deps?: React.DependencyList;
  /** 자동 실행 여부 (기본값: true) */
  immediate?: boolean;
  /** 에러 처리 옵션 */
  errorOptions?: {
    /** 에러 컨텍스트 (로깅용) */
    context?: string;
  };
  /** 성공 콜백 */
  onSuccess?: (data: T) => void;
  /** 에러 콜백 */
  onError?: (error: unknown, errorMessage: string) => void;
}

/**
 * 비동기 작업을 관리하는 Hook
 * @param asyncFn 비동기 함수
 * @param options Hook 옵션
 * @returns 비동기 작업 상태 및 제어 함수
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncResult<T> {
  const {
    initialData = null,
    deps = [],
    immediate = true,
    errorOptions = {},
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 비동기 작업 실행 함수
  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await asyncFn();

      // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
      if (!mountedRef.current) {
        return;
      }

      setData(result);
      setLoading(false);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
      if (!mountedRef.current) {
        return;
      }

      // 에러 로깅
      const context = errorOptions?.context || 'useAsync';
      logError(context, err);

      // 사용자 친화적 에러 메시지 설정
      const errorMessage = getUserErrorMessage(err);
      setError(errorMessage);
      setLoading(false);

      // 에러 콜백 호출
      if (onError) {
        onError(err, errorMessage);
      }
    }
  }, [asyncFn, errorOptions, onSuccess, onError]);

  // refetch 함수
  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  // 초기 실행 또는 의존성 변경 시 실행
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return {
    data,
    loading,
    error,
    refetch,
    setError,
    setData,
  };
}
