import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnknownMountainCard } from '../UnknownMountainCard';

describe('UnknownMountainCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render card content', () => {
    render(<UnknownMountainCard />);

    expect(screen.getByText('미지의 산')).toBeInTheDocument();
    expect(screen.getByText('베이스캠프 구축 중')).toBeInTheDocument();
  });

  it('should call onToast when clicked', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    card?.click();

    expect(onToast).toHaveBeenCalled();
  });

  it('should handle click cooldown', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');

    // First click
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(1);

    // Second click immediately (should be ignored due to cooldown)
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(1);
  });

  it('should allow click after cooldown period', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');

    // First click
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(1);

    // Advance time past cooldown (500ms)
    vi.advanceTimersByTime(600);

    // Second click after cooldown (should be allowed)
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(2);
  });

  it('should not call onToast when onToast is not provided', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    // Should not throw error when clicking without onToast
    expect(() => card?.click()).not.toThrow();
  });

  it('should set pressed state on mouse down', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    fireEvent.mouseDown(card as HTMLElement);
    expect(card).toHaveClass('pressed');
  });

  it('should clear pressed state on mouse up', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    fireEvent.mouseDown(card as HTMLElement);
    expect(card).toHaveClass('pressed');
    
    fireEvent.mouseUp(card as HTMLElement);
    expect(card).not.toHaveClass('pressed');
  });

  it('should clear pressed state on mouse leave', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    fireEvent.mouseDown(card as HTMLElement);
    expect(card).toHaveClass('pressed');
    
    fireEvent.mouseLeave(card as HTMLElement);
    expect(card).not.toHaveClass('pressed');
  });

  it('should set pressed state on touch start', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    fireEvent.touchStart(card as HTMLElement);
    expect(card).toHaveClass('pressed');
  });

  it('should clear pressed state on touch end', () => {
    render(<UnknownMountainCard />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    
    fireEvent.touchStart(card as HTMLElement);
    expect(card).toHaveClass('pressed');
    
    fireEvent.touchEnd(card as HTMLElement);
    expect(card).not.toHaveClass('pressed');
  });

  it('should display random message from explorerMessages', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    card?.click();

    // Should call onToast with one of the explorer messages
    expect(onToast).toHaveBeenCalled();
    const calledMessage = onToast.mock.calls[0][0];
    expect(calledMessage).toBeTruthy();
    expect(typeof calledMessage).toBe('string');
  });
});

