import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalLoadingIndicator } from '../GlobalLoadingIndicator';
import { useLoadingStore } from '../../stores/useLoadingStore';

// Mock useLoadingStore
vi.mock('../../stores/useLoadingStore', () => ({
  useLoadingStore: vi.fn(),
}));

describe('GlobalLoadingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not loading', () => {
    vi.mocked(useLoadingStore).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => false,
      };
      return selector(state);
    });

    const { container } = render(<GlobalLoadingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when loading', () => {
    vi.mocked(useLoadingStore).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => true,
      };
      return selector(state);
    });

    render(<GlobalLoadingIndicator />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('should render spinner when loading', () => {
    vi.mocked(useLoadingStore).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => true,
      };
      return selector(state);
    });

    const { container } = render(<GlobalLoadingIndicator />);
    const spinner = container.querySelector('.global-loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    vi.mocked(useLoadingStore).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => true,
      };
      return selector(state);
    });

    const { container } = render(<GlobalLoadingIndicator />);
    const indicator = container.querySelector('.global-loading-indicator');
    const spinner = container.querySelector('.global-loading-spinner');
    const text = container.querySelector('.global-loading-text');

    expect(indicator).toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
    expect(text).toBeInTheDocument();
    expect(text?.textContent).toBe('로딩 중...');
  });

  it('should update when loading state changes', () => {
    let loadingState = false;
    vi.mocked(useLoadingStore).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => loadingState,
      };
      return selector(state);
    });

    const { rerender } = render(<GlobalLoadingIndicator />);
    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();

    // Change loading state
    loadingState = true;
    rerender(<GlobalLoadingIndicator />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();

    // Change back to not loading
    loadingState = false;
    rerender(<GlobalLoadingIndicator />);
    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
  });
});

