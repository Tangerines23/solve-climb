import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act, screen, waitFor } from '@testing-library/react';
import { MyPage } from '../MyPage';
import { BrowserRouter } from 'react-router-dom';

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
  profile: { nickname: 'Tester', userId: 'user-123' },
  hapticEnabled: true,
  animationEnabled: true,
  favorites: [],
  progress: {},
  isAdmin: false,
  setProfile: vi.fn(),
  clearProfile: vi.fn(),
  setHapticEnabled: vi.fn(),
  setAnimationEnabled: vi.fn(),
  setCategoryTopic: vi.fn(),
  getState: () => mockStoreState,
  subscribe: vi.fn(),
};

// 1. Mock Components - Using correct relative paths to src/pages/__tests__/
vi.mock('../../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
vi.mock('../../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));
vi.mock('../../components/ProfileForm', () => ({
  ProfileForm: ({ onComplete, onCancel, showBackButton }: any) => (
    <div data-testid="profile-form">
      <button onClick={() => onComplete()}>Complete</button>
      {showBackButton && <button onClick={() => onCancel()}>Cancel</button>}
    </div>
  ),
}));
vi.mock('../../components/DataResetConfirmModal', () => ({
  DataResetConfirmModal: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="reset-modal">
        <button onClick={() => onConfirm()}>Confirm Reset</button>
        <button onClick={() => onCancel()}>Cancel Reset</button>
      </div>
    ) : null,
}));
vi.mock('../../components/WithdrawConfirmModal', () => ({
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
}));
vi.mock('../../components/Toast', () => ({
  Toast: ({ message, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="toast" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));
vi.mock('../../components/AlertModal', () => ({
  AlertModal: ({ isOpen, message, onClose }: any) =>
    isOpen ? (
      <div data-testid="alert-modal" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));
vi.mock('../../components/CyclePromotionModal', () => ({
  CyclePromotionModal: ({ isOpen, onPromote, onClose, stars }: any) =>
    isOpen ? (
      <div data-testid="promotion-modal">
        <span>Stars: {stars}</span>
        <button onClick={() => onPromote()}>Promote</button>
        <button onClick={() => onClose()}>Close Promotion</button>
      </div>
    ) : null,
}));

// Mock sub-components
vi.mock('../../components/my/MyPageProfile', () => ({
  MyPageProfile: ({ onEditProfile, nickname }: any) => (
    <div data-testid="my-page-profile">
      <span>{nickname}</span>
      <button onClick={() => onEditProfile()}>프로필 수정</button>
    </div>
  ),
}));
vi.mock('../../components/my/MyPageStats', () => ({
  MyPageStats: ({ onOpenLeaderboard, onNavigateHistory }: any) => (
    <div data-testid="my-page-stats">
      <button onClick={() => onOpenLeaderboard()}>명예의 전당</button>
      <button onClick={() => onNavigateHistory()}>히스토리</button>
    </div>
  ),
}));
vi.mock('../../components/my/MyPageQuickAccess', () => ({
  MyPageQuickAccess: () => <div data-testid="quick-access" />,
}));
vi.mock('../../components/my/MyPageSettings', () => ({
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
      <button onClick={() => onToggleHaptic()}>진동 효과</button>
      <button onClick={() => onToggleAnimation()}>애니메이션</button>
      <button onClick={() => onDataReset()}>데이터 초기화</button>
      <button onClick={() => onWithdraw()}>회원 탈퇴</button>
      <button onClick={() => onLogout()}>로그아웃</button>
      <button onClick={() => onSendFeedback()}>의견 보내기</button>
      <button onClick={() => onShowProfileForm()}>프로필 수정 설정</button>
    </div>
  ),
}));
vi.mock('../../components/my/MyPageEffectsGuide', () => ({
  MyPageEffectsGuide: () => <div data-testid="effects-guide" />,
}));

// 2. Mock Utilities and Supabase Client
vi.mock('../../utils/challenge', () => ({
  getTodayChallenge: vi.fn(() => Promise.resolve({ id: 'test' })),
}));
vi.mock('../../utils/dataReset', () => ({
  resetAllData: vi.fn(() => Promise.resolve(true)),
}));
vi.mock('../../utils/userWithdraw', () => ({
  withdrawAccount: vi.fn(() => Promise.resolve(true)),
}));
vi.mock('../../utils/haptic', () => ({ vibrateShort: vi.fn() }));
vi.mock('../../utils/tossGameCenter', () => ({
  openLeaderboard: vi.fn(() => Promise.resolve({ success: true })),
}));
vi.mock('../../utils/auth', () => ({
  signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
}));
vi.mock('../../utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((p) => {
    if (typeof p === 'function') return p();
    return Promise.resolve(p);
  }),
}));
vi.mock('../../constants/tiers', () => ({
  calculateTier: vi.fn(() => Promise.resolve({ stars: 3 })),
}));

vi.mock('../../utils/supabaseClient', () => ({
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

// 3. Mock Stores
vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: Object.assign((selector: any) => selector(mockStoreState), {
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
vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
}));
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: Object.assign((selector: any) => selector(mockStoreState), {
    getState: () => mockStoreState,
    subscribe: vi.fn(),
  }),
}));

