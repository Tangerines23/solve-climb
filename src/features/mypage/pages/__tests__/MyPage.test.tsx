import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act, screen, waitFor } from '@testing-library/react';
import { MyPage } from '../MyPage';
import { BrowserRouter } from 'react-router-dom';
import { useMyPageBridge } from '../../hooks/useMyPageBridge';
/**
 * [Vitest Hoisting Rules]
 * - Variables used inside vi.mock MUST start with 'mock' (e.g., mockStoreState).
 * - Component paths must be relative to the test file: src/pages/__tests__/MyPage.test.tsx
 */

const mockRefetch = vi.fn(() => Promise.resolve());
const mockNavigate = vi.fn();

// Shared state object prefixed with 'mock' for strict hoisting compliance
export const mockStoreState = {
  isProfileComplete: true,
  profile: { nickname: 'Tester', userId: 'test-user' } as any,
  hapticEnabled: true,
  animationEnabled: true,
  favorites: [],
  progress: {},
  isAdmin: false,
  setProfile: vi.fn((p) => {
    mockStoreState.profile = { ...mockStoreState.profile, ...p };
  }),
  clearProfile: vi.fn(() => {
    mockStoreState.profile = null;
  }),
  setHapticEnabled: vi.fn((val) => {
    mockStoreState.hapticEnabled = val;
  }),
  setAnimationEnabled: vi.fn((val) => {
    mockStoreState.animationEnabled = val;
  }),
  setCategoryTopic: vi.fn(),
  getState: () => mockStoreState,
  subscribe: vi.fn(),
};

// 1. Mock Components
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
vi.mock('@/components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));
vi.mock('@/features/auth', () => ({
  ProfileForm: ({ onComplete, onCancel, showBackButton }: any) => (
    <div data-testid="profile-form">
      <button onClick={() => onComplete()}>Complete</button>
      {showBackButton && <button onClick={() => onCancel()}>Cancel</button>}
    </div>
  ),
  DataResetConfirmModal: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="reset-modal">
        <button onClick={() => onConfirm()}>Confirm Reset</button>
        <button onClick={() => onCancel()}>Cancel Reset</button>
      </div>
    ) : null,
  WithdrawConfirmModal: ({ isOpen, onConfirm, onCancel, isLoading }: any) =>
    isOpen ? (
      <div data-testid="withdraw-modal">
        {isLoading ? (
          <span>Withdrawing...</span>
        ) : (
          <button onClick={() => onConfirm()}>Confirm Withdraw</button>
        )}
        <button onClick={() => onCancel()}>Cancel Withdraw</button>
      </div>
    ) : null,
  useProfileStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
  useSession: () => ({ session: { user: { id: 'test-user' } }, loading: false }),
  useProfile: () => ({ profile: mockStoreState.profile, loading: false, refetch: mockRefetch }),
  useUserWithdraw: () => ({ executeWithdraw: vi.fn(), isLoading: false }),
  useDataReset: () => ({ executeReset: vi.fn() }),
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  handleTossLogin: vi.fn(),
  isTossAppEnvironment: false,
}));
vi.mock('@/components/Toast', () => ({
  Toast: ({ message, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="toast" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));
vi.mock('@/components/AlertModal', () => ({
  AlertModal: ({ isOpen, message, onClose }: any) =>
    isOpen ? (
      <div data-testid="alert-modal" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));

// Mock sub-components
vi.mock('../../components/MyPageProfile', () => ({
  MyPageProfile: ({ onEditProfile, nickname }: any) => (
    <div data-testid="my-page-profile">
      <span>{nickname}</span>
      <button onClick={() => onEditProfile()}>프로필 수정</button>
    </div>
  ),
}));
vi.mock('../../components/MyPageStats', () => ({
  MyPageStats: ({ onOpenLeaderboard, onNavigateHistory }: any) => (
    <div data-testid="my-page-stats">
      <button onClick={() => onOpenLeaderboard()}>명예의 전당</button>
      <button onClick={() => onNavigateHistory()}>히스토리</button>
    </div>
  ),
}));
vi.mock('../../components/MyPageQuickAccess', () => ({
  MyPageQuickAccess: () => <div data-testid="quick-access" />,
}));
vi.mock('../../components/MyPageSettings', () => ({
  MyPageSettings: ({
    onToggleHaptic,
    onToggleAnimation,
    onDataReset,
    onWithdraw,
    onLogout,
    onSendFeedback,
    onShowProfileForm,
  }: any) => (
    <div data-testid="settings">
      <button onClick={() => onToggleHaptic(true)}>진동 효과</button>
      <button onClick={() => onToggleAnimation(true)}>애니메이션</button>
      <button onClick={() => onDataReset()}>데이터 초기화</button>
      <button onClick={() => onWithdraw()}>회원 탈퇴</button>
      <button onClick={() => onLogout()}>로그아웃</button>
      <button onClick={() => onSendFeedback()}>의견 보내기</button>
      <button onClick={() => onShowProfileForm()}>프로필 수정 설정</button>
    </div>
  ),
}));
vi.mock('../../components/MyPageEffectsGuide', () => ({
  MyPageEffectsGuide: () => <div data-testid="effects-guide" />,
}));

// 2. Mock Utilities
vi.mock('@/utils/haptic', () => ({ vibrateShort: vi.fn() }));
vi.mock('@/utils/tossGameCenter', () => ({
  openLeaderboard: vi.fn(() => Promise.resolve({ success: true })),
}));
vi.mock('@/features/auth/utils/auth', () => ({
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  performSignOut: vi.fn(() => Promise.resolve({ error: null })),
}));
vi.mock('@/features/auth/utils/dataReset', () => ({
  performDataReset: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/features/auth/utils/userWithdraw', () => ({
  performUserWithdraw: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/features/debug', () => ({
  safeSupabaseQuery: vi.fn(async (p) => p),
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })
      ),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
  },
}));

// 3. Mock Quiz Feature and Stores
vi.mock('@/features/quiz', () => ({
  CyclePromotionModal: ({ isOpen, onPromote, onClose, stars }: any) =>
    isOpen ? (
      <div data-testid="promotion-modal">
        <span>Stars: {stars}</span>
        <button onClick={() => onPromote()}>Promote</button>
        <button onClick={() => onClose()}>Close Promotion</button>
      </div>
    ) : null,
  calculateTier: vi.fn(() => Promise.resolve({ stars: 3 })),
  getTodayChallenge: vi.fn(() => Promise.resolve({ id: 'test' })),
  useQuizStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
  useLevelProgressStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
}));

vi.mock('../../stores/useSettingsStore', () => ({
  useSettingsStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
}));
vi.mock('../../stores/useFavoriteStore', () => ({
  useFavoriteStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
}));

// 4. Mock Hooks
vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(() => ({
    stats: {
      totalMasteryScore: 1000,
      totalSolvedCount: 10,
      bestSubject: 'math_add',
      loginStreak: 5,
    },
    loading: false,
    error: null,
    refetch: mockRefetch,
  })),
}));

