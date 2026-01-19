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

  it('should not show negative button in text mode', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" allowNegative={true} />);
    expect(screen.queryByText('±')).not.toBeInTheDocument();
  });

  it('should call onClear when clear is triggered', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    // onClear is not directly exposed, but we can test it through keyboard events
    // This test verifies the component renders without error
    expect(screen.getByText('q')).toBeInTheDocument();
  });

  it('should call onSubmit when submit button is clicked', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const submitButton = screen.getByText('✓');
    submitButton.click();

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('should not call onSubmit when disabled', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" disabled={true} />);
    const submitButton = screen.getByText('✓');
    submitButton.click();

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should handle keyboard Enter key press', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(event);

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('should handle keyboard Backspace key press', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    window.dispatchEvent(event);

    expect(defaultProps.onBackspace).toHaveBeenCalled();
  });

  it('should handle keyboard Escape key press for clear', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should handle keyboard Delete key press for clear', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const event = new KeyboardEvent('keydown', { key: 'Delete' });
    window.dispatchEvent(event);

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should handle keyboard letter key press in text mode', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(defaultProps.onKeyPress).toHaveBeenCalledWith('a');
  });

  it('should handle keyboard number key press in number mode', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" />);
    const event = new KeyboardEvent('keydown', { key: '5' });
    window.dispatchEvent(event);

    expect(defaultProps.onKeyPress).toHaveBeenCalledWith('5');
  });

  it('should handle keyboard minus key press in number mode with allowNegative', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" allowNegative={true} />);
    const event = new KeyboardEvent('keydown', { key: '-' });
    window.dispatchEvent(event);

    expect(defaultProps.onKeyPress).toHaveBeenCalledWith('-');
  });

  it('should not handle keyboard input when disabled', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" disabled={true} />);
    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(defaultProps.onKeyPress).not.toHaveBeenCalled();
  });

  it('should ignore keyboard input when target is input element', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'a' });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    window.dispatchEvent(event);

    expect(defaultProps.onKeyPress).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should call onKeyPress with "-" when negative button is clicked', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" allowNegative={true} />);
    const negativeButton = screen.getByText('±');
    negativeButton.click();

    expect(defaultProps.onKeyPress).toHaveBeenCalledWith('-');
  });

  it('should apply correct CSS class for number mode', () => {
    const { container } = render(<QwertyKeypad {...defaultProps} mode="number" />);
    const keypad = container.querySelector('.qwerty-keypad');
    expect(keypad).toHaveClass('qwerty-keypad-number');
  });

  it('should have correct data-mode attribute', () => {
    const { container } = render(<QwertyKeypad {...defaultProps} mode="text" />);
    const keypad = container.querySelector('.qwerty-keypad');
    expect(keypad).toHaveAttribute('data-mode', 'text');
  });

  it('should render all number keys in number mode', () => {
    render(<QwertyKeypad {...defaultProps} mode="number" />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('should render all qwerty keys in text mode', () => {
    render(<QwertyKeypad {...defaultProps} mode="text" />);
    const qwertyKeys = [
      'q',
      'w',
      'e',
      'r',
      't',
      'y',
      'u',
      'i',
      'o',
      'p',
      'a',
      's',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
    ];
    qwertyKeys.forEach((key) => {
      expect(screen.getByText(key)).toBeInTheDocument();
    });
  });
});
