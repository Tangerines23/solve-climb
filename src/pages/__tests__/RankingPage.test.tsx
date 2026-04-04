import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingPage } from '../RankingPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
vi.mock('@/components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));
vi.mock('@/components/TierBadge', () => ({
  TierBadge: () => <div data-testid="tier-badge">TierBadge</div>,
}));
vi.mock('@/components/SegmentedControl', () => ({
  SegmentedControl: ({ _value, onChange, options }: any) => (
    <div data-testid="segmented-control">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          data-testid={`opt-${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/components/common/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('@/hooks/useRanking', () => ({
  useRanking: vi.fn(),
}));

import { useRanking } from '@/hooks/useRanking';

const mockUseRanking = useRanking as any;

describe('RankingPage', () => {
  const defaultMockReturn = {
    activePeriod: 'weekly',
    setActivePeriod: vi.fn(),
    activeType: 'total',
    setActiveType: vi.fn(),
    loading: false,
    currentUserId: 'user-1',
    currentRankings: [
      { user_id: 'user-1', nickname: '나', score: 1000, rank: 1, tier_level: 1, tier_stars: 3 },
      { user_id: 'user-2', nickname: '유저2', score: 800, rank: 2, tier_level: 1, tier_stars: 2 },
    ],
    myRank: {
      user_id: 'user-1',
      nickname: '나',
      score: 1000,
      rank: 1,
      tier_level: 1,
      tier_stars: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRanking.mockReturnValue(defaultMockReturn);
  });

  it('should render top rankings and my rank', () => {
    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('나')).toBeInTheDocument();
    expect(screen.getByText('유저2')).toBeInTheDocument();
    expect(screen.getAllByText('1,000점').length).toBeGreaterThan(0);
    expect(screen.getByText('🔥 이번 주 리그: 성실함과 노력의 결과!')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
      currentRankings: [],
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('랭킹 불러오는 중...')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      currentRankings: [],
      myRank: null,
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('아직 등록된 랭킹이 없어요.')).toBeInTheDocument();
  });

  it('should change period when buttons are clicked', () => {
    const setActivePeriod = vi.fn();
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      setActivePeriod,
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByLabelText('명예의 전당'));
    expect(setActivePeriod).toHaveBeenCalledWith('all-time');
  });

  it('should change type when segment option is clicked', () => {
    const setActiveType = vi.fn();
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      setActiveType,
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('opt-time-attack'));
    expect(setActiveType).toHaveBeenCalledWith('time-attack');
  });

  it('should display medal icons correctly', () => {
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      currentRankings: [
        { user_id: '1', nickname: '1등', score: 100, rank: 1 },
        { user_id: '2', nickname: '2등', score: 90, rank: 2 },
        { user_id: '3', nickname: '3등', score: 80, rank: 3 },
        { user_id: '4', nickname: '4등', score: 70, rank: 4 },
      ],
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText('🥇').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🥈').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🥉').length).toBeGreaterThan(0);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should render season badge when week_start_date is provided', () => {
    mockUseRanking.mockReturnValue({
      ...defaultMockReturn,
      currentRankings: [
        {
          user_id: 'user-1',
          nickname: '나',
          score: 1000,
          rank: 1,
          week_start_date: '2024-01-01', // Assume 1st week of Jan
        },
      ],
    });

    render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    // 2024-01-01 is Monday (getDay() = 1). (1 + 1)/7 ceil = 1.
    expect(screen.getByText(/1월 1주차 시즌/)).toBeInTheDocument();
  });
});
