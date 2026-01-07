import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelListCard } from '../LevelListCard';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: (selector: (state: unknown) => unknown) => {
    const state = {
      isLevelCleared: vi.fn(() => false),
      getLevelProgress: vi.fn(() => []),
      getNextLevel: vi.fn(() => 1),
    };
    return selector(state);
  },
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: (selector: (state: unknown) => unknown) => {
    const state = {
      isAdmin: false,
    };
    return selector(state);
  },
}));

vi.mock('../UnderDevelopmentModal', () => ({
  UnderDevelopmentModal: () => null,
}));

describe('LevelListCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLevels = [
    { level: 1, name: 'Level 1', description: 'First level' },
    { level: 2, name: 'Level 2', description: 'Second level' },
  ];

  it('should render level list header', () => {
    render(
      <LevelListCard
        category="math"
        subTopic="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    expect(screen.getByText('레벨 목록')).toBeInTheDocument();
  });
});

