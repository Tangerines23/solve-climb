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

  it('should display penalty information', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    expect(screen.getByText(/스태미나가 부족하여/)).toBeInTheDocument();
    expect(screen.getByText(/지친 상태/)).toBeInTheDocument();
    expect(screen.getByText(/획득 점수와 미네랄이/)).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
    expect(screen.getByText(/화면이 붉게 어두워집니다/)).toBeInTheDocument();
  });

  it('should display warning icon', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('should display ad button with icon', () => {
    render(
      <StaminaWarningModal
        isOpen={true}
        onClose={mockOnClose}
        onPlayAnyway={mockOnPlayAnyway}
        onWatchAd={mockOnWatchAd}
      />
    );

    const adButton = screen.getByText(/광고 보고 충전/);
    expect(adButton).toBeInTheDocument();
    expect(screen.getByText('📺')).toBeInTheDocument();
  });

  it('should display warning message', () => {
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
});


