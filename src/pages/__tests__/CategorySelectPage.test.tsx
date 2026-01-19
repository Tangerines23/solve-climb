import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CategorySelectPage } from '../CategorySelectPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/TopicHeader');
vi.mock('../components/FooterNav');
vi.mock('../stores/useFavoriteStore');
vi.mock('../utils/scoreCalculator', () => ({
  calculateCategoryAltitude: () => ({ totalAltitude: 0, totalProblems: 0 }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams('?mountain=math')],
  };
});

describe('CategorySelectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <CategorySelectPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});
