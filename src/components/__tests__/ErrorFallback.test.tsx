import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const originalEnv = import.meta.env;
  const originalReload = window.location.reload;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original env
    Object.defineProperty(import.meta, 'env', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
    // Restore original reload
    window.location.reload = originalReload;
  });

  it('should render error message', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText(/예상치 못한 오류가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should call resetError when retry button is clicked', () => {
    const resetError = vi.fn();
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={resetError} />);

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    expect(resetError).toHaveBeenCalled();
  });

  it('should call window.location.reload when reload button is clicked', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const reloadButton = screen.getByText('페이지 새로고침');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should show error details in development', () => {
    Object.defineProperty(import.meta, 'env', {
      value: { ...originalEnv, DEV: true },
      writable: true,
      configurable: true,
    });

    const error = new Error('Test error');
    error.stack = 'Error stack trace';
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('에러 상세 정보 (개발 환경)')).toBeInTheDocument();
    expect(screen.getByText('Error stack trace')).toBeInTheDocument();
  });

  it('should handle error without stack trace', () => {
    const error = new Error('Test error');
    // Don't set stack property
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    // Should still render error message
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
  });

  it('should display error message when stack is not available', () => {
    Object.defineProperty(import.meta, 'env', {
      value: { ...originalEnv, DEV: true },
      writable: true,
      configurable: true,
    });

    const error = new Error('Test error');
    error.stack = undefined;
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should have reload button', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const reloadButton = screen.getByText('페이지 새로고침');
    expect(reloadButton).toBeInTheDocument();
    expect(reloadButton.tagName).toBe('BUTTON');
  });

  it('should have correct button classes', () => {
    const error = new Error('Test error');
    const { container } = render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const retryButton = screen.getByText('다시 시도');
    const reloadButton = screen.getByText('페이지 새로고침');

    expect(retryButton).toHaveClass('error-fallback-button', 'error-fallback-button-primary');
    expect(reloadButton).toHaveClass('error-fallback-button', 'error-fallback-button-secondary');
  });

  it('should render error icon', () => {
    const error = new Error('Test error');
    const { container } = render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const icon = container.querySelector('.error-fallback-icon');
    expect(icon).toBeInTheDocument();
    expect(icon?.textContent).toBe('⚠️');
  });
});

