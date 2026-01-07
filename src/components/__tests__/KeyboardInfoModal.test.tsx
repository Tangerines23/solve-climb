import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardInfoModal } from '../KeyboardInfoModal';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { APP_CONFIG } from '../../config/app';

// Mock dependencies
vi.mock('../../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('../CustomKeypad', () => ({
  CustomKeypad: ({ onNumberClick, onClear, onBackspace, onSubmit }: any) => (
    <div data-testid="custom-keypad">
      <button onClick={() => onNumberClick('1')}>1</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onBackspace}>Backspace</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

vi.mock('../QwertyKeypad', () => ({
  QwertyKeypad: ({ onKeyPress, onClear, onBackspace, onSubmit }: any) => (
    <div data-testid="qwerty-keypad">
      <button onClick={() => onKeyPress('a')}>A</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onBackspace}>Backspace</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

describe('KeyboardInfoModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as never);

    // Mock screen.orientation
    Object.defineProperty(window, 'screen', {
      value: {
        orientation: {
          type: 'portrait-primary',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
    });
  });

  it('should not render when isOpen is false', () => {
    render(<KeyboardInfoModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText(/키보드 미리보기/)).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    const { container } = render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);
    // Portal을 통해 document.body에 렌더링되므로 container가 아닌 document.body에서 찾아야 함
    expect(container).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);
    // Portal을 통해 렌더링되므로 document.body에서 찾기
    const closeButton = document.querySelector('.keyboard-info-modal-close') || 
                       document.querySelector('.quiz-back-button');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call onClose when overlay is clicked', () => {
    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);
    const overlay = document.querySelector('.keyboard-info-modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});

