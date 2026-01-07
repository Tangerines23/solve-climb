import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TierUpgradeModal } from '../TierUpgradeModal';
import { calculateTier, getTierInfo } from '../../constants/tiers';

// Mock dependencies
vi.mock('../../constants/tiers', () => ({
  calculateTier: vi.fn(),
  getTierInfo: vi.fn(),
}));

describe('TierUpgradeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TierUpgradeModal
        isOpen={false}
        previousScore={1000}
        currentScore={2000}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('티어 업그레이드')).not.toBeInTheDocument();
  });

  it('should render tier upgrade when tier level increases', async () => {
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 2,
      stars: 0,
      minScore: 1000,
      maxScore: 2000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 2' });

    render(
      <TierUpgradeModal
        isOpen={true}
        previousScore={1000}
        currentScore={2000}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/티어 업그레이드/)).toBeInTheDocument();
    });
  });

  it('should render stars celebration when stars increase', async () => {
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 1,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });

    render(
      <TierUpgradeModal
        isOpen={true}
        previousScore={1000}
        currentScore={1500}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/사이클 완료/)).toBeInTheDocument();
    });
  });

  it('should not render when no upgrade or stars added', async () => {
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });

    render(
      <TierUpgradeModal
        isOpen={true}
        previousScore={1000}
        currentScore={1100}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/티어 업그레이드/)).not.toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 1,
      stars: 0,
      minScore: 0,
      maxScore: 1000,
    });
    vi.mocked(calculateTier).mockResolvedValueOnce({
      level: 2,
      stars: 0,
      minScore: 1000,
      maxScore: 2000,
    });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 1' });
    vi.mocked(getTierInfo).mockResolvedValueOnce({ icon: '🏕️', name: 'Camp 2' });

    render(
      <TierUpgradeModal
        isOpen={true}
        previousScore={1000}
        currentScore={2000}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByText('확인');
      closeButton.click();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

