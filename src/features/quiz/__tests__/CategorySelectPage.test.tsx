import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySelectPage } from '@/features/quiz/pages/CategorySelectPage';
import { BrowserRouter } from 'react-router-dom';
import { useLevelProgressStore } from '@/features/quiz/stores/useLevelProgressStore';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useDebugStore } from '@/stores/useDebugStore';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('@/features/quiz/stores/useLevelProgressStore');
vi.mock('@/hooks/useNavigationContext');
vi.mock('@/stores/useFavoriteStore');
vi.mock('@/stores/useDebugStore');
vi.mock('@/config/app', () => ({
  APP_CONFIG: {
    CATEGORIES: [
      {
        id: 'cat1',
        name: 'Category 1',
        symbol: '🚀',
        color: 'blue',
        mountainId: 'math',
        icon: '🚀',
      },
    ],
    LEVELS: {
      World1: {
        cat1: [{ level: 1, name: 'Level 1' }],
      },
    },
    ROUTES: {
      HOME: '/',
      CATEGORY_SELECT: '/category-select',
      LEVEL_SELECT: '/level-select',
      GAME: '/quiz',
      RANKING: '/ranking',
      HISTORY: '/roadmap',
      MY_PAGE: '/my-page',
    },
  },
}));
vi.mock('@/features/quiz/components/ClimbGraphic', () => ({
  ClimbGraphic: () => <div data-testid="climb-graphic" />,
}));
vi.mock('@/components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav" />,
}));
vi.mock('@/components/Header', () => ({ Header: () => <div data-testid="header" /> }));
vi.mock('@/features/quiz/components/TopicHeader', () => ({
  TopicHeader: ({ title, onBack }: any) => (
    <div data-testid="topic-header">
      <h1>{title}</h1>
      <button onClick={onBack} data-testid="header-back-button">
        Back
      </button>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CategorySelectPage', () => {
  const mockWorlds = [
    {
      id: 'World1',
      name: 'World 1',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          symbol: '🚀',
          color: 'blue',
        },
      ],
    },
  ];

  const defaultProgressStore = {
    worlds: mockWorlds,
    getLevelProgress: vi.fn(() => []),
  };

  const defaultNavContext = {
    mountain: 'math',
    mountainName: 'Mathematics',
    tryRecover: vi.fn(),
  };

  const defaultFavoriteStore = {
    isFavorite: vi.fn(() => false),
    addFavorite: vi.fn(),
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
  });

  it('renders category select page', () => {
    render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Mathematics - 분야 선택')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
  });

  it('navigates to level select when category is clicked', () => {
    render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    const categoryCard = screen.getByText('Category 1').closest('a');
    fireEvent.click(categoryCard!);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/level-select?'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('category=cat1'));
  });

  it('navigates back when header back button clicked', () => {
    render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    const backButton = screen.getByTestId('header-back-button');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('toggles favorite when star icon clicked', () => {
    render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    const favButton = screen.getByLabelText('즐겨찾기 추가');
    fireEvent.click(favButton);

    expect(defaultFavoriteStore.addFavorite).toHaveBeenCalled();
  });

  it('shows error message if mountain is missing', () => {
    (useNavigationContext as any).mockReturnValue({
      ...defaultNavContext,
      mountain: null,
      mountainName: null,
    });

    render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    expect(screen.getByText('잘못된 접근입니다')).toBeInTheDocument();
  });
});
