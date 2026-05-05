import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModeSelectModal } from '../ModeSelectModal';

describe('ModeSelectModal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ModeSelectModal
        isOpen={false}
        level={1}
        levelName="Test Level"
        onClose={vi.fn()}
        onSelectMode={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={vi.fn()}
        onSelectMode={vi.fn()}
      />
    );

    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
    expect(screen.getByText('타임 어택')).toBeInTheDocument();
    expect(screen.getByText('서바이벌')).toBeInTheDocument();
  });

  it('should call onSelectMode when time-attack is selected', () => {
    const onSelectMode = vi.fn();
    const onClose = vi.fn();
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={onClose}
        onSelectMode={onSelectMode}
      />
    );

    const timeAttackButton = screen.getByText('타임 어택').closest('button');
    timeAttackButton?.click();

    expect(onSelectMode).toHaveBeenCalledWith('time-attack');
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onSelectMode when survival is selected', () => {
    const onSelectMode = vi.fn();
    const onClose = vi.fn();
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={onClose}
        onSelectMode={onSelectMode}
      />
    );

    const survivalButton = screen.getByText('서바이벌').closest('button');
    survivalButton?.click();

    expect(onSelectMode).toHaveBeenCalledWith('survival');
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={onClose}
        onSelectMode={vi.fn()}
      />
    );

    const cancelButton = screen.getByText('취소');
    cancelButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={onClose}
        onSelectMode={vi.fn()}
      />
    );

    const overlay = screen.getByText(/Level 1/).closest('.mode-select-modal-overlay');
    if (overlay) {
      overlay.click();
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={onClose}
        onSelectMode={vi.fn()}
      />
    );

    const modal = screen.getByText(/Level 1/).closest('.mode-select-modal');
    if (modal) {
      modal.click();
      // stopPropagation should prevent onClose from being called
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should display correct stage information for different levels', () => {
    render(
      <ModeSelectModal
        isOpen={true}
        level={10}
        levelName="Advanced Level"
        onClose={vi.fn()}
        onSelectMode={vi.fn()}
      />
    );

    expect(screen.getByText(/Level 10/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced Level/)).toBeInTheDocument();
  });

  it('should display mode descriptions', () => {
    render(
      <ModeSelectModal
        isOpen={true}
        level={1}
        levelName="Test Level"
        onClose={vi.fn()}
        onSelectMode={vi.fn()}
      />
    );

    expect(screen.getByText('60초간 최고 점수 도전')).toBeInTheDocument();
    expect(screen.getByText('틀릴 때까지 도전')).toBeInTheDocument();
  });
});
