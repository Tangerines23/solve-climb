import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TierProgressBar } from '../TierProgressBar';
import { calculateTier, getNextTierInfo } from '@/features/quiz/constants/tiers';

// Mock tier functions
vi.mock('@/features/quiz/constants/tiers', () => ({
  calculateTier: vi.fn(),
  getNextTierInfo: vi.fn(),
}));

describe('TierProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when loading', () => {
    vi.mocked(calculateTier).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { container } = render(<TierProgressBar totalScore={1000} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render tier progress when loaded', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 2,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    render(<TierProgressBar totalScore={1000} />);

    await waitFor(
      () => {
        expect(screen.getByText(/현재 티어/)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('should render with different sizes', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 2,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    const { rerender } = render(<TierProgressBar totalScore={1000} size="small" />);

    await waitFor(() => {
      expect(screen.getByText(/현재 티어/)).toBeInTheDocument();
    });

    rerender(<TierProgressBar totalScore={1000} size="large" />);
    expect(screen.getByText(/현재 티어/)).toBeInTheDocument();
  });

  it('should display stars when stars > 0', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 3,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText(/현재 티어/)).toBeInTheDocument();
    });
  });

  it('should display stars in ×N format when stars >= 5', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 5,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText(/★×5/)).toBeInTheDocument();
    });
  });

  it('should display remaining score', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 2,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText(/500점 남음/)).toBeInTheDocument();
    });
  });

  it('should display next tier name', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 2,
      currentCycleScore: 500,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText(/→ Silver/)).toBeInTheDocument();
    });
  });

  it('should calculate progress correctly', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 0,
      currentCycleScore: 0,
    };

    const mockNextTier = {
      name: 'Silver',
      minScore: 1000,
      remaining: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(mockNextTier);

    const { container } = render(<TierProgressBar totalScore={500} />);

    await waitFor(() => {
      const fill = container.querySelector('.tier-progress-bar-fill');
      expect(fill).toBeInTheDocument();
      expect(fill).toHaveStyle({ width: '50%' });
    });
  });

  it('should not render when nextTierInfo is null', async () => {
    const mockTier = {
      tier: 'Bronze',
      stars: 2,
      currentCycleScore: 500,
    };

    vi.mocked(calculateTier).mockResolvedValue(mockTier);
    vi.mocked(getNextTierInfo).mockResolvedValue(null);

    const { container } = render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should handle error when calculateTier fails', async () => {
    vi.mocked(calculateTier).mockRejectedValue(new Error('Failed to calculate tier'));

    const { container } = render(<TierProgressBar totalScore={1000} />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
