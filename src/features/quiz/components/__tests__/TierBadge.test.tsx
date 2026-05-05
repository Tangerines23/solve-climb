import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TierBadge } from '../TierBadge';
import { calculateTier, getTierInfo } from '../../constants/tiers';

// Mock tiers functions
vi.mock('../../constants/tiers', () => ({
  calculateTier: vi.fn(),
  getTierInfo: vi.fn(),
}));

describe('TierBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(calculateTier).mockImplementation(() => new Promise(() => {})); // Never resolves
    vi.mocked(getTierInfo).mockImplementation(() => new Promise(() => {}));

    render(<TierBadge totalScore={1000} />);

    expect(screen.getByText('⛺')).toBeInTheDocument();
  });

  it('should render tier badge with tier information', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    expect(screen.getByText('🥾')).toBeInTheDocument();
  });

  it('should display tier label when showLabel is true', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showLabel={true} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });
  });

  it('should not display tier label when showLabel is false', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showLabel={false} />);

    await waitFor(() => {
      expect(screen.getByText('🥾')).toBeInTheDocument();
    });

    expect(screen.queryByText('등산로')).not.toBeInTheDocument();
  });

  it('should display stars when showStars is true and stars > 0', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 3,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showStars={true} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Stars should be displayed (3 stars)
    const starsElement = screen.getByText(/★/);
    expect(starsElement).toBeInTheDocument();
  });

  it('should display star count when stars >= 5', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 5,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showStars={true} />);

    await waitFor(() => {
      expect(screen.getByText(/★×5/)).toBeInTheDocument();
    });
  });

  it('should not display stars when showStars is false', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 3,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showStars={false} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Stars should not be displayed
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('should use currentTierLevel when provided', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 2,
      stars: 0,
      totalScore: 5000,
      currentCycleScore: 5000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={5000} currentTierLevel={1} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Should use currentTierLevel (1) instead of calculated level (2)
    expect(getTierInfo).toHaveBeenCalledWith(1);
  });

  it('should handle different sizes', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    const { rerender } = render(<TierBadge totalScore={1000} size="small" />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    rerender(<TierBadge totalScore={1000} size="medium" />);
    rerender(<TierBadge totalScore={1000} size="large" />);

    // Component should render with different sizes
    expect(screen.getByText('등산로')).toBeInTheDocument();
  });

  it('should handle tier level 0 (베이스캠프)', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 0,
      stars: 0,
      totalScore: 0,
      currentCycleScore: 0,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 0,
      name: '베이스캠프',
      icon: '⛺',
      minScore: 0,
      colorVar: '--color-tier-base',
    });

    render(<TierBadge totalScore={0} />);

    await waitFor(() => {
      expect(screen.getByText('베이스캠프')).toBeInTheDocument();
    });
  });

  it('should handle error when calculateTier fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(calculateTier).mockRejectedValue(new Error('Failed to calculate tier'));

    render(<TierBadge totalScore={1000} />);

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Should still show loading state (⛺)
    expect(screen.getByText('⛺')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should handle error when getTierInfo fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockRejectedValue(new Error('Failed to get tier info'));

    render(<TierBadge totalScore={1000} />);

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Should still show loading state (⛺)
    expect(screen.getByText('⛺')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should not display stars when stars is 0', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={1000} showStars={true} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Stars should not be displayed when stars is 0
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('should update when totalScore changes', async () => {
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      totalScore: 1000,
      currentCycleScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    const { rerender } = render(<TierBadge totalScore={1000} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Update score
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 2,
      stars: 0,
      totalScore: 5000,
      currentCycleScore: 5000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({
      level: 2,
      name: '중턱',
      icon: '⛰️',
      minScore: 5000,
      colorVar: '--color-tier-mid',
    });

    rerender(<TierBadge totalScore={5000} />);

    await waitFor(() => {
      expect(screen.getByText('중턱')).toBeInTheDocument();
    });
  });

  it('should use currentTierLevel when provided instead of calculated level', async () => {
    vi.mocked(calculateTier).mockResolvedValue({
      level: 2,
      stars: 0,
      totalScore: 5000,
      currentCycleScore: 5000,
    });
    vi.mocked(getTierInfo).mockResolvedValue({
      level: 1,
      name: '등산로',
      icon: '🥾',
      minScore: 1000,
      colorVar: '--color-tier-trail',
    });

    render(<TierBadge totalScore={5000} currentTierLevel={1} />);

    await waitFor(() => {
      expect(screen.getByText('등산로')).toBeInTheDocument();
    });

    // Should use currentTierLevel (1) instead of calculated level (2)
    expect(getTierInfo).toHaveBeenCalledWith(1);
    expect(getTierInfo).not.toHaveBeenCalledWith(2);
  });
});
