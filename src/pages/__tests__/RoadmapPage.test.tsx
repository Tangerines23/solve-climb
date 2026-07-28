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

vi.mock('../../features/mypage/components/HistoryTab', () => ({
  HistoryTab: () => <div data-testid="history-tab">HistoryTab</div>,
}));

// Mock CSS
vi.mock('../RoadmapPage.css', () => ({}));
vi.mock('../../features/mypage/pages/MyPage.css', () => ({}));

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

  it('should render Header, HistoryTab, and FooterNav', () => {
    renderPage();

    // Verify Header, HistoryTab and Footer are present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('history-tab')).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toBeInTheDocument();
  });
});
