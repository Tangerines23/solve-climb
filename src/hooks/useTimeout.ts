/**
 * 타이머 관리를 위한 재사용 가능한 Hook
 * 컴포넌트 언마운트 시 자동으로 타이머를 정리합니다.
 */

import { useEffect, useRef } from 'react';

/**
 * useTimeout Hook
 * @param callback 타이머가 만료될 때 실행할 콜백 함수
 * @param delay 지연 시간 (밀리초). null이면 타이머가 비활성화됨
 */
export function useTimeout(
  callback: () => void,
  delay: number | null
): void {
  const callbackRef = useRef(callback);

  // 콜백 함수를 항상 최신 상태로 유지
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // delay가 null이면 타이머를 설정하지 않음
    if (delay === null) {
      return;
    }

    const timerId = setTimeout(() => {
      callbackRef.current();
    }, delay);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearTimeout(timerId);
    };
  }, [delay]);
}

