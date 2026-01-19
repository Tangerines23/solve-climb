import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomKeypad } from '../CustomKeypad';
import { useSettingsStore } from '../../stores/useSettingsStore';

// Mock haptic
vi.mock('../../utils/haptic', () => ({
  vibrateShort: vi.fn(),
}));

// Mock stores
vi.mock('../../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock haptic
vi.mock('../../utils/haptic', () => ({
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
    } as any);
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

    const backspaceButton = screen.getByText('⌫');
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

    const submitButton = screen.getByText('✓');
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
    fireEvent.click(screen.getByText('⌫'));
    const submitButton = screen.getByText('✓');
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

    expect(screen.getByText('±')).toBeInTheDocument();
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

    expect(screen.queryByText('±')).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByText('±'));

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

    fireEvent.click(screen.getByText('±'));

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
    const backspaceButton = screen.getByText('⌫');
    expect(() => fireEvent.click(backspaceButton)).not.toThrow();
  });

  it('should apply correct CSS class when showNegative is true', () => {
    const { container } = render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={true}
      />
    );

    const lastRow = container.querySelector('.keypad-row-last');
    expect(lastRow).toHaveClass('keypad-row-last-with-negative');
  });

  it('should not apply negative class when showNegative is false', () => {
    const { container } = render(
      <CustomKeypad
        onNumberClick={mockOnNumberClick}
        onClear={mockOnClear}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        showNegative={false}
      />
    );

    const lastRow = container.querySelector('.keypad-row-last');
    expect(lastRow).not.toHaveClass('keypad-row-last-with-negative');
  });
});
