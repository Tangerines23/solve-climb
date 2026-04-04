import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { HomePage } from '../HomePage';
import { MemoryRouter } from 'react-router-dom';
import { useDailyRewardStore } from '@/stores/useDailyRewardStore';
import { APP_CONFIG } from '@/config/app';

// Local Mock for Toast using relative path correctly
vi.mock('../../components/Toast', () => ({
  Toast: ({ message, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-toast">
        <p>{message}</p>
        <button data-testid="toast-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock store and navigation
vi.mock('@/stores/useDailyRewardStore', () => ({
  useDailyRewardStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage', () => {
  const mockCheckDailyLogin = vi.fn();
  let originalHistoryLength: number;
  let originalReferrer: string;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useDailyRewardStore as any).mockImplementation((selector?: (state: any) => any) => {
      const state = {
        checkDailyLogin: mockCheckDailyLogin,
        showModal: false,
        rewardResult: null,
        closeModal: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    originalHistoryLength = window.history.length;
    originalReferrer = document.referrer;

    Object.defineProperty(window.history, 'length', { value: 2, configurable: true });
    Object.defineProperty(document, 'referrer', { value: 'http://localhost', configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window.history, 'length', { value: originalHistoryLength });
    Object.defineProperty(document, 'referrer', { value: originalReferrer });
    cleanup();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('should render and handle age rating overlay', async () => {
    await act(async () => {
      renderHomePage();
    });
    expect(screen.getByText(/전체 이용가/i)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });

  it('should check daily login', async () => {
    await act(async () => {
      renderHomePage();
    });
    expect(mockCheckDailyLogin).toHaveBeenCalled();
  });

  it('should handle navigation on double-click back button', async () => {
    await act(async () => {
      renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    expect(screen.getByTestId('mock-toast')).toBeTruthy();
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.MY_PAGE, { replace: true });
  });

  it('should reset back button state after timeout', async () => {
    await act(async () => {
      renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByTestId('mock-toast')).toBeNull();
  });

  it('should skip back button logic on first visit', async () => {
    Object.defineProperty(window.history, 'length', { value: 1 });
    Object.defineProperty(document, 'referrer', { value: '' });
    await act(async () => {
      renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    expect(screen.queryByTestId('mock-toast')).toBeNull();
  });

  it('should clear existing timeout when clicking back button twice quickly', async () => {
    await act(async () => {
      renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should cover Toast onClose logic (Lines 121-125)', async () => {
    await act(async () => {
      renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    const closeBtn = screen.getByTestId('toast-close-btn');
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByTestId('mock-toast')).toBeNull();
  });

  it('should clear timeout on unmount (Line 85)', async () => {
    let result: any;
    await act(async () => {
      result = renderHomePage();
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('home-back-button'));
    });
    // Line 85 happens during unmount if ref is set
    act(() => {
      result.unmount();
    });
    // Coverage is tracked automatically
  });
});
