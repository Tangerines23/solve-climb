import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toast } from '../Toast';

// Mock createPortal
vi.mock('react-dom', () => ({
  createPortal: (element: React.ReactElement) => element,
}));

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render message when open', () => {
    render(<Toast message="Test message" isOpen={true} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<Toast message="Test message" isOpen={false} />);
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(<Toast message="Test message" isOpen={true} icon="✅" />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should not auto close when autoClose is false', async () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" isOpen={true} onClose={onClose} autoClose={false} />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should auto close after delay when autoClose is true', async () => {
    const onClose = vi.fn();
    render(
      <Toast message="Test message" isOpen={true} onClose={onClose} autoClose={true} autoCloseDelay={2000} />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Advance timers: autoCloseDelay (2000ms) + closing animation (300ms)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    // closing 단계로 전환됨
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    // onClose 호출됨

    expect(onClose).toHaveBeenCalled();
  });

  it('should use custom autoCloseDelay', async () => {
    const onClose = vi.fn();
    render(
      <Toast message="Test message" isOpen={true} onClose={onClose} autoClose={true} autoCloseDelay={5000} />
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).not.toHaveBeenCalled();

    // Advance remaining delay + closing animation
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle closing when isOpen changes to false', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Toast message="Test message" isOpen={true} onClose={onClose} autoClose={false} />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();

    rerender(<Toast message="Test message" isOpen={false} onClose={onClose} autoClose={false} />);

    // isOpen이 false가 되면 closing 애니메이션 시작 (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // isOpen이 false이고 message가 있으면 null을 반환하므로 렌더링되지 않음
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should not render when message is empty', () => {
    const { container } = render(<Toast message="" isOpen={true} />);
    // When message is empty, component returns null
    expect(container.firstChild).toBeNull();
  });
});
