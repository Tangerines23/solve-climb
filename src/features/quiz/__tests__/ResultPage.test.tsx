import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ResultPage } from '@/features/quiz/pages/ResultPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/features/quiz/stores/useQuizStore');
vi.mock('@/features/quiz/stores/useLevelProgressStore');
vi.mock('@/stores/useUserStore');
vi.mock('../components/TierUpgradeModal');
vi.mock('../components/BadgeNotification');
vi.mock('../utils/tossGameCenter');
vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));
vi.mock('../utils/urlParams');
vi.mock('../utils/debugLogger');
vi.mock('@/features/quiz/stores/useQuizStore', () => {
  const mockState = { score: 100 };
  const fn = vi.fn((selector) =>
    typeof selector === 'function' ? selector(mockState) : mockState
  );
  return { useQuizStore: Object.assign(fn, { getState: () => mockState }) };
});

vi.mock('@/features/quiz/stores/useLevelProgressStore', () => {
  const mockState = {
    progress: {},
    rankings: {},
    clearLevel: vi.fn().mockResolvedValue({ success: true }),
    updateBestScore: vi.fn().mockResolvedValue({ success: true }),
    fetchRanking: vi.fn().mockResolvedValue([]),
  };
  const fn = vi.fn((selector) =>
    typeof selector === 'function' ? selector(mockState) : mockState
  );
  return {
    useLevelProgressStore: Object.assign(fn, {
      getState: () => mockState,
      clearLevel: mockState.clearLevel,
      updateBestScore: mockState.updateBestScore,
      fetchRanking: mockState.fetchRanking,
    }),
  };
});

vi.mock('@/stores/useUserStore', () => {
  const mockState = {
    minerals: 100,
    fetchUserData: vi.fn().mockResolvedValue({ success: true }),
    rewardMinerals: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
  };
  const fn = vi.fn((selector) =>
    typeof selector === 'function' ? selector(mockState) : mockState
  );
  return {
    useUserStore: Object.assign(fn, {
      getState: () => mockState,
      rewardMinerals: mockState.rewardMinerals,
      fetchUserData: mockState.fetchUserData,
    }),
  };
});

vi.mock('@/stores/useSettingsStore', () => {
  const mockStore = (initialState: any) => {
    const store = vi.fn((selector) =>
      typeof selector === 'function' ? selector(initialState) : initialState
    );
    (store as any).getState = () => initialState;
    return store;
  };
  return { useSettingsStore: mockStore({ animationEnabled: true }) };
});

vi.mock('@/stores/useToastStore', () => {
  const mockStore = (initialState: any) => {
    const store = vi.fn((selector) =>
      typeof selector === 'function' ? selector(initialState) : initialState
    );
    (store as any).getState = () => initialState;
    return store;
  };
  return { useToastStore: mockStore({ showToast: vi.fn() }) };
});

vi.mock('@/services/analytics', () => ({
  analytics: {
    trackQuizEnd: vi.fn(),
    trackEvent: vi.fn(),
  },
}));

vi.mock('@/utils/adService', () => ({
  AdService: {
    showRewardedAd: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: vi.fn(() => [new URLSearchParams()]),
  };
});

describe('ResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing and display score', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    // In the actual component, multiple layouts (mobile/landscape) might be rendered
    expect(getAllByText(/0/i)[0]).toBeTruthy();
    expect(getAllByText(/m/i)[0]).toBeTruthy();
  });

  it('should display Survival mode specific UI (Death Note)', async () => {
    const params = new URLSearchParams({
      mode: 'survival',
      world: 'World1',
      category: '기초',
      score: '500',
      last_q: '2 + 2',
      wrong_a: '5',
      correct_a: '4',
    });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { getAllByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    expect(getAllByText(/마지막 고비/i)[0]).toBeTruthy();
    expect(getAllByText(/2 \+ 2/i)[0]).toBeTruthy();
    expect(getAllByText(/5/i)[0]).toBeTruthy();
    expect(getAllByText(/4/i)[0]).toBeTruthy();
  });

  it('should handle Double Reward with AdSuccess', async () => {
    const { useUserStore } = await import('@/stores/useUserStore');
    const { AdService } = await import('@/utils/adService');
    const params = new URLSearchParams({
      score: '200',
      mode: 'time-attack',
      world: 'World1',
      category: '기초',
    });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { getByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    const doubleBtn = getByText(/보상 2배/i);
    const { fireEvent, act } = await import('@testing-library/react');

    await act(async () => {
      fireEvent.click(doubleBtn);
    });

    expect(AdService.showRewardedAd).toHaveBeenCalled();
    expect(useUserStore().rewardMinerals).toHaveBeenCalled();
  });

  it('should render base-camp-result mode', async () => {
    const params = new URLSearchParams({
      mode: 'base-camp-result',
      accuracy: '85',
      recommendation: '대수',
    });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { getByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    expect(getByText(/진단 완료/i)).toBeTruthy();
    expect(getByText(/85%/i)).toBeTruthy();
    expect(getByText(/급경사 등반/i)).toBeTruthy();
  });

  it('should handle navigation buttons', async () => {
    const params = new URLSearchParams({
      score: '100',
      mode: 'time-attack',
      world: 'World1',
      category: '기초',
      level: '1',
    });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { fireEvent, act } = await import('@testing-library/react');
    const { getAllByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    await act(async () => {
      const retryBtn = getAllByText(/다시 도전/i)[0];
      fireEvent.click(retryBtn);
    });
    expect(mockNavigate).toHaveBeenCalled();

    await act(async () => {
      const otherBtn = getAllByText(/다른 레벨/i)[0];
      fireEvent.click(otherBtn);
    });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate from base-camp-result actions', async () => {
    const params = new URLSearchParams({
      mode: 'base-camp-result',
      accuracy: '85',
      recommendation: '대수',
      world: 'World1',
    });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { getByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    const { fireEvent, act } = await import('@testing-library/react');

    await act(async () => {
      fireEvent.click(getByText(/추천 코스로 등반 시작/i));
    });
    expect(mockNavigate).toHaveBeenCalled();

    // Test close button
    const closeBtn = getByText('✕');
    fireEvent.click(closeBtn);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should handle Revenge Deathnote navigation', async () => {
    const params = new URLSearchParams({ mode: 'survival', score: '100', last_q: '1+1' });
    const { useSearchParams } = await import('react-router-dom');
    vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);

    const { getByText } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    const revengeBtn = getByText(/데스노트 복수하기/i);

    // Mock window.location.href
    const originalLocation = window.location.href;
    delete (window as any).location;
    (window as any).location = { href: originalLocation };

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(revengeBtn);

    expect(window.location.href).toContain('mode=smart-retry');

    // Restore
    (window as any).location = originalLocation;
  });
});
