import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ItemFeedbackOverlay } from '../game/ItemFeedbackOverlay';
import { ItemFeedbackRef } from '@/types/feedback';
import React, { useRef } from 'react';

describe('ItemFeedbackOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    const { container } = render(<ItemFeedbackOverlay />);
    expect(container).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { container } = render(<ItemFeedbackOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('should show feedback when ref.show is called', () => {
    const TestComponent = () => {
      const ref = useRef<ItemFeedbackRef>(null);
      return (
        <>
          <ItemFeedbackOverlay ref={ref} />
          <button onClick={() => ref.current?.show('Test Message')}>Show</button>
        </>
      );
    };

    render(<TestComponent />);
    const button = screen.getByText('Show');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should show subText when provided', () => {
    const TestComponent = () => {
      const ref = useRef<ItemFeedbackRef>(null);
      return (
        <>
          <ItemFeedbackOverlay ref={ref} />
          <button onClick={() => ref.current?.show('Main', 'Sub')}>Show</button>
        </>
      );
    };

    render(<TestComponent />);
    const button = screen.getByText('Show');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('should hide after 2 seconds', () => {
    const TestComponent = () => {
      const ref = useRef<ItemFeedbackRef>(null);
      return (
        <>
          <ItemFeedbackOverlay ref={ref} />
          <button onClick={() => ref.current?.show('Test')}>Show</button>
        </>
      );
    };

    render(<TestComponent />);
    const button = screen.getByText('Show');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Test')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // After 2 seconds, overlay should be hidden
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should apply correct type class', () => {
    const TestComponent = () => {
      const ref = useRef<ItemFeedbackRef>(null);
      return (
        <>
          <ItemFeedbackOverlay ref={ref} />
          <button onClick={() => ref.current?.show('Test', '', 'info')}>Show</button>
        </>
      );
    };

    const { container } = render(<TestComponent />);
    const button = screen.getByText('Show');

    act(() => {
      button.click();
    });

    const overlay = container.querySelector('.item-feedback-container');
    expect(overlay).toHaveClass('info');
  });
});