// 4. Mock Hooks
vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(() => ({
    stats: {
      totalSolved: 10,
      totalMasteryScore: 1000,
      loginStreak: 5,
      cyclePromotionPending: false,
    },
    session: { user: { id: 'test-user' } },
    loading: false,
    error: null,
    refetch: mockRefetch,
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

import { useMyPageStats } from '../../hooks/useMyPageStats';
import * as authUtils from '../../utils/auth';
import * as dataResetUtils from '../../utils/dataReset';
import * as withdrawUtils from '../../utils/userWithdraw';
import * as tossUtils from '../../utils/tossGameCenter';

describe('MyPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state
    mockStoreState.isProfileComplete = true;
    mockStoreState.profile = { nickname: 'Tester', userId: 'user-123' };
    mockStoreState.hapticEnabled = true;
    mockStoreState.animationEnabled = true;
    mockStoreState.isAdmin = false;
    mockRefetch.mockReturnValue(Promise.resolve());

    // Reset default hook behavior
    (useMyPageStats as any).mockReturnValue({
      stats: {
        totalSolved: 10,
        totalMasteryScore: 1000,
        loginStreak: 5,
        cyclePromotionPending: false,
      },
      session: { user: { id: 'test-user' } },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('settings')).toBeTruthy();
  });

  it('should handle haptic toggle', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/진동 효과/i));
    expect(mockStoreState.setHapticEnabled).toHaveBeenCalled();
    expect(screen.getByTestId('toast')).toBeTruthy();

    // Test toast closing
    fireEvent.click(screen.getByTestId('toast'));
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('should handle animation toggle', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/애니메이션/i));
    expect(mockStoreState.setAnimationEnabled).toHaveBeenCalled();
  });

  it('should handle data reset flow', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/데이터 초기화/i));

    const confirmBtn = screen.getByText('Confirm Reset');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(dataResetUtils.resetAllData).toHaveBeenCalled();
    });
  });

  it('should handle withdrawal flow', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/회원 탈퇴/i));

    const confirmBtn = screen.getByText('Confirm Withdraw');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(withdrawUtils.withdrawAccount).toHaveBeenCalled();
    });
  });

  it('', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: null,
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByText(/로그인하고/i)).toBeTruthy();
  });

  it('should handle anonymous login', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: null,
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    const loginBtn = screen.getByText(/익명 로그인하기/i);

    await act(async () => {
      fireEvent.click(loginBtn);
    });
    await waitFor(() => {
      expect(mockStoreState.setProfile).toHaveBeenCalled();
    });
  });

  it('should handle google login', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: null,
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

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
      expect(authUtils.signInWithGoogle).toHaveBeenCalled();
    });
  });

  it('should handle promotion flow', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: {
        totalSolved: 10,
        totalMasteryScore: 1000,
        loginStreak: 5,
        cyclePromotionPending: true,
      },
      session: { user: { id: 'test' } },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    const promoteBtn = await screen.findByText('Promote');
    await act(async () => {
      fireEvent.click(promoteBtn);
    });
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('should handle logout', async () => {
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
    });
  });

  it('should open leaderboard', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    const rankBtn = screen.getByText(/명예의 전당/i);
    fireEvent.click(rankBtn);
    expect(tossUtils.openLeaderboard).toHaveBeenCalled();
  });

  it('', async () => {
    mockStoreState.isProfileComplete = false;
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByTestId('profile-form')).toBeTruthy();
  });

  it('should handle data reset error', async () => {
    (dataResetUtils.resetAllData as any).mockRejectedValueOnce(new Error('Reset failed'));
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/데이터 초기화/i));

    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Reset'));
    });
    expect(screen.getByText(/데이터 초기화 중 오류/i)).toBeTruthy();
  });

  it('should handle withdrawal error', async () => {
    (withdrawUtils.withdrawAccount as any).mockRejectedValueOnce(new Error('Withdraw failed'));
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/회원 탈퇴/i));

    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Withdraw'));
    });
    expect(screen.getByText(/Withdraw failed/i)).toBeTruthy();
  });

  it('', async () => {
    // Mocking window.location.href via a helper is better than deleting it
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
    fireEvent.click(screen.getByText(/의견 보내기/i));
    expect(window.location.href).toContain('mailto:support@solveclimb.com');

    // Restore
    Object.defineProperty(window, 'location', { value: originalLocation });
  });

  it('', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: null,
      session: { user: { id: 'test' } },
      loading: false,
      error: 'Failed to load stats',
      refetch: mockRefetch,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByText('Failed to load stats')).toBeTruthy();
  });

  it('should open leaderboard with early failure', async () => {
    (tossUtils.openLeaderboard as any).mockResolvedValueOnce({
      success: false,
      message: 'Custom Error',
    });
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/명예의 전당/i));

    await waitFor(() => {
      expect(screen.getByText('Custom Error')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('alert-modal'));
    expect(screen.queryByTestId('alert-modal')).toBeNull();
  });

  it('should handle profile complete with direct redirect', async () => {
    mockStoreState.isProfileComplete = false;
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    const completeBtn = screen.getByText('Complete');
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    // Component first navigates to /my-page then to / since redirectPath is missing
    expect(mockNavigate).toHaveBeenCalledWith('/', expect.any(Object));
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/히스토리/i));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/데이터 초기화/i));
    expect(screen.getByTestId('reset-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel Reset'));
    expect(screen.queryByTestId('reset-modal')).toBeNull();
  });

  it('should close Promotion Modal', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: {
        totalSolved: 10,
        totalMasteryScore: 1000,
        loginStreak: 5,
        cyclePromotionPending: true,
      },
      session: { user: { id: 'test' } },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    const closeBtn = await screen.findByText('Close Promotion');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('promotion-modal')).toBeNull();
  });

  it('', async () => {
    mockStoreState.isAdmin = true;
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByText(/관리자 도구/i)).toBeTruthy();

    fireEvent.click(screen.getByText(/관리자 도구/i));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should handle anonymous login error', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: null,
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Extract setProfile from store mock to force error
    mockStoreState.setProfile.mockImplementationOnce(() => {
      throw new Error('Login failed');
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    const loginBtn = screen.getByText(/익명 로그인하기/i);

    await act(async () => {
      fireEvent.click(loginBtn);
    });
    expect(screen.getByText(/익명 로그인 중 오류/i)).toBeTruthy();
  });

  it('', async () => {
    mockStoreState.isProfileComplete = true; // Complete profile allows cancellation if requested
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    // Trigger ProfileForm via edit button (there are two: one in Profile, one in Settings)
    const editButtons = screen.getAllByText(/프로필 수정/i);
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('profile-form')).toBeTruthy();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('profile-form')).toBeNull();
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/프로필 수정 설정/i));
    expect(screen.getByTestId('profile-form')).toBeTruthy();
  });

  it('should handle Promotion Modal actions', async () => {
    (useMyPageStats as any).mockReturnValue({
      stats: {
        totalSolved: 10,
        totalMasteryScore: 1000,
        loginStreak: 5,
        cyclePromotionPending: true,
        pendingCycleScore: 100,
      },
      session: { user: { id: 'test' } },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    let unmount: any;
    await act(async () => {
      const res = render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
      unmount = res.unmount;
    });
    expect(await screen.findByTestId('promotion-modal')).toBeTruthy();
    expect(screen.getByText(/Stars: 3/i)).toBeTruthy();

    // Test promote
    fireEvent.click(screen.getByText('Promote'));
    expect(mockRefetch).toHaveBeenCalled();

    // Unmount before next part to avoid DOM pollution
    unmount();

    // Test close vs promote branch coverage
    (useMyPageStats as any).mockReturnValue({
      stats: {
        totalSolved: 10,
        totalMasteryScore: 1000,
        loginStreak: 5,
        cyclePromotionPending: true,
        pendingCycleScore: 200,
      },
      session: { user: { id: 'test-user-2' } },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    let findByText: any;
    await act(async () => {
      const res = render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
      findByText = res.findByText;
    });
    const closeBtn = await findByText('Close Promotion');
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByTestId('promotion-modal')).toBeNull();
    });
  });

  it('should handle profile form cancellation', async () => {
    mockStoreState.isProfileComplete = true; // Complete profile allows cancellation if requested
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    // Trigger ProfileForm via edit button (there are two: one in Profile, one in Settings)
    const editButtons = screen.getAllByText(/프로필 수정/i);
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('profile-form')).toBeTruthy();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('profile-form')).toBeNull();
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/프로필 수정 설정/i));
    expect(screen.getByTestId('profile-form')).toBeTruthy();
  });

  it('', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MyPage />
        </BrowserRouter>
      );
    });

    // Trigger toast
    fireEvent.click(screen.getByText(/진동 효과/i));
    const toast = screen.getByTestId('toast');
    fireEvent.click(toast); // onClose trigger
    expect(screen.queryByTestId('toast')).toBeNull();

    // Trigger alert modal (via leaderboard failure)
    (tossUtils.openLeaderboard as any).mockResolvedValueOnce({
      success: false,
      message: 'Alert Message',
    });
    fireEvent.click(screen.getByText(/명예의 전당/i));
    waitFor(() => {
      const alert = screen.getByTestId('alert-modal');
      fireEvent.click(alert); // onClose trigger
      expect(screen.queryByTestId('alert-modal')).toBeNull();
    });
  });
});
