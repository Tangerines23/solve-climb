import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardPreview } from '../KeyboardPreview';

vi.mock('../CustomKeypad', () => ({
  CustomKeypad: ({
    onNumberClick,
    onClear,
    onBackspace,
    onSubmit,
    showNegative,
  }: {
    onNumberClick: (val: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onSubmit: (e: React.FormEvent) => void;
    showNegative?: boolean;
  }) => (
    <div data-testid="custom-keypad" data-negative={String(showNegative)}>
      <button onClick={() => onNumberClick('7')}>7</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onBackspace}>Back</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

vi.mock('../QwertyKeypad', () => ({
  QwertyKeypad: ({
    onKeyPress,
    onClear,
    onBackspace,
    onSubmit,
    mode,
    allowNegative,
  }: {
    onKeyPress: (key: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onSubmit: (e: React.FormEvent) => void;
    mode: 'text' | 'number';
    allowNegative?: boolean;
  }) => (
    <div data-testid="qwerty-keypad" data-mode={mode} data-negative={String(allowNegative)}>
      <button onClick={() => onKeyPress('k')}>K</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onBackspace}>Back</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

describe('KeyboardPreview', () => {
  it('renders CustomKeypad when keyboardType is custom', () => {
    const handleKeyPress = vi.fn();
    render(
      <KeyboardPreview keyboardType="custom" allowNegative={true} onKeyPress={handleKeyPress} />
    );

    const keypad = screen.getByTestId('custom-keypad');
    expect(keypad).toBeInTheDocument();
    expect(keypad).toHaveAttribute('data-negative', 'true');

    fireEvent.click(screen.getByText('7'));
    expect(handleKeyPress).toHaveBeenCalledWith('7');
  });

  it('renders QwertyKeypad in text mode when keyboardType is qwerty-text', () => {
    render(<KeyboardPreview keyboardType="qwerty-text" />);

    const keypad = screen.getByTestId('qwerty-keypad');
    expect(keypad).toBeInTheDocument();
    expect(keypad).toHaveAttribute('data-mode', 'text');
  });

  it('renders QwertyKeypad in number mode when keyboardType is qwerty-number', () => {
    render(<KeyboardPreview keyboardType="qwerty-number" allowNegative={true} />);

    const keypad = screen.getByTestId('qwerty-keypad');
    expect(keypad).toBeInTheDocument();
    expect(keypad).toHaveAttribute('data-mode', 'number');
    expect(keypad).toHaveAttribute('data-negative', 'true');
  });

  it('does not throw when default no-op callbacks are triggered', () => {
    render(<KeyboardPreview keyboardType="custom" />);

    expect(() => {
      fireEvent.click(screen.getByText('7'));
      fireEvent.click(screen.getByText('Clear'));
      fireEvent.click(screen.getByText('Back'));
      fireEvent.click(screen.getByText('Submit'));
    }).not.toThrow();
  });
});
