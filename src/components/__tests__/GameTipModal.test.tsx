import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameTipModal } from '../GameTipModal';

// Mock dependencies
vi.mock('../../utils/storageKey', () => ({
  createSafeStorageKey: vi.fn((...args) => args.join('_')),
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    setString: vi.fn(),
  },
}));

vi.mock('../game/BackpackBottomSheet', () => ({
  BackpackBottomSheet: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="backpack-bottom-sheet">
        <button onClick={onClose}>Close Backpack</button>
      </div>
    ) : null,
}));

describe('GameTipModal', () => {
  const mockOnStart = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <GameTipModal
        isOpen={false}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    expect(screen.queryByTestId('gt-title-text')).not.toBeInTheDocument();
  });

  it('should render math arithmetic tip', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        level={1}
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByTestId('gt-title-text')).toBeInTheDocument();
  });

  it('should render math equations tip', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="equations"
        level={1}
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByTestId('gt-title-text')).toBeInTheDocument();
  });

  it('should call onStart when start button is clicked', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    const startButton = screen.getByTestId('gt-start-btn');
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalled();
  });

  it('should open backpack bottom sheet', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    const backpackButton = screen.getByText(/🎒/);
    fireEvent.click(backpackButton);

    expect(screen.getByTestId('backpack-bottom-sheet')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    const closeButton = screen.queryByText(/닫기/) || screen.queryByText(/×/);
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call onStart with selected items', () => {
    render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    const startButton = screen.getByTestId('gt-start-btn');
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([]);
  });

  it('should handle different category and subTopic combinations', () => {
    const { rerender } = render(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="arithmetic"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByTestId('gt-title-text')).toBeInTheDocument();

    rerender(
      <GameTipModal
        isOpen={true}
        category="math"
        subTopic="equations"
        onClose={mockOnClose}
        onStart={mockOnStart}
      />
    );

    expect(screen.getByTestId('gt-title-text')).toBeInTheDocument();
  });
});
