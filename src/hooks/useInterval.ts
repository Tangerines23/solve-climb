/**
 * 인터벌 관리를 위한 재사용 가능한 Hook
 * 컴포넌트 언마운트 시 자동으로 인터벌을 정리합니다.
 */

import { useEffect, useRef } from 'react';

/**
 * useInterval Hook
 * @param callback 인터벌마다 실행할 콜백 함수
 * @param delay 인터벌 간격 (밀리초). null이면 인터벌이 비활성화됨
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  const callbackRef = useRef(callback);

  // 콜백 함수를 항상 최신 상태로 유지
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // delay가 null이면 인터벌을 설정하지 않음
    if (delay === null) {
      return;
    }

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, delay);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(intervalId);
    };
  }, [delay]);
}

