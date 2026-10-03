import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PauseModal } from '../game/PauseModal';

describe('PauseModal', () => {
  it('should not render content when isVisible is false', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();

    render(
      <PauseModal isVisible={false} remainingPauses={3} onResume={onResume} onExit={onExit} />
    );

    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
  });

  it('should render modal content when isVisible is true', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();

    render(<PauseModal isVisible={true} remainingPauses={2} onResume={onResume} onExit={onExit} />);

    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByText(/계속하기/)).toBeInTheDocument();
    expect(screen.getByText(/그만하기/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should trigger onResume when clicking resume button', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();

    render(<PauseModal isVisible={true} remainingPauses={1} onResume={onResume} onExit={onExit} />);

    fireEvent.click(screen.getByText(/계속하기/));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('should trigger onExit when clicking exit button', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();

    render(<PauseModal isVisible={true} remainingPauses={1} onResume={onResume} onExit={onExit} />);

    fireEvent.click(screen.getByText(/그만하기/));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
  });

  it('should render accurately when remainingPauses is 0', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();

    render(<PauseModal isVisible={true} remainingPauses={0} onResume={onResume} onExit={onExit} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
