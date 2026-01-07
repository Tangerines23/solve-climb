import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SubCategoryPage } from '../SubCategoryPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/SubCategoryHeader');
vi.mock('../components/FooterNav');
vi.mock('../stores/useFavoriteStore');
vi.mock('../utils/scoreCalculator');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams('?category=math')],
  };
});

describe('SubCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <SubCategoryPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

