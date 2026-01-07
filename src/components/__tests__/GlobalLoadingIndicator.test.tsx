import { describe, it, expect, beforeEach } from 'vitest';
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
    (useLoadingStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => false,
      };
      return selector(state);
    });

    const { container } = render(<GlobalLoadingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when loading', () => {
    (useLoadingStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        isAnyLoading: () => true,
      };
      return selector(state);
    });

    render(<GlobalLoadingIndicator />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });
});

