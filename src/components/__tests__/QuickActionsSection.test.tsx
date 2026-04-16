import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickActionsSection } from '../debug/QuickActionsSection';
import { useUserStore } from '../../stores/useUserStore';
import { useDebugStore } from '../../stores/useDebugStore';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../stores/useDebugStore', () => ({
  useDebugStore: vi.fn(),
}));

vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
  },
}));

describe('QuickActionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      minerals: 1000,
      stamina: 5,
      fetchUserData: vi.fn(() => Promise.resolve()),
      rewardMinerals: vi.fn(() => Promise.resolve()),
      debugSetStamina: vi.fn(() => Promise.resolve()),
      debugSetMinerals: vi.fn(() => Promise.resolve()),
    } as any);
    vi.mocked(useDebugStore).mockReturnValue({
      infiniteStamina: false,
      infiniteMinerals: false,
      infiniteTime: false,
      setInfiniteStamina: vi.fn(),
      setInfiniteMinerals: vi.fn(),
      setInfiniteTime: vi.fn(),
    } as any);
    vi.mocked(useMyPageStats).mockReturnValue({
      refetch: vi.fn(),
    } as any);
  });

  it('should render without crashing', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<QuickActionsSection />);
      container = rendered.container;
    });
    expect(container!).toBeTruthy();
  });

  it('should render game status section', async () => {
    await act(async () => {
      render(<QuickActionsSection />);
    });
    expect(screen.getByText(/게임 상태/)).toBeInTheDocument();
  });

  it('should render stamina input', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<QuickActionsSection />);
      container = rendered.container;
    });
    const staminaInput = container!.querySelector('input[name="stamina"]');
    expect(staminaInput).toBeInTheDocument();
  });

  it('should render minerals input', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<QuickActionsSection />);
      container = rendered.container;
    });
    const mineralsInput = container!.querySelector('input[name="minerals"]');
    expect(mineralsInput).toBeInTheDocument();
  });

  it('should handle stamina increment', async () => {
    await act(async () => {
      render(<QuickActionsSection />);
    });
    const incrementButton = screen.getByText('+1').closest('button');
    if (incrementButton) {
      await act(async () => {
        fireEvent.click(incrementButton);
      });
      expect(vi.mocked(useUserStore)().debugSetStamina).toHaveBeenCalled();
    }
  });

  it('should handle minerals increment', async () => {
    await act(async () => {
      render(<QuickActionsSection />);
    });
    const incrementButton = screen.getByText('+100').closest('button');
    if (incrementButton) {
      await act(async () => {
        fireEvent.click(incrementButton);
      });
      expect(vi.mocked(useUserStore)().debugSetMinerals).toHaveBeenCalled();
    }
  });

  it('should render infinite modes section', async () => {
    await act(async () => {
      render(<QuickActionsSection />);
    });
    expect(screen.getByText(/디버그 설정/)).toBeInTheDocument();
  });

  it('should toggle infinite stamina', async () => {
    await act(async () => {
      render(<QuickActionsSection />);
    });
    const toggleButton = await screen.findByLabelText(/무한 스태미나 토글/);
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    expect(vi.mocked(useDebugStore)().setInfiniteStamina).toHaveBeenCalled();
  });

  it('should render preset section', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<QuickActionsSection />);
      container = rendered.container;
    });
    const presetSection = container!.querySelector('.debug-preset-section');
    expect(presetSection).toBeInTheDocument();
  });
});
