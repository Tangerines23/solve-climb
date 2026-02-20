import { HTMLAttributes, ReactNode } from 'react';
import './BaseCard.css';

interface BaseCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function BaseCard({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  ...props
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
    <div className={cardClassName} {...props}>
      {children}
    </div>
  );
}
