import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreGameLobby } from '../game/PreGameLobby';
import { useUserStore } from '../../stores/useUserStore';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

describe('PreGameLobby', () => {
  const mockOnStart = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      inventory: [
        { id: 1, code: 'oxygen_tank', name: '산소통', quantity: 5 },
        { id: 2, code: 'power_gel', name: '파워젤', quantity: 3 },
      ],
    } as never);
  });

  it('should render lobby with category and topic', () => {
    render(
      <PreGameLobby
        onStart={mockOnStart}
        onBack={mockOnBack}
        category="수학"
        topic="덧셈"
      />
    );

    expect(screen.getByText(/준비하기/)).toBeInTheDocument();
    expect(screen.getByText(/수학/)).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    render(
      <PreGameLobby
        onStart={mockOnStart}
        onBack={mockOnBack}
        category="수학"
        topic="덧셈"
      />
    );

    const backButton = screen.getByText('←');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should call onStart with selected items', () => {
    render(
      <PreGameLobby
        onStart={mockOnStart}
        onBack={mockOnBack}
        category="수학"
        topic="덧셈"
      />
    );

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([]);
  });

  it('should toggle item selection', () => {
    render(
      <PreGameLobby
        onStart={mockOnStart}
        onBack={mockOnBack}
        category="수학"
        topic="덧셈"
      />
    );

    const itemCard = screen.getByText('산소통');
    fireEvent.click(itemCard);

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([1]);
  });
});


