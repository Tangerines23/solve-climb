import { ReactNode } from 'react';
import './BaseCard.css';

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function BaseCard({
  children,
  className = '',
  onClick,
  interactive = false,
  padding = 'md',
}: BaseCardProps) {
  const cardClassName = [
    'base-card',
    interactive ? 'card-interactive' : '',
    `padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassName} onClick={onClick}>
      {children}
    </div>
  );
}
