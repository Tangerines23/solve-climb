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
      setMinerals: vi.fn(),
      setStamina: vi.fn(),
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
});

