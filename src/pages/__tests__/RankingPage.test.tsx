import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingPage } from '../RankingPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
vi.mock('@/components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));

describe('RankingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the maintenance UI (Coming Soon)', () => {
    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    // Verify Header and Footer are present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toBeInTheDocument();

    // Verify maintenance content
    expect(screen.getByText('베이스캠프 정비 중')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(
      screen.getByText(/전 세계 등반가들의 기록을 안전하게 집계하기 위해/)
    ).toBeInTheDocument();
    expect(screen.getByText('🏕️')).toBeInTheDocument();
    expect(screen.getByText('⚒️')).toBeInTheDocument();
  });

  it('should render fog overlay elements', () => {
    const { container } = render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    const fogIcons = container.querySelectorAll('.fog-icon');
    expect(fogIcons.length).toBeGreaterThan(0);
    expect(fogIcons[0]).toHaveTextContent('☁️');
  });
});
