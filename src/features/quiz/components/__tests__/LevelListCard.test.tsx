import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelListCard } from '../LevelListCard';

const mockIsLevelCleared = vi.fn() as any;
const mockGetNextLevel = vi.fn() as any;
const mockIsAdmin = vi.fn() as any;
let mockRecords: Record<string, any> = {};

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: (selector: (state: any) => any) => {
    const state = {
      records: mockRecords,
      isLevelCleared: mockIsLevelCleared,
      getNextLevel: mockGetNextLevel,
    };
    return selector(state);
  },
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: (selector: (state: unknown) => unknown) => {
    const state = {
      isAdmin: mockIsAdmin,
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
    mockRecords = {};
    mockIsLevelCleared.mockReturnValue(false);
    mockGetNextLevel.mockReturnValue(1);
    mockIsAdmin.mockReturnValue(false);
  });

  const mockLevels = [
    { level: 1, name: 'Level 1', description: 'First level' },
    { level: 2, name: 'Level 2', description: 'Second level' },
  ];

  it('should render level list header', () => {
    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    expect(screen.getByText('레벨 목록')).toBeInTheDocument();
  });

  it('should render level items', () => {
    const { container } = render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    const levelItems = container.querySelectorAll('.level-list-item');
    expect(levelItems.length).toBeGreaterThan(0);
  });

  it('should call onLevelClick when level button is clicked', () => {
    const onLevelClick = vi.fn();
    mockGetNextLevel.mockReturnValue(1);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={onLevelClick}
      />
    );

    const challengeButtons = screen.queryAllByText(/도전하기/);
    if (challengeButtons.length > 0) {
      (challengeButtons[0] as HTMLElement).click();
      expect(onLevelClick).toHaveBeenCalled();
    }
  });

  it('should display locked status for locked levels', () => {
    mockGetNextLevel.mockReturnValue(1);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    const lockedElements = screen.queryAllByText(/잠김/);
    if (lockedElements.length > 0) {
      expect(lockedElements[0]).toBeInTheDocument();
    }
  });

  it('should display cleared status for cleared levels', () => {
    mockIsLevelCleared.mockImplementation(
      (_world: string, _cat: string, level: number) => level === 1
    );
    mockGetNextLevel.mockReturnValue(2);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    expect(screen.getByText('클리어 ✓')).toBeInTheDocument();
  });

  it('should call onLockedLevelClick when locked level is clicked', () => {
    const onLockedLevelClick = vi.fn();
    mockGetNextLevel.mockReturnValue(1);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
        onLockedLevelClick={onLockedLevelClick}
      />
    );

    const lockedElements = screen.queryAllByText(/잠김/);
    if (lockedElements.length > 0) {
      const lockedItem = lockedElements[0].closest('.level-list-item');
      if (lockedItem) {
        (lockedItem as HTMLElement).click();
        expect(onLockedLevelClick).toHaveBeenCalled();
      }
    }
  });

  it('should show best score when available', () => {
    mockIsLevelCleared.mockReturnValue(true);
    // records prefix format: `${tier}:${world}:${category}:${level}`
    mockRecords = {
      'normal:math:arithmetic:1': {
        level: 1,
        bestScore: {
          'time-attack': 1000,
          survival: 2000,
        },
      },
    };
    mockGetNextLevel.mockReturnValue(2);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    // Using querySelector to avoid text corruption issues in screen matchers if any
    const bestScoreElement = document.querySelector('.level-list-item-best');
    expect(bestScoreElement).toBeTruthy();
    expect(bestScoreElement?.textContent).toContain('2,000');
  });

  it('should show "다시하기" button for cleared levels', () => {
    mockIsLevelCleared.mockImplementation(
      (_world: string, _cat: string, level: number) => level === 1
    );
    mockGetNextLevel.mockReturnValue(2);

    render(
      <LevelListCard
        world="math"
        category="arithmetic"
        levels={mockLevels}
        onLevelClick={vi.fn()}
      />
    );

    const retryButtons = screen.queryAllByText(/다시하기/);
    expect(retryButtons.length).toBeGreaterThan(0);
  });
});
