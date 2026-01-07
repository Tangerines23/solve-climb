import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { GameFlowSection } from '../debug/GameFlowSection';

// Mock dependencies
vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn(() => ({
    category: 'math',
    topic: 'addition',
    difficulty: 'easy',
    gameMode: 'time-attack',
  })),
}));

vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    score: 0,
    combo: 0,
  })),
}));

describe('GameFlowSection', () => {
  it('should render without crashing', () => {
    const { container } = render(<GameFlowSection />);
    expect(container).toBeTruthy();
  });
});


