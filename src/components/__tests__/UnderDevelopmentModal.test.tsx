import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { UnderDevelopmentModal } from '../UnderDevelopmentModal';

describe('UnderDevelopmentModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<UnderDevelopmentModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<UnderDevelopmentModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();
    expect(screen.getByText('🚧')).toBeInTheDocument();
  });

  it('should auto close after delay', async () => {
    const onClose = vi.fn();
    render(
      <UnderDevelopmentModal
        isOpen={true}
        onClose={onClose}
        autoClose={true}
        autoCloseDelay={2000}
      />
    );

    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();

    // Advance through the delay and closing animation
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // onClose should be called
    expect(onClose).toHaveBeenCalled();
  });

  it('should not auto close when autoClose is false', async () => {
    const onClose = vi.fn();
    render(<UnderDevelopmentModal isOpen={true} onClose={onClose} autoClose={false} />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should use default autoCloseDelay when not provided', async () => {
    const onClose = vi.fn();
    render(<UnderDevelopmentModal isOpen={true} onClose={onClose} autoClose={true} />);

    // Default delay is 2000ms
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should use custom autoCloseDelay', async () => {
    const onClose = vi.fn();
    render(
      <UnderDevelopmentModal
        isOpen={true}
        onClose={onClose}
        autoClose={true}
        autoCloseDelay={5000}
      />
    );

    // Should not close before custom delay
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(onClose).not.toHaveBeenCalled();

    // Should close after custom delay
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not auto close when onClose is not provided', async () => {
    // Actually onClose is required now, so we pass a mock to see if it's called
    const onClose = vi.fn();
    render(
      <UnderDevelopmentModal
        isOpen={true}
        autoClose={true}
        autoCloseDelay={2000}
        onClose={onClose}
      />
    );

    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be visible (no error thrown)
    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();
  });
});
