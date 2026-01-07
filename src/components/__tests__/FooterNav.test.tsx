import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FooterNav } from '../FooterNav';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/', search: '', hash: '', state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('FooterNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/';
  });

  const renderFooterNav = () => {
    return render(
      <BrowserRouter>
        <FooterNav />
      </BrowserRouter>
    );
  };

  it('should render all navigation items', () => {
    renderFooterNav();
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('랭킹')).toBeInTheDocument();
    expect(screen.getByText('기록')).toBeInTheDocument();
    expect(screen.getByText('마이')).toBeInTheDocument();
  });

  it('should mark active item', () => {
    mockLocation.pathname = '/ranking';
    renderFooterNav();

    const rankingButton = screen.getByText('랭킹').closest('button');
    expect(rankingButton).toHaveClass('active');
  });

  it('should navigate when item is clicked', () => {
    renderFooterNav();

    const rankingButton = screen.getByText('랭킹');
    rankingButton.click();

    expect(mockNavigate).toHaveBeenCalled();
  });
});

