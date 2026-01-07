import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackpackBottomSheet } from '../game/BackpackBottomSheet';
import { useUserStore } from '../../stores/useUserStore';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

describe('BackpackBottomSheet', () => {
  const mockOnClose = vi.fn();
  const mockOnToggleItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useUserStore).mockReturnValue({
      inventory: [
        { id: 1, code: 'oxygen_tank', name: '산소통', description: '시간 추가', quantity: 5 },
      ],
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <BackpackBottomSheet
        isOpen={false}
        onClose={mockOnClose}
        selectedItemIds={[]}
        onToggleItem={mockOnToggleItem}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <BackpackBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        selectedItemIds={[]}
        onToggleItem={mockOnToggleItem}
      />
    );

    expect(screen.getByText(/나의 배낭/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <BackpackBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        selectedItemIds={[]}
        onToggleItem={mockOnToggleItem}
      />
    );

    const closeButton = screen.getByText(/준비 완료/);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onToggleItem when item is clicked', () => {
    render(
      <BackpackBottomSheet
        isOpen={true}
        onClose={mockOnClose}
        selectedItemIds={[]}
        onToggleItem={mockOnToggleItem}
      />
    );

    const itemCard = screen.getByText('산소통');
    fireEvent.click(itemCard);

    expect(mockOnToggleItem).toHaveBeenCalledWith(1);
  });
});


