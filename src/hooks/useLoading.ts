/**
 * 로딩 상태 관리 Hook
 * 비동기 작업과 통합하여 자동으로 로딩 상태를 관리합니다.
 */

import { useEffect, useRef } from 'react';
import { useLoadingStore } from '../stores/useLoadingStore';

/**
 * useLoading Hook 옵션
 */
export interface UseLoadingOptions {
  /** 로딩 작업 ID (고유 식별자) */
  id?: string;
  /** 자동으로 로딩 상태를 관리할지 여부 */
  auto?: boolean;
}

/**
 * 로딩 상태 관리 Hook
 * @param options Hook 옵션
 * @returns 로딩 상태 및 제어 함수
 */
export function useLoading(options: UseLoadingOptions = {}) {
  const { id } = options;
  const { startLoading, stopLoading, isLoading, isAnyLoading } = useLoadingStore();
  const loadingIdRef = useRef<string | null>(null);

  // 고유 ID 생성 (제공되지 않은 경우)
  useEffect(() => {
    if (!loadingIdRef.current) {
      loadingIdRef.current =
        id || `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [id]);

  /**
   * 로딩 시작
   */
  const start = (customId?: string) => {
    const targetId = customId || loadingIdRef.current!;
    startLoading(targetId);
  };

  /**
   * 로딩 종료
   */
  const stop = (customId?: string) => {
    const targetId = customId || loadingIdRef.current!;
    stopLoading(targetId);
  };

  /**
   * 비동기 작업 실행 (자동 로딩 관리)
   */
  const execute = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    const targetId = loadingIdRef.current!;
    try {
      startLoading(targetId);
      return await asyncFn();
    } finally {
      stopLoading(targetId);
    }
  };

  // 컴포넌트 언마운트 시 로딩 상태 정리
  useEffect(() => {
    return () => {
      if (loadingIdRef.current) {
        stopLoading(loadingIdRef.current);
      }
    };
  }, [stopLoading]);

  return {
    /** 현재 로딩 중인지 여부 */
    isLoading: id ? isLoading(id) : isAnyLoading(),
    /** 로딩 시작 함수 */
    start,
    /** 로딩 종료 함수 */
    stop,
    /** 비동기 작업 실행 함수 (자동 로딩 관리) */
    execute,
  };
}
