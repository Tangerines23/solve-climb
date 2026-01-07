import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerCircle } from '../TimerCircle';

describe('TimerCircle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render timer circle with initial time', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={60} onComplete={onComplete} />);

    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('should display time in MM:SS format', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={125} onComplete={onComplete} />);

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('should format time correctly for single digit seconds', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={9} onComplete={onComplete} />);

    expect(screen.getByText('0:09')).toBeInTheDocument();
  });

  it('should format time correctly for minutes', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={90} onComplete={onComplete} />);

    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('should render with isPaused prop', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={60} onComplete={onComplete} isPaused={true} />);

    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('should render with enableFastForward prop', () => {
    const onComplete = vi.fn();
    render(<TimerCircle duration={60} onComplete={onComplete} enableFastForward={true} />);

    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('should render timer container', () => {
    const onComplete = vi.fn();
    const { container } = render(<TimerCircle duration={60} onComplete={onComplete} />);

    expect(container.querySelector('.timer-circle-container')).toBeInTheDocument();
  });
});

