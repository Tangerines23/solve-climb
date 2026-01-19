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
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    expect(screen.getByText(/준비하기/)).toBeInTheDocument();
    expect(screen.getByText(/수학/)).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    const backButton = screen.getByText('←');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should call onStart with selected items', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([]);
  });

  it('should toggle item selection', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    const itemCard = screen.getByText('산소통');
    fireEvent.click(itemCard);

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([1]);
  });

  it('should display empty inventory message when inventory is empty', () => {
    vi.mocked(useUserStore).mockReturnValue({
      inventory: [],
    } as never);

    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    expect(screen.getByText(/보유한 아이템이 없습니다/)).toBeInTheDocument();
  });

  it('should display item effects correctly', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    expect(screen.getByText('+10초')).toBeInTheDocument();
    expect(screen.getByText('시작부터 질주')).toBeInTheDocument();
  });

  it('should deselect item when clicked again', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    const itemCard = screen.getByText('산소통');
    fireEvent.click(itemCard);
    fireEvent.click(itemCard);

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([]);
  });

  it('should handle multiple item selections', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="수학" topic="덧셈" />);

    const item1 = screen.getByText('산소통');
    const item2 = screen.getByText('파워젤');
    fireEvent.click(item1);
    fireEvent.click(item2);

    const startButton = screen.getByText(/등반 시작/);
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith([1, 2]);
  });

  it('should display topic and category correctly', () => {
    render(<PreGameLobby onStart={mockOnStart} onBack={mockOnBack} category="과학" topic="화학" />);

    expect(screen.getByText(/과학/)).toBeInTheDocument();
    expect(screen.getByText(/화학/)).toBeInTheDocument();
  });
});
