import React from 'react';
import './PageLayout.css';

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className = '', fullScreen = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`page-layout-container ${fullScreen ? 'fullscreen' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageLayout.displayName = 'PageLayout';
