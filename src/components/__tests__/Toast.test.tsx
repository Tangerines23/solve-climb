import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('should not auto close when autoClose is false', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" isOpen={true} onClose={onClose} autoClose={false} />);

    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
  });
});
