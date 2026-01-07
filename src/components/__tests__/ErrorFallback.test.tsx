import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText(/예상치 못한 오류가 발생했습니다/)).toBeInTheDocument();
  });

  it('should call resetError when button is clicked', () => {
    const resetError = vi.fn();
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={resetError} />);

    const retryButton = screen.getByText('다시 시도');
    retryButton.click();

    expect(resetError).toHaveBeenCalled();
  });

  it('should show error details in development', () => {
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta, 'env', {
      value: { ...import.meta.env, DEV: true },
      writable: true,
      configurable: true,
    });

    const error = new Error('Test error');
    error.stack = 'Error stack trace';
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('에러 상세 정보 (개발 환경)')).toBeInTheDocument();

    Object.defineProperty(import.meta, 'env', {
      value: { ...import.meta.env, DEV: originalEnv },
      writable: true,
      configurable: true,
    });
  });

  it('should have reload button', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const reloadButton = screen.getByText('페이지 새로고침');
    expect(reloadButton).toBeInTheDocument();
    expect(reloadButton.tagName).toBe('BUTTON');
  });
});

