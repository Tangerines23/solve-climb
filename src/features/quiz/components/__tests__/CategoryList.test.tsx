import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryList } from '../CategoryList';
import { BrowserRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockIsFavorite = vi.fn(() => false);
const mockAddFavorite = vi.fn();

vi.mock('@/stores/useFavoriteStore', () => ({
  useFavoriteStore: vi.fn((selector) => {
    const state = {
      isFavorite: mockIsFavorite,
      addFavorite: mockAddFavorite,
    };
    return selector(state);
  }),
}));

vi.mock('../../utils/scoreCalculator', () => ({
  calculateCategoryAltitude: vi.fn(() => ({ totalAltitude: 0, totalProblems: 0 })),
}));

vi.mock('../UnknownMountainCard', () => ({
  UnknownMountainCard: () => <div data-testid="unknown-mountain">Unknown Mountain</div>,
}));

vi.mock('../Toast', () => ({
  Toast: () => null,
}));

describe('CategoryList', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <CategoryList />
      </BrowserRouter>
    );

    expect(screen.getByText('등반할 산 선택하기')).toBeInTheDocument();
    expect(screen.getByTestId('unknown-mountain')).toBeInTheDocument();
  });

  it('should handle category click', () => {
    render(
      <BrowserRouter>
        <CategoryList />
      </BrowserRouter>
    );

    const climbButton = document.querySelector('[data-category-id="math"]') as HTMLButtonElement;
    expect(climbButton).toBeTruthy();
    fireEvent.click(climbButton!);
    expect(mockNavigate).toHaveBeenCalledWith('/category-select?mountain=math');
  });

  it('should render category cards', () => {
    render(
      <BrowserRouter>
        <CategoryList />
      </BrowserRouter>
    );

    // Category cards should be rendered
    const categoryCards = document.querySelectorAll('[data-category-id]');
    expect(categoryCards.length).toBeGreaterThan(0);
  });

  it('should display category information', () => {
    render(
      <BrowserRouter>
        <CategoryList />
      </BrowserRouter>
    );

    // Should display title
    expect(screen.getByText('등반할 산 선택하기')).toBeInTheDocument();
  });
});
