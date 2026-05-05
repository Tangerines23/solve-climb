import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomKeypad } from '../input/CustomKeypad';
import { useSettingsStore } from '../../../../stores/useSettingsStore';
import { KEYPAD_SYMBOLS } from '../../../../constants/ui';

// Mock haptic
vi.mock('../../../../utils/haptic', () => ({
  vibrateShort: vi.fn(),
}));

// Mock stores
vi.mock('../../../../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock haptic
vi.mock('../../../../utils/haptic', () => ({
  vibrateShort: vi.fn(),
}));

describe('CustomKeypad', () => {
  const mockOnNumberClick = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnBackspace = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSettingsStore).mockReturnValue({
      hapticEnabled: false,
    } as unknown);
  });

  it('should render all number buttons', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
      />
    );

    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should call onNumberClick when number button is clicked', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('5'));

    expect(mockOnNumberClick).toHaveBeenCalledWith('5');
  });

  it('should call onBackspace when backspace button is clicked', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
      />
    );

    const backspaceButton = screen.getByText(KEYPAD_SYMBOLS.BACKSPACE);
    fireEvent.click(backspaceButton);

    expect(mockOnBackspace).toHaveBeenCalled();
  });

  it('should call onSubmit when submit button is clicked', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText(KEYPAD_SYMBOLS.SUBMIT);
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should not call handlers when disabled', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText(KEYPAD_SYMBOLS.BACKSPACE));
    const submitButton = screen.getByText(KEYPAD_SYMBOLS.SUBMIT);
    fireEvent.click(submitButton);

    expect(mockOnNumberClick).not.toHaveBeenCalled();
    expect(mockOnBackspace).not.toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should render negative button when showNegative is true', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={true}
      />
    );

    expect(screen.getByText(KEYPAD_SYMBOLS.NEGATIVE)).toBeInTheDocument();
  });

  it('should not render negative button when showNegative is false', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={false}
      />
    );

    expect(screen.queryByText(KEYPAD_SYMBOLS.NEGATIVE)).not.toBeInTheDocument();
  });

  it('should call onNumberClick with "-" when negative button is clicked', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={true}
      />
    );

    fireEvent.click(screen.getByText(KEYPAD_SYMBOLS.NEGATIVE));

    expect(mockOnNumberClick).toHaveBeenCalledWith('-');
  });

  it('should not call onNumberClick with "-" when disabled', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={true}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByText(KEYPAD_SYMBOLS.NEGATIVE));

    expect(mockOnNumberClick).not.toHaveBeenCalled();
  });

  it('should handle all number buttons (0-9)', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
      />
    );

    for (let i = 0; i <= 9; i++) {
      fireEvent.click(screen.getByText(i.toString()));
      expect(mockOnNumberClick).toHaveBeenCalledWith(i.toString());
    }

    expect(mockOnNumberClick).toHaveBeenCalledTimes(10);
  });

  it('should work without onBackspace prop', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onSubmit={mockOnSubmit}
      />
    );

    // Should not throw error when backspace is clicked without onBackspace prop
    const backspaceButton = screen.getByText(KEYPAD_SYMBOLS.BACKSPACE);
    expect(() => fireEvent.click(backspaceButton)).not.toThrow();
  });

  it('should apply correct CSS class when showNegative is true', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={true}
      />
    );

    const negativeButton = screen.getByText(KEYPAD_SYMBOLS.NEGATIVE);
    expect(negativeButton).toBeInTheDocument();
    expect(negativeButton).toHaveClass('keypad-key-special');
  });

  it('should not apply negative class when showNegative is false', () => {
    render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={false}
      />
    );

    const negativeButton = screen.queryByText(KEYPAD_SYMBOLS.NEGATIVE);
    expect(negativeButton).not.toBeInTheDocument();
  });
});