export const mockBridgeActions = {
  setProfile: mockStoreState.setProfile,
  clearProfile: mockStoreState.clearProfile,
  setHapticEnabled: mockStoreState.setHapticEnabled,
  setAnimationEnabled: mockStoreState.setAnimationEnabled,
  setCategoryTopic: mockStoreState.setCategoryTopic,
  executeReset: vi.fn(() => Promise.resolve()),
  executeWithdraw: vi.fn(() => Promise.resolve()),
  getTodayChallenge: vi.fn(() => Promise.resolve({ id: 'test' })),
  vibrateShort: vi.fn(),
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  handleTossLogin: vi.fn(),
  getLastPlayedWorld: vi.fn(),
  safeSupabaseQuery: vi.fn(async (p) => p),
  refetch: mockRefetch,
  isTossAppEnvironment: vi.fn(() => false),
};

export const mockStableStats = {
  totalMasteryScore: 1000,
  totalSolvedCount: 10,
  bestSubject: 'math_add',
  loginStreak: 5,
  cyclePromotionPending: false,
};

export const mockStableSession = { user: { id: 'test-user' } };

export const mockStableUrls = {
  myPage: () => '/my-page',
  history: () => '/history',
  debug: () => '/debug',
};

export const mockStableSupabase = {
  auth: {
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve({ data: null })),
  maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
};
export const mockStableFlags = {};

vi.mock('../../hooks/useMyPageBridge', () => ({
  useMyPageBridge: vi.fn(() => ({
    profile: mockStoreState.profile,
    isProfileComplete: mockStoreState.isProfileComplete,
    isAdmin: mockStoreState.isAdmin,
    hapticEnabled: mockStoreState.hapticEnabled,
    animationEnabled: mockStoreState.animationEnabled,
    favorites: mockStoreState.favorites,
    progressMap: mockStoreState.progress,
    stats: mockStableStats,
    session: mockStableSession,
    loading: false,
    error: null,
    ...mockBridgeActions,
    urls: mockStableUrls,
    supabase: mockStableSupabase,
    flags: mockStableFlags,
  })),
}));

// 5. Navigation Mock
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
    useLocation: () => ({ state: null }),
  };
});

