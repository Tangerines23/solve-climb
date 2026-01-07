import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QwertyKeypad } from '../QwertyKeypad';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

describe('QwertyKeypad', () => {
  const defaultProps = {
    onKeyPress: vi.fn(),
    onClear: vi.fn(),
    onBackspace: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigator.vibrate).mockReturnValue(true);
  });

  it('should render text mode keyboard', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('should render number mode keyboard', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should call onKeyPress when key is clicked', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const keyButton = screen.getByText('q');
    keyButton.click();

    expect(defaultProps.onKeyPress).toHaveBeenCalledWith('q');
  });

  it('should call onBackspace when backspace button is clicked', () => {
    render(<QwertyKeypad {...defaultProps} />);
    // Backspace button is rendered in the second row
    const backspaceButton = screen.getByText('⌫');
    backspaceButton.click();

    expect(defaultProps.onBackspace).toHaveBeenCalled();
  });

  it('should not call handlers when disabled', () => {
    render(<QwertyKeypad {...defaultProps} disabled={true} />);
    const keyButton = screen.getByText('q');
    keyButton.click();

    expect(defaultProps.onKeyPress).not.toHaveBeenCalled();
  });

  it('should show negative button in number mode when allowNegative is true', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" allowNegative={true} />);
    // Negative button is rendered as ± symbol
    const negativeButton = screen.getByText('±');
    expect(negativeButton).toBeInTheDocument();
  });
});

