import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnderDevelopmentModal } from '../UnderDevelopmentModal';

describe('UnderDevelopmentModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<UnderDevelopmentModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<UnderDevelopmentModal isOpen={true} />);

    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();
  });

  it('should auto close after delay', async () => {
    const onClose = vi.fn();
    render(<UnderDevelopmentModal isOpen={true} onClose={onClose} autoClose={true} autoCloseDelay={2000} />);

    expect(screen.getByText('아직 개발중입니다 :(')).toBeInTheDocument();

    // Advance through the delay and closing animation
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(300);

    // onClose should be called
    expect(onClose).toHaveBeenCalled();
  });

  it('should not auto close when autoClose is false', () => {
    const onClose = vi.fn();
    render(<UnderDevelopmentModal isOpen={true} onClose={onClose} autoClose={false} />);

    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
  });
});

