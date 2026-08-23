import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoadmapPage } from '../RoadmapPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));

// Mock CSS
vi.mock('../RoadmapPage.css', () => ({}));

describe('RoadmapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <BrowserRouter>
        <RoadmapPage />
      </BrowserRouter>
    );

  it('should render Header, RoadmapComingSoon, and FooterNav', () => {
    renderPage();

    // Verify Header and Footer are present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText(/일지 기록소 정비 중/)).toBeInTheDocument();
    expect(screen.getByText(/Coming Soon/)).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toBeInTheDocument();
  });
});
