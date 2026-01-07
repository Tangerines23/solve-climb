import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TierProgressBar } from '../TierProgressBar';
import { calculateTier, getNextTierInfo } from '../../constants/tiers';

// Mock tier functions
vi.mock('../../constants/tiers', () => ({
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

    await waitFor(() => {
      expect(screen.getByText(/현재 티어/)).toBeInTheDocument();
    });
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
});

