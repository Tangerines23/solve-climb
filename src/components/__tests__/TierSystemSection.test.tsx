import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TierSystemSection } from '../debug/TierSystemSection';
import { supabase } from '../../utils/supabaseClient';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { loadTierDefinitions, calculateTier } from '../../constants/tiers';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: vi.fn(() => ({
    progress: {},
  })),
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: vi.fn(() => ({
    profile: null,
  })),
}));

vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('../../constants/tiers', () => ({
  loadTierDefinitions: vi.fn(),
  calculateTier: vi.fn(),
  calculateScoreForTier: vi.fn(),
}));

describe('TierSystemSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMyPageStats).mockReturnValue({
      stats: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(loadTierDefinitions).mockResolvedValue([
      { level: 0, name: '베이스캠프', icon: '⛺' },
      { level: 1, name: '등산로', icon: '🥾' },
    ]);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    } as never);
  });

  it('should render tier system section', async () => {
    render(<TierSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/티어 시스템/)).toBeInTheDocument();
    });
  });

  it('should render tier select dropdown', async () => {
    const { container } = render(<TierSystemSection />);
    await waitFor(() => {
      const tierSelect = container.querySelector('select');
      expect(tierSelect).toBeInTheDocument();
    });
  });

  it('should render mastery score input', async () => {
    render(<TierSystemSection />);
    await waitFor(() => {
      expect(screen.getByLabelText(/마스터리 점수/)).toBeInTheDocument();
    });
  });

  it('should handle mastery score increment', async () => {
    render(<TierSystemSection />);
    await waitFor(() => {
      const incrementButton = screen.getByText('+1000');
      fireEvent.click(incrementButton);
    });
  });

  it('should handle mastery score decrement', async () => {
    render(<TierSystemSection />);
    await waitFor(() => {
      const decrementButton = screen.getByText('-1000');
      fireEvent.click(decrementButton);
    });
  });

  it('should render tier upgrade simulation section', async () => {
    render(<TierSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/티어 업그레이드 시뮬레이션/)).toBeInTheDocument();
    });
  });
});


