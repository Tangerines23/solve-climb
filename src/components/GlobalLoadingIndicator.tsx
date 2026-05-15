/**
 * 전역 로딩 인디케이터 컴포넌트
 * 여러 로딩 작업이 진행 중일 때 표시됩니다.
 */

import { useGlobalLoading } from '../hooks/useGlobalLoading';
import './GlobalLoadingIndicator.css';

export function GlobalLoadingIndicator() {
  const { isAnyLoading } = useGlobalLoading();

  if (!isAnyLoading) {
    return null;
  }

  return (
    <div className="global-loading-indicator">
      <div className="global-loading-spinner" />
      <span className="global-loading-text">로딩 중...</span>
    </div>
  );
}
