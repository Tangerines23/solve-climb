import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyPageSettings } from '../MyPageSettings';
import { APP_CONFIG } from '@/config/app';
import { useToastStore } from '@/stores/useToastStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useToastStore
vi.mock('@/stores/useToastStore', () => ({
  useToastStore: vi.fn(),
}));

describe('MyPageSettings', () => {
  const defaultProps = {
    soundEnabled: true,
    bgmEnabled: true,
    hapticEnabled: true,
    animationEnabled: true,
    onToggleSound: vi.fn(),
    onToggleBgm: vi.fn(),
    onToggleHaptic: vi.fn(),
    onToggleAnimation: vi.fn(),
    onShowProfileForm: vi.fn(),
    onDataReset: vi.fn(),
    isResetting: false,
    onSendFeedback: vi.fn(),
    onLogout: vi.fn(),
    onWithdraw: vi.fn(),
  };

  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();

    // Mock the useToastStore hook return value
    vi.mocked(useToastStore).mockImplementation((selector: any) => {
      const state = {
        showToast: mockShowToast,
      };
      return selector(state);
    });
  });

  it('should render version number correctly', () => {
    render(<MyPageSettings {...defaultProps} />);
    expect(screen.getByText(APP_CONFIG.APP_VERSION)).toBeInTheDocument();
  });

  it('should call onToggleSound when sound setting is clicked', () => {
    render(<MyPageSettings {...defaultProps} />);
    const soundItem = screen.getByText('효과음');
    fireEvent.click(soundItem);
    expect(defaultProps.onToggleSound).toHaveBeenCalled();
  });

  it('should call onToggleBgm when BGM setting is clicked', () => {
    render(<MyPageSettings {...defaultProps} />);
    const bgmItem = screen.getByText('배경음악 (BGM)');
    fireEvent.click(bgmItem);
    expect(defaultProps.onToggleBgm).toHaveBeenCalled();
  });

  it('should show success toast if version is up to date', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ version: APP_CONFIG.APP_VERSION }),
    };
    (global.fetch as Mock).mockResolvedValue(mockResponse);

    render(<MyPageSettings {...defaultProps} />);

    const updateCheckBtn = screen.getByLabelText('업데이트 확인');
    fireEvent.click(updateCheckBtn);

    expect(mockShowToast).toHaveBeenCalledWith('최신 버전을 확인하고 있습니다...', '🔄', 1500);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        `현재 최신 버전을 사용 중입니다. (${APP_CONFIG.APP_VERSION})`,
        '✅',
        2500
      );
    });
  });

  it('should show success toast if server version is older than local version', async () => {
    const originalVersion = APP_CONFIG.APP_VERSION;
    (APP_CONFIG as any).APP_VERSION = '0.19.456';

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ version: '0.19.454' }),
    };
    (global.fetch as Mock).mockResolvedValue(mockResponse);

    render(<MyPageSettings {...defaultProps} />);

    const updateCheckBtn = screen.getByLabelText('업데이트 확인');
    fireEvent.click(updateCheckBtn);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        `현재 최신 버전을 사용 중입니다. (0.19.456)`,
        '✅',
        2500
      );
    });

    (APP_CONFIG as any).APP_VERSION = originalVersion;
  });

  it('should open update confirm modal if version is outdated in mobile environment (with Capacitor)', async () => {
    // @ts-expect-error: Mock Capacitor for mobile environment
    window.Capacitor = { isNativePlatform: () => true };

    const newerVersion = '9.9.9';
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ version: newerVersion }),
    };
    (global.fetch as Mock).mockResolvedValue(mockResponse);

    render(<MyPageSettings {...defaultProps} />);

    const updateCheckBtn = screen.getByLabelText('업데이트 확인');
    fireEvent.click(updateCheckBtn);

    await waitFor(() => {
      expect(screen.getByText(/준비되었습니다/)).toBeInTheDocument();
    });

    expect(screen.getByText(/v9\.9\.9/)).toBeInTheDocument();

    const updateBtn = screen.getByText('업데이트');
    expect(updateBtn).toBeInTheDocument();

    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null as any);
    fireEvent.click(updateBtn);
    expect(mockOpen).toHaveBeenCalledWith('market://details?id=com.solveclimb.app', '_system');
    mockOpen.mockRestore();
    // @ts-expect-error: Clean up mocked Capacitor
    delete window.Capacitor;
  });

  it('should reload page on update click in web environment (no Capacitor)', async () => {
    const newerVersion = '9.9.9';
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ version: newerVersion }),
    };
    (global.fetch as Mock).mockResolvedValue(mockResponse);

    // Mock window.location.reload
    const originalReload = window.location.reload;
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: mockReload },
    });

    render(<MyPageSettings {...defaultProps} />);

    const updateCheckBtn = screen.getByLabelText('업데이트 확인');
    fireEvent.click(updateCheckBtn);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('새로운 웹 빌드'),
        '🔄',
        2000
      );
    });

    // Expect reload to be called after 1000ms delay
    await waitFor(
      () => {
        expect(mockReload).toHaveBeenCalled();
      },
      { timeout: 1500 }
    );

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalReload,
    });
  });

  it('should show error toast if fetch fails', async () => {
    (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

    render(<MyPageSettings {...defaultProps} />);

    const updateCheckBtn = screen.getByLabelText('업데이트 확인');
    fireEvent.click(updateCheckBtn);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        '버전 정보를 가져오지 못했습니다. 네트워크를 확인해주세요.',
        '❌',
        2500
      );
    });
  });
});
