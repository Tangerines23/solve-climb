import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from '../AuthModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { signInWithGoogle } from '@/utils/auth';
import { isTossAppEnvironment } from '@/utils/tossLogin';

vi.mock('@/components/BaseModal', () => ({
  BaseModal: vi.fn(({ children, isOpen }: any) =>
    isOpen ? <div data-testid="base-modal">{children}</div> : null
  ),
}));

vi.mock('@/components/ProfileForm', () => ({
  ProfileForm: vi.fn(({ onComplete }: any) => (
    <button data-testid="complete-profile" onClick={onComplete}>
      닉네임 설정 완료
    </button>
  )),
}));

vi.mock('@/stores/useAuthStore', () => {
  const mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);
  return {
    useAuthStore: Object.assign(vi.fn(), {
      getState: vi.fn(() => ({
        signInAnonymously: mockSignInAnonymously,
        user: { id: 'test-user-uuid' },
      })),
    }),
  };
});

vi.mock('@/stores/useProfileStore', () => ({
  useProfileStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({
      setProfile: vi.fn(),
      isProfileComplete: false,
    })),
  }),
}));

vi.mock('@/stores/useLevelProgressStore', () => ({
  useLevelProgressStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({
      syncProgress: vi.fn().mockResolvedValue(undefined),
    })),
  }),
}));

vi.mock('@/utils/auth', () => ({
  signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/utils/tossLogin', () => ({
  isTossAppEnvironment: vi.fn(() => false),
}));

describe('AuthModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login buttons and title when isOpen is true', () => {
    render(<AuthModal isOpen={true} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/로그인하고/)).toBeInTheDocument();
    expect(screen.getByText('구글로 3초 만에 시작하기')).toBeInTheDocument();
    expect(screen.getByText('익명으로 바로 시작하기')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<AuthModal isOpen={false} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('base-modal')).toBeNull();
  });

  it('calls signInWithGoogle on Google button click', async () => {
    render(<AuthModal isOpen={true} onComplete={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('구글로 3초 만에 시작하기'));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
  });

  it('calls signInAnonymously and transitions to profile step on anonymous button click', async () => {
    render(<AuthModal isOpen={true} onComplete={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('익명으로 바로 시작하기'));
    await waitFor(() => {
      expect(useAuthStore.getState().signInAnonymously).toHaveBeenCalled();
      expect(screen.getByTestId('complete-profile')).toBeInTheDocument();
    });
  });

  it('calls onComplete and onClose when ProfileForm completes', async () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onComplete={onComplete} onClose={onClose} />);
    fireEvent.click(screen.getByText('익명으로 바로 시작하기'));
    await waitFor(() => expect(screen.getByTestId('complete-profile')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('complete-profile'));
    expect(onComplete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Toss login button in Toss environment', () => {
    vi.mocked(isTossAppEnvironment).mockReturnValue(true);
    render(<AuthModal isOpen={true} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('토스로 3초 만에 시작하기')).toBeInTheDocument();
  });
});
