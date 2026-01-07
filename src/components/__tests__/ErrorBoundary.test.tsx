import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorFallback } from '../ErrorFallback';

// Mock ErrorFallback
vi.mock('../ErrorFallback', () => ({
  ErrorFallback: ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div>
      <div>Error: {error.message}</div>
      <button onClick={resetError}>Reset</button>
    </div>
  ),
}));

// Mock errorHandler
vi.mock('../utils/errorHandler', () => ({
  logError: vi.fn(),
}));

// Mock useErrorLogStore
vi.mock('../stores/useErrorLogStore', () => ({
  useErrorLogStore: {
    getState: () => ({
      addLog: vi.fn(),
    }),
  },
}));

// Component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch error and render fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should reset error when reset is called', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error:/)).toBeInTheDocument();

    const resetButton = screen.getByText('Reset');
    resetButton.click();

    rerender(
      <ErrorBoundary>
        <div>No error</div>
      </ErrorBoundary>
    );

    // After reset, should render children again
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });
});

