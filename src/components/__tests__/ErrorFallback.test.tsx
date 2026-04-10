import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../ErrorFallback';
import { useConnectivity } from '@/hooks/useConnectivity';

// Mock useConnectivity
vi.mock('@/hooks/useConnectivity', () => ({
  useConnectivity: vi.fn(),
}));

describe('ErrorFallback', () => {
  const originalEnv = (import.meta as unknown as { env: { DEV: boolean; [key: string]: unknown } })
    .env;
  const originalReload = window.location.reload;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to online
    (useConnectivity as any).mockReturnValue(true);

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original env
    Object.defineProperty(import.meta as unknown, 'env', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
    // Restore original reload
    window.location.reload = originalReload;
  });

  it('오프라인 상태일 때 재시도 버튼을 비활성화하고 안내 문구를 표시해야 함', () => {
    (useConnectivity as any).mockReturnValue(false);
    const error = new Error('Test error');

    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText(/네트워크 연결이 끊겼습니다/)).toBeInTheDocument();
    const retryButton = screen.getByText('연결 대기 중...');
    expect(retryButton).toBeDisabled();
  });

  it('데이터 로드 실패(ChunkLoadError) 시 특수 안내 문구를 표시해야 함', () => {
    const error = new Error('ChunkLoadError');
    (error as any).isChunkLoadError = true;
    (error as any).componentName = 'TestPage';

    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText(/필요한 파일을 불러오지 못했습니다/)).toBeInTheDocument();
  });

  it('온라인 상태일 때 재시도 버튼이 활성화되어야 함', () => {
    (useConnectivity as any).mockReturnValue(true);
    const error = new Error('Test error');

    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const retryButton = screen.getByText('다시 시도하기');
    expect(retryButton).not.toBeDisabled();
  });

  it('should render error message', () => {
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByTestId('error-fallback-title')).toBeInTheDocument();
  });

  it('should call resetError when retry button is clicked', () => {
    const resetError = vi.fn();
    const error = new Error('Test error');
    render(<ErrorFallback error={error} resetError={resetError} />);

    const retryButton = screen.getByText('다시 시도하기');
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
    Object.defineProperty(import.meta as unknown, 'env', {
      value: { ...originalEnv, DEV: true },
      writable: true,
      configurable: true,
    });

    const error = new Error('Test error');
    error.stack = 'Error stack trace';
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    expect(screen.getByText('🛠 Developer Debug Console')).toBeInTheDocument();
    expect(screen.getByText('Error stack trace')).toBeInTheDocument();
  });

  it('should handle error without stack trace', () => {
    const error = new Error('Test error');
    // Don't set stack property
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    // Should still render error message
    expect(screen.getByTestId('error-fallback-title')).toBeInTheDocument();
  });

  it('should display error message when stack is not available', () => {
    Object.defineProperty(import.meta as unknown, 'env', {
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
    render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const retryButton = screen.getByText('다시 시도하기');
    const reloadButton = screen.getByText('페이지 새로고침');

    expect(retryButton).toHaveClass('error-fallback-button', 'error-fallback-button-primary');
    expect(reloadButton).toHaveClass('error-fallback-button', 'error-fallback-button-secondary');
  });

  it('should render error icon', () => {
    const error = new Error('Test error');
    const { container } = render(<ErrorFallback error={error} resetError={vi.fn()} />);

    const icon = container.querySelector('.error-fallback-icon');
    expect(icon).toBeInTheDocument();
    expect(icon?.textContent).toBe('🧗‍♀️');
  });
});
