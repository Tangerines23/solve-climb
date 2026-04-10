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

  it('should render the maintenance UI (Coming Soon)', () => {
    renderPage();

    // Verify Header and Footer are present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toBeInTheDocument();

    // Verify maintenance content
    expect(screen.getByText('일지 기록소 정비 중')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(
      screen.getByText(/등반가님의 소중한 기록을 더 멋지게 시각화하기 위해/)
    ).toBeInTheDocument();
    expect(screen.getByText('🗺️')).toBeInTheDocument();
    expect(screen.getByText('⚒️')).toBeInTheDocument();
  });

  it('should render fog overlay elements', () => {
    const { container } = renderPage();
    const fogIcons = container.querySelectorAll('.fog-icon');
    expect(fogIcons.length).toBeGreaterThan(0);
    expect(fogIcons[0]).toHaveTextContent('☁️');
  });
});
