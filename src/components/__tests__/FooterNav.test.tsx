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
    expect(screen.getByText('일지')).toBeInTheDocument();
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

  it('should handle home navigation with scroll', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });
    mockLocation.pathname = '/ranking';
    renderFooterNav();

    const homeButton = screen.getByText('홈');
    homeButton.click();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(mockNavigate).toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });

  it('should not navigate when already on home page', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });
    mockLocation.pathname = '/';
    renderFooterNav();

    const homeButton = screen.getByText('홈');
    homeButton.click();

    expect(scrollToSpy).toHaveBeenCalled();
    // Should not navigate if already on home
    scrollToSpy.mockRestore();
  });

  it('should mark active item for different paths', () => {
    mockLocation.pathname = '/ranking';
    renderFooterNav();

    const rankingButton = screen.getByText('랭킹').closest('button');
    expect(rankingButton).toHaveClass('active');
  });

  it('should mark roadmap as active when on roadmap page', () => {
    mockLocation.pathname = '/roadmap';
    renderFooterNav();

    const roadmapButton = screen.getByText('일지').closest('button');
    expect(roadmapButton).toHaveClass('active');
  });

  it('should mark my page as active when on my page', () => {
    mockLocation.pathname = '/my-page';
    renderFooterNav();

    const myButton = screen.getByText('마이').closest('button');
    expect(myButton).toHaveClass('active');
  });

  it('should navigate to ranking when ranking is clicked', () => {
    mockLocation.pathname = '/';
    renderFooterNav();

    const rankingButton = screen.getByText('랭킹');
    rankingButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/ranking');
  });

  it('should navigate to roadmap when roadmap is clicked', () => {
    mockLocation.pathname = '/';
    renderFooterNav();

    const roadmapButton = screen.getByText('일지');
    roadmapButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/roadmap');
  });

  it('should navigate to my page when my is clicked', () => {
    mockLocation.pathname = '/';
    renderFooterNav();

    const myButton = screen.getByText('마이');
    myButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/my-page');
  });

  it('should display all navigation icons', () => {
    renderFooterNav();

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });
});

