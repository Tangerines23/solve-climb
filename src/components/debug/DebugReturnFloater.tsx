import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebugActions } from '../../hooks/useDebugActions';

export function DebugReturnFloater() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showReturnFloater, setShowReturnFloater, urls } = useDebugActions();

  // 드래그 상태 관리
  const [position, setPosition] = useState({
    x: window.innerWidth - 140,
    y: window.innerHeight - 80,
  });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // 디버그 페이지에서는 버튼을 숨김 (스토어 상태와 무관하게)
  if (location.pathname === urls.debug()) {
    return null;
  }

  // 스토어 상태가 false면 렌더링 안함
  if (!showReturnFloater) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: initialPos.current.x + dx,
      y: initialPos.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReturnFloater(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // 드래그 중이었다면 클릭 무시 (약간의 움직임은 허용)
    const moveDist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    if (moveDist > 5) return;

    navigate(urls.debug());
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        padding: 'var(--spacing-md) var(--spacing-3xl) var(--spacing-md) var(--spacing-lg)', // 닫기 버튼 공간 확보
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-bg-tertiary)',
        borderRadius: 'var(--rounded-pill)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        cursor: 'move',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        userSelect: 'none',
        touchAction: 'none', // 모바일 스크롤 방지
      }}
    >
      <span>↩️</span>
      <span>디버그</span>

      {/* 닫기 버튼 */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--rounded-full)',
          backgroundColor: 'var(--color-bg-secondary)',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        className="close-btn"
      >
        ✕
      </div>
    </div>
  );
}
