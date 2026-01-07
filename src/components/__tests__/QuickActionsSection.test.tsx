import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionsSection } from '../debug/QuickActionsSection';
import { useUserStore } from '../../stores/useUserStore';
import { useQuizStore } from '../../stores/useQuizStore';
import { useGameStore } from '../../stores/useGameStore';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn(),
}));

vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('QuickActionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      minerals: 1000,
      stamina: 5,
      setMinerals: vi.fn(() => Promise.resolve()),
      setStamina: vi.fn(() => Promise.resolve()),
      fetchUserData: vi.fn(() => Promise.resolve()),
      debugAddItems: vi.fn(() => Promise.resolve()),
      debugRemoveItems: vi.fn(() => Promise.resolve()),
    } as never);
    vi.mocked(useQuizStore).mockReturnValue({
      setTimeLimit: vi.fn(),
    } as never);
    vi.mocked(useGameStore).mockReturnValue({
      setScore: vi.fn(),
      setCombo: vi.fn(),
    } as never);
  });

  it('should render without crashing', () => {
    const { container } = render(<QuickActionsSection />);
    expect(container).toBeTruthy();
  });

  it('should render game status section', () => {
    render(<QuickActionsSection />);
    expect(screen.getByText(/게임 상태/)).toBeInTheDocument();
  });

  it('should render stamina input', () => {
    const { container } = render(<QuickActionsSection />);
    const staminaInput = container.querySelector('input[name="stamina"]');
    expect(staminaInput).toBeInTheDocument();
  });

  it('should render minerals input', () => {
    const { container } = render(<QuickActionsSection />);
    const mineralsInput = container.querySelector('input[name="minerals"]');
    expect(mineralsInput).toBeInTheDocument();
  });

  it('should handle stamina increment', () => {
    render(<QuickActionsSection />);
    const incrementButton = screen.getByText('+1').closest('button');
    if (incrementButton) {
      fireEvent.click(incrementButton);
    }
  });

  it('should handle minerals increment', () => {
    render(<QuickActionsSection />);
    const incrementButton = screen.getByText('+100').closest('button');
    if (incrementButton) {
      fireEvent.click(incrementButton);
    }
  });

  it('should render infinite modes section', () => {
    render(<QuickActionsSection />);
    expect(screen.getByText(/무한 모드/)).toBeInTheDocument();
  });

  it('should toggle infinite stamina', () => {
    render(<QuickActionsSection />);
    const toggleButton = screen.getByLabelText(/무한 스태미나 토글/);
    fireEvent.click(toggleButton);
  });

  it('should render preset section', () => {
    const { container } = render(<QuickActionsSection />);
    const presetSection = container.querySelector('.debug-preset-section');
    expect(presetSection).toBeInTheDocument();
  });
});

