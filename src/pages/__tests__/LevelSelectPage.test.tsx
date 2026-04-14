import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LevelSelectPage } from '../LevelSelectPage';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useFavoriteStore } from '../../stores/useFavoriteStore';
import { useDebugStore } from '../../stores/useDebugStore';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore');
vi.mock('../../hooks/useNavigationContext');
vi.mock('../../stores/useFavoriteStore');
vi.mock('../../stores/useDebugStore');
vi.mock('../../config/app', () => ({
  APP_CONFIG: {
    WORLD_MAP: {
      World1: 'World 1',
      World2: 'World 2',
    },
    CATEGORIES: [{ id: 'cat1', name: 'Category 1', symbol: 'cat1-symbol', color: 'blue' }],
    LEVELS: {
      World1: {
        cat1: [
          { level: 1, name: 'Level 1', description: 'Desc 1' },
          { level: 2, name: 'Level 2', description: 'Desc 2' },
        ],
      },
      World2: {
        cat1: [],
      },
    },
    WORLDS: [
      { id: 'World1', mountainId: 'math' },
      { id: 'World2', mountainId: 'math' },
    ],
    ROUTES: {
      HOME: '/',
      CATEGORY_SELECT: '/category-select',
      LEVEL_SELECT: '/level-select',
      GAME: '/quiz',
      RESULT: '/result',
      RANKING: '/ranking',
      HISTORY: '/roadmap',
      MY_PAGE: '/my-page',
      NOTIFICATIONS: '/notifications',
      LOGIN: '/login',
    },
  },
}));
vi.mock('../../components/ClimbGraphic', () => ({
  ClimbGraphic: () => <div data-testid="climb-graphic" />,
}));
vi.mock('../../components/MyRecordCard', () => ({
  MyRecordCard: () => <div data-testid="my-record-card" />,
}));
vi.mock('../../components/LevelListCard', () => ({
  LevelListCard: ({ onLevelClick, onLevelLongPress, onLockedLevelClick }: any) => (
    <div data-testid="level-list-card">
      <button onClick={() => onLevelClick(1)}>Level 1</button>
      <button onClick={() => onLockedLevelClick(2, 2)} data-testid="locked-level-btn">
        Level 2 Locked
      </button>
      <button onClick={() => onLevelLongPress(1)}>Long Press Level 1</button>
    </div>
  ),
}));
vi.mock('../../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav" />,
}));
vi.mock('../../components/Header', () => ({ Header: () => <div data-testid="header" /> }));
vi.mock('../../components/Toast', () => ({
  Toast: ({ message, isOpen }: any) => (isOpen ? <div data-testid="toast">{message}</div> : null),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: vi.fn(),
  };
});

describe('LevelSelectPage', () => {
  const mockWorlds = [
    {
      id: 'World1',
      name: 'World 1',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          levels: [{ level: 1, name: 'Level 1', description: 'Desc' }],
        },
      ],
    },
  ];

  const defaultProgressStore = {
    worlds: mockWorlds,
    loading: false,
    error: null,
    fetchWorlds: vi.fn(),
    getLevelProgress: vi.fn(() => ({ best_score: 20 })),
  };

  const defaultNavContext = {
    mountain: 'math',
    world: 'World1',
    category: 'cat1',
    tryRecover: vi.fn(),
  };

  const defaultFavoriteStore = {
    favorites: [],
    toggleFavorite: vi.fn(),
    addFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
  };

  const defaultDebugStore = {
    bypassLevelLock: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLevelProgressStore as any).mockImplementation((selector?: any) =>
      selector ? selector(defaultProgressStore) : defaultProgressStore
    );
    (useNavigationContext as any).mockReturnValue(defaultNavContext);
    (useFavoriteStore as any).mockImplementation((selector?: any) =>
      selector ? selector(defaultFavoriteStore) : defaultFavoriteStore
    );
    (useDebugStore as any).mockImplementation((selector?: any) =>
      selector ? selector(defaultDebugStore) : defaultDebugStore
    );
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams('?mountain=math&world=World1&category=cat1'),
      vi.fn(),
    ]);
  });

  it('should render level select page', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'World 1' })).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const backButton = screen.getByLabelText('뒤로 가기');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/category-select?mountain=math');
  });

  it('should show toast when locked level is clicked', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const lockedBtn = screen.getByTestId('locked-level-btn');
    fireEvent.click(lockedBtn);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('should navigate to game on level click', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const levelBtn = screen.getByText('Level 1');
    fireEvent.click(levelBtn);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/quiz?'));
  });

  it('should navigate to survival mode', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const survivalBtn = screen.getByRole('button', { name: /서바이벌 챌린지/i });
    fireEvent.click(survivalBtn);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('mode=survival'));
  });

  it('should handle world switching', async () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const nextBtn = screen.getByText('›');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('world=World2'));
    });
  });

  it('should toggle favorite on long press', () => {
    render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const longPressBtn = screen.getByText('Long Press Level 1');
    fireEvent.click(longPressBtn);

    expect(defaultFavoriteStore.addFavorite).toHaveBeenCalled();
  });

  it('should toggle sheet expansion', async () => {
    const { container } = render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    const handleBar = container.querySelector('.sheet-handle-bar');
    fireEvent.click(handleBar!);

    const page = container.querySelector('.level-select-page');
    await waitFor(() => {
      expect(page).toHaveClass('sheet-expanded');
    });
  });
});
