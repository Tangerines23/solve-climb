import { useDebugActions } from '../../hooks/useDebugActions';
import './DebugOverlay.css';

/**
 * 시각적 디버그 오버레이
 * - SafeArea 가이드: 상단/하단 안전 영역 표시
 * - 컴포넌트 경계선: 모든 요소에 아웃라인 적용
 */
export function DebugOverlay() {
  const { showSafeAreaGuide, showComponentBorders } = useDebugActions();

  // 아무것도 활성화되지 않으면 렌더링하지 않음
  if (!showSafeAreaGuide && !showComponentBorders) {
    return null;
  }

  return (
    <>
      {/* SafeArea 가이드 오버레이 */}
      {showSafeAreaGuide && (
        <>
          <div className="debug-safearea-top" aria-hidden="true">
            <span>SafeArea Top (44px)</span>
          </div>
          <div className="debug-safearea-bottom" aria-hidden="true">
            <span>SafeArea Bottom (34px)</span>
          </div>
        </>
      )}

      {/* 컴포넌트 경계선 전역 스타일 */}
      {showComponentBorders && (
        <style>{`
          * {
            outline: 1px solid rgba(255, 0, 0, 0.3) !important;
          }
          *:hover {
            outline: 2px solid rgba(0, 255, 0, 0.6) !important;
          }
        `}</style>
      )}
    </>
  );
}
