import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SafetyRopeOverlay } from '../game/SafetyRopeOverlay';

describe('SafetyRopeOverlay', () => {
  const mockOnAnimationComplete = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );
    expect(container).toBeTruthy();
  });

  it('should not render when isVisible is false', () => {
    const { container } = render(
      <SafetyRopeOverlay isVisible={false} onAnimationComplete={mockOnAnimationComplete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render overlay content when visible', () => {
    render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );

    expect(screen.getByText('SAFE!')).toBeInTheDocument();
    expect(screen.getByText('안전 로프가 1회 방어했습니다')).toBeInTheDocument();
  });

  it('should call onAnimationComplete after 1.5 seconds', () => {
    render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockOnAnimationComplete).toHaveBeenCalled();
  });

  it('should not call onAnimationComplete before timeout', () => {
    render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnAnimationComplete).not.toHaveBeenCalled();
  });

  it('should cleanup timer when component unmounts', () => {
    const { unmount } = render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should not call after unmount
    expect(mockOnAnimationComplete).not.toHaveBeenCalled();
  });

  it('should reset timer when isVisible changes', () => {
    const { rerender } = render(
      <SafetyRopeOverlay isVisible={true} onAnimationComplete={mockOnAnimationComplete} />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(
      <SafetyRopeOverlay isVisible={false} onAnimationComplete={mockOnAnimationComplete} />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should not call when not visible
    expect(mockOnAnimationComplete).not.toHaveBeenCalled();
  });
});


