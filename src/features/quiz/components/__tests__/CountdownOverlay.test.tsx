import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountdownOverlay } from '../overlays/CountdownOverlay';

describe('CountdownOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when not visible', () => {
    const onComplete = vi.fn();
    const { container } = render(<CountdownOverlay isVisible={false} onComplete={onComplete} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render countdown when visible', () => {
    const onComplete = vi.fn();
    render(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should start countdown at 3', () => {
    const onComplete = vi.fn();
    render(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should reset countdown when isVisible changes', () => {
    const onComplete = vi.fn();
    const { rerender } = render(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(<CountdownOverlay isVisible={false} onComplete={onComplete} />);
    rerender(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should countdown from 3 to 1', () => {
    const onComplete = vi.fn();
    render(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display GO! when countdown reaches 0', () => {
    const onComplete = vi.fn();
    render(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    // Countdown from 3 to 0
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('GO!')).toBeInTheDocument();
  });

  it('should not call onComplete when isVisible is false', () => {
    const onComplete = vi.fn();
    render(<CountdownOverlay isVisible={false} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
