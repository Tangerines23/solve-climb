import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from '../HomePage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../components/StatusCard', () => ({
  StatusCard: () => <div data-testid="status-card">Status Card</div>,
}));

vi.mock('../components/ChallengeCard', () => ({
  ChallengeCard: () => <div data-testid="challenge-card">Challenge Card</div>,
}));

vi.mock('../components/CategoryList', () => ({
  CategoryList: () => <div data-testid="category-list">Category List</div>,
}));

vi.mock('../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">Footer Nav</div>,
}));

vi.mock('../components/Toast', () => ({
  Toast: () => null,
}));

vi.mock('../components/StaminaGauge', () => ({
  StaminaGauge: () => <div data-testid="stamina-gauge">Stamina Gauge</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render homepage components', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
    // 컴포넌트가 렌더링되는지만 확인
    expect(container.querySelector('.home-page')).toBeTruthy();
  });
});

