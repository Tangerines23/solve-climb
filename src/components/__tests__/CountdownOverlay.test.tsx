import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CountdownOverlay } from '../CountdownOverlay';

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

    vi.advanceTimersByTime(1000);

    rerender(<CountdownOverlay isVisible={false} onComplete={onComplete} />);
    rerender(<CountdownOverlay isVisible={true} onComplete={onComplete} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