describe('MyPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset shared state
    mockStoreState.isProfileComplete = true;
    mockStoreState.profile = { nickname: 'Tester', userId: 'test-user' };
    mockStoreState.hapticEnabled = true;
    mockStoreState.animationEnabled = true;
    mockStoreState.isAdmin = false;
    mockRefetch.mockReset().mockResolvedValue(undefined);

    // Reset stats
    Object.assign(mockStableStats, {
      totalMasteryScore: 1000,
      totalSolvedCount: 10,
      bestSubject: 'math_add',
      loginStreak: 5,
      cyclePromotionPending: false,
    });

    // Reset bridge return value to dynamic implementation
    vi.mocked(useMyPageBridge).mockImplementation(
      () =>
        ({
          profile: mockStoreState.profile,
          isProfileComplete: mockStoreState.isProfileComplete,
          isAdmin: mockStoreState.isAdmin,
          hapticEnabled: mockStoreState.hapticEnabled,
          animationEnabled: mockStoreState.animationEnabled,
          favorites: mockStoreState.favorites,
          progressMap: mockStoreState.progress,
          stats: mockStableStats,
          session: mockStableSession,
          loading: false,
          error: null,
          ...mockBridgeActions,
          urls: mockStableUrls,
          supabase: mockStableSupabase,
          flags: mockStableFlags,
          getLastPlayedWorld: () => 'World1',
        }) as any
    );
  });

  // --- 1. Basic Rendering ---
  it('should render basic components (Header, Settings, Profile)', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('settings')).toBeTruthy();
    expect(screen.getByTestId('my-page-profile')).toBeTruthy();
  });

  // --- 2. Settings & Toggles ---
  it('should handle haptic toggle and show toast notification', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const hapticBtn = screen.getByText(/진동 효과/i);
    await act(async () => {
      fireEvent.click(hapticBtn);
    });

    expect(mockStoreState.setHapticEnabled).toHaveBeenCalled();
    expect(screen.getByTestId('toast')).toBeTruthy();

    // Test toast closing
    await act(async () => {
      fireEvent.click(screen.getByTestId('toast'));
    });
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('should handle animation toggle and show toast notification', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const animationBtn = screen.getByText(/애니메이션/i);
    await act(async () => {
      fireEvent.click(animationBtn);
    });

    expect(mockStoreState.setAnimationEnabled).toHaveBeenCalled();
    expect(screen.getByTestId('toast')).toBeTruthy();
  });

  // --- 3. Data Management (Reset/Withdraw) ---
  it('should handle data reset flow with confirmation', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/데이터 초기화/i));
    });

    const confirmBtn = screen.getByText('Confirm Reset');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(mockBridgeActions.executeReset).toHaveBeenCalled();
      expect(screen.getByText(/모든 데이터가 초기화되었습니다/i)).toBeTruthy();
    });
  });

  it('should handle withdrawal flow with confirmation', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/회원 탈퇴/i));
    });

    const confirmBtn = screen.getByText('Confirm Withdraw');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(mockBridgeActions.executeWithdraw).toHaveBeenCalled();
      expect(screen.getByTestId('toast')).toBeTruthy();
    });
  });

  it('should handle data reset error with user notification', async () => {
    mockBridgeActions.executeReset.mockRejectedValueOnce(new Error('Reset failed'));
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/데이터 초기화/i));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Reset'));
    });

    await waitFor(() => {
      expect(screen.getByText(/데이터 초기화 중 오류/i)).toBeTruthy();
    });
  });

  // --- 4. Authentication Flows ---
  it('should show guest view and handle anonymous login', async () => {
    vi.mocked(useMyPageBridge).mockReturnValue({
      ...mockBridgeActions,
      profile: mockStoreState.profile,
      isProfileComplete: mockStoreState.isProfileComplete,
      isAdmin: mockStoreState.isAdmin,
      hapticEnabled: mockStoreState.hapticEnabled,
      animationEnabled: mockStoreState.animationEnabled,
      favorites: mockStoreState.favorites,
      progressMap: mockStoreState.progress,
      stats: null,
      session: null,
      loading: false,
      error: null,
      urls: mockStableUrls,
      supabase: mockStableSupabase,
      flags: mockStableFlags,
    } as any);

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(/로그인하고/i)).toBeTruthy();

    const loginBtn = screen.getByText(/익명 로그인하기/i);
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    await waitFor(() => {
      expect(mockStoreState.setProfile).toHaveBeenCalled();
    });
  });

  it('should handle google login from guest view', async () => {
    vi.mocked(useMyPageBridge).mockReturnValue({
      ...mockBridgeActions,
      profile: mockStoreState.profile,
      isProfileComplete: mockStoreState.isProfileComplete,
      isAdmin: mockStoreState.isAdmin,
      hapticEnabled: mockStoreState.hapticEnabled,
      animationEnabled: mockStoreState.animationEnabled,
      favorites: mockStoreState.favorites,
      progressMap: mockStoreState.progress,
      stats: null,
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
      urls: mockStableUrls,
      supabase: mockStableSupabase,
      flags: mockStableFlags,
    } as any);

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const loginBtn = screen.getByText(/3초 만에 시작하기/i);
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    await waitFor(() => {
      expect(mockBridgeActions.signInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should handle logout flow and clear state', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const logoutBtn = screen.getByText(/로그아웃/i);
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    await waitFor(() => {
      expect(mockStoreState.clearProfile).toHaveBeenCalled();
      expect(screen.getByText(/로그아웃되었습니다/i)).toBeTruthy();
    });
  });

  // --- 5. Profile Management ---
  it('should show profile form for incomplete profiles and handle completion', async () => {
    mockStoreState.isProfileComplete = false;
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByTestId('profile-form')).toBeTruthy();

    const completeBtn = screen.getByText('Complete');
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', expect.any(Object));
    });
  });

  it('should allow opening profile form from settings and cancelling', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/프로필 수정 설정/i));
    });

    expect(screen.getByTestId('profile-form')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    expect(screen.queryByTestId('profile-form')).toBeNull();
  });

  // --- 6. Features & Analytics ---
  it('should handle cycle promotion flow (open, promote, close)', async () => {
    // 1. Initially false
    mockStableStats.cyclePromotionPending = false;

    const { rerender } = render(
      <BrowserRouter>
        <MyPage />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('promotion-modal')).toBeNull();

    // 2. Trigger promotion
    mockStableStats.cyclePromotionPending = true;
    await act(async () => {
      rerender(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    expect(await screen.findByTestId('promotion-modal')).toBeTruthy();

    // 3. Test promote
    await act(async () => {
      fireEvent.click(screen.getByText('Promote'));
    });

    // Check that it closed and refetched
    await waitFor(() => {
      expect(screen.queryByTestId('promotion-modal')).toBeNull();
      expect(mockRefetch).toHaveBeenCalled();
    });

    // 4. Re-open for testing close button
    // MUST transition false -> true to trigger useEffect
    mockStableStats.cyclePromotionPending = false;
    await act(async () => {
      rerender(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    mockStableStats.cyclePromotionPending = true;
    await act(async () => {
      rerender(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const closeBtn = await screen.findByText('Close Promotion');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Simulate backend update that clears the pending flag after close if desired,
    // but the modal should close immediately regardless.
    expect(screen.queryByTestId('promotion-modal')).toBeNull();
  });

  it('should show development message for leaderboard', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const rankBtn = screen.getByText(/명예의 전당/i);
    await act(async () => {
      fireEvent.click(rankBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/현재 개발 중인 기능입니다/i)).toBeTruthy();
    });
  });

  it('should navigate to history and show admin tools if applicable', async () => {
    mockStoreState.isAdmin = true;
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const historyBtn = screen.getByText(/히스토리/i);
    await act(async () => {
      fireEvent.click(historyBtn);
    });
    expect(mockNavigate).toHaveBeenCalled();

    const adminBtn = screen.getByText(/관리자 도구/i);
    expect(adminBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(adminBtn);
    });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should handle feedback email action', async () => {
    const locationMock = { href: '' };
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/의견 보내기/i));
    });

    expect(window.location.href).toContain('mailto:support@solveclimb.com');
    Object.defineProperty(window, 'location', { value: originalLocation });
  });

  it('should display error message when stats loading fails', async () => {
    // Modify the bridge mock for this specific test
    vi.mocked(useMyPageBridge).mockReturnValue({
      ...mockBridgeActions,
      profile: mockStoreState.profile,
      isProfileComplete: mockStoreState.isProfileComplete,
      isAdmin: mockStoreState.isAdmin,
      hapticEnabled: mockStoreState.hapticEnabled,
      animationEnabled: mockStoreState.animationEnabled,
      favorites: mockStoreState.favorites,
      progressMap: mockStoreState.progress,
      stats: mockStableStats,
      session: mockStableSession,
      loading: false,
      error: 'Failed to load stats',
      refetch: mockRefetch,
      urls: mockStableUrls,
      supabase: mockStableSupabase,
      flags: mockStableFlags,
    } as any);

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Failed to load stats')).toBeTruthy();

    // Reset mock back to default for other tests if needed (though this is the last test)
  });
});
