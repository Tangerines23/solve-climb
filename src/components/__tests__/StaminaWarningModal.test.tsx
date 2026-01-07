import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaminaWarningModal } from '../game/StaminaWarningModal';

describe('StaminaWarningModal', () => {
  const mockOnClose = vi.fn();
  const mockOnPlayAnyway = vi.fn();
  const mockOnWatchAd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <StaminaWarningModal
        isOpen={false}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    expect(screen.queryByText(/체력이 부족합니다/)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    expect(screen.getByText(/체력이 부족합니다/)).toBeInTheDocument();
  });

  it('should call onPlayAnyway when play anyway button is clicked', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    const playButton = screen.getByText(/그냥 플레이하기/);
    fireEvent.click(playButton);

    expect(mockOnPlayAnyway).toHaveBeenCalled();
  });

  it('should call onWatchAd when watch ad button is clicked', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    const adButton = screen.getByText(/광고 보고 충전/);
    fireEvent.click(adButton);

    expect(mockOnWatchAd).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    const cancelButton = screen.getByText(/취소/);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});


