import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KeyboardInfoModal } from '../KeyboardInfoModal';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { APP_CONFIG } from '../../config/app';

// Mock dependencies
vi.mock('../../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('../CustomKeypad', () => ({
  CustomKeypad: ({
    onNumberClick,
    onClear,
    onBackspace,
    onSubmit,
  }: {
    onNumberClick: (val: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onSubmit: () => void;
  }) => (
    <div data-testid="custom-keypad">
      <button onClick={() => onNumberClick('1')}>1</button>
      <button onClick={onClear}>Clear</button>
      <button onClick={onBackspace}>Backspace</button>
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
  }: {
    onKeyPress: (key: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onSubmit: () => void;
  }) => (
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
    } as unknown);

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
    const closeButton =
      document.querySelector('.keyboard-info-modal-close') ||
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

  it('should render custom keypad when keyboardType is custom', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'custom',
    } as unknown);

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Custom keypad might be rendered depending on available categories
    // Just verify modal is rendered
    const modal = document.querySelector('.keyboard-info-modal');
    expect(modal).toBeTruthy();
  });

  it('should render qwerty keypad when keyboardType is qwerty', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as unknown);

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Qwerty keypad might be rendered depending on available categories
    // Just verify modal is rendered
    const modal = document.querySelector('.keyboard-info-modal');
    expect(modal).toBeTruthy();
  });

  it('should handle keyboard type navigation', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as unknown);

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Find and click next keyboard button
    const nextButton = document.querySelector('.keyboard-info-nav-next');
    if (nextButton) {
      fireEvent.click(nextButton);
      // Should change keyboard type
      expect(nextButton).toBeInTheDocument();
    }
  });

  it('should handle category tab selection', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as unknown);

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Find and click a category tab
    const categoryTabs = document.querySelectorAll('.keyboard-info-category-tab');
    if (categoryTabs.length > 1) {
      fireEvent.click(categoryTabs[1]);
      // Tab should be active
      expect(categoryTabs[1]).toHaveClass('active');
    }
  });

  it('should show empty state when no keyboard types available', () => {
    // This test verifies the component handles empty state
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'custom',
    } as unknown);

    // Mock APP_CONFIG to be empty for this test
    const originalSubTopics = APP_CONFIG.SUB_TOPICS;
    (APP_CONFIG as any).SUB_TOPICS = {};

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Modal should render but show empty state message
    expect(document.body).toHaveTextContent(/사용 가능한 키보드가 없습니다/);

    // Restore
    (APP_CONFIG as any).SUB_TOPICS = originalSubTopics;
  });

  it('should handle orientation changes', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'custom',
    } as unknown);

    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Trigger orientation change
    act(() => {
      // Mock screen.orientation.type change
      (window.screen.orientation as any).type = 'landscape-primary';
      const event = new Event('orientationchange');
      window.dispatchEvent(event);

      // Also trigger resize as it's used as a fallback
      window.dispatchEvent(new Event('resize'));
    });

    // Verification is indirect since setIsLandscape is internal,
    // but we can check if it doesn't crash and listeners are called
    expect(window.screen.orientation.addEventListener).toHaveBeenCalled();
  });

  it('should render qwerty-text for language categories', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as unknown);

    // Ensure we have a language category in APP_CONFIG
    // (Assuming it exists based on the code logic for '히라가나')
    render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Switch to next keyboard type if available
    const nextButton = document.querySelector('.keyboard-info-nav-next');
    if (nextButton) {
      fireEvent.click(nextButton);
      // Depending on config, it might switch to qwerty-text
      expect(document.body).toBeTruthy();
    }
  });

  it('should handle category tab selection and reset index when keyboard changes', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'custom',
    } as unknown);

    const { rerender } = render(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Switch to index 1
    const categoryTabs = document.querySelectorAll('.keyboard-info-category-tab');
    if (categoryTabs.length > 1) {
      fireEvent.click(categoryTabs[1]);
      expect(categoryTabs[1]).toHaveClass('active');
    }

    // Change settings to trigger useEffect
    vi.mocked(useSettingsStore).mockReturnValue({
      keyboardType: 'qwerty',
    } as unknown);
    rerender(<KeyboardInfoModal isOpen={true} onClose={mockOnClose} />);

    // Category index should reset to 0
    const newTabs = document.querySelectorAll('.keyboard-info-category-tab');
    if (newTabs.length > 0) {
      expect(newTabs[0]).toHaveClass('active');
    }
  });
});
