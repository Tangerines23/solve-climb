import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * 전역 Glassmorphism 스타일이 적용된 카드 컴포넌트
 * - index.css의 .glass-effect 클래스를 기반으로 동작합니다.
 */
export function GlassCard({
  children,
  className = '',
  interactive = false,
  onClick,
  style,
}: GlassCardProps) {
  const combinedClassName =
    `glass-card glass-effect ${interactive ? 'interactive' : ''} ${className}`.trim();

  return (
    <div className={combinedClassName} onClick={onClick} style={style}>
      {children}
    </div>
  );
}
