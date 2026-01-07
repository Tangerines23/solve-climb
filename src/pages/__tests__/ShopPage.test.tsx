import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ShopPage } from '../ShopPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/Header');
vi.mock('../components/FooterNav');
vi.mock('../stores/useUserStore');
vi.mock('../utils/supabaseClient');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ShopPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

