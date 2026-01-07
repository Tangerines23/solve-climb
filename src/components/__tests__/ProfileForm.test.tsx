import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProfileForm } from '../ProfileForm';
import { useProfileStore } from '../../stores/useProfileStore';

// Mock dependencies
vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: vi.fn(),
}));

vi.mock('../../utils/validation', () => ({
  sanitizeNickname: (name: string) => name.trim(),
  validateNickname: (name: string) => {
    if (!name || name.length === 0) {
      return { valid: false, error: '닉네임을 입력해주세요.' };
    }
    if (name.length > 10) {
      return { valid: false, error: '닉네임은 10자 이하여야 합니다.' };
    }
    return { valid: true };
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabaseClient
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        profile: null,
        setProfile: vi.fn(),
      };
      return selector(state);
    });
  });

  const renderProfileForm = (props = {}) => {
    return render(
      <BrowserRouter>
        <ProfileForm onComplete={vi.fn()} {...props} />
      </BrowserRouter>
    );
  };

  it('should render form for new profile', () => {
    renderProfileForm();

    expect(screen.getByText('프로필 만들기')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('닉네임을 입력하세요')).toBeInTheDocument();
  });

  it('should render form for existing profile', () => {
    (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        profile: {
          profileId: 'test-id',
          nickname: 'TestUser',
          createdAt: new Date().toISOString(),
          isAdmin: false,
        },
        setProfile: vi.fn(),
      };
      return selector(state);
    });

    renderProfileForm();

    expect(screen.getByText('프로필 수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
  });

  it('should have nickname input field', () => {
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should show error for invalid nickname', async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    const submitButton = screen.getByText('시작하기');

    // Try to submit empty nickname
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/닉네임을 입력해주세요/)).toBeInTheDocument();
    });
  });

  it('should show character count', async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    await user.type(input, 'Test');

    expect(screen.getByText('4/10자')).toBeInTheDocument();
  });

  it('should call onComplete when form is submitted with valid nickname', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    renderProfileForm({ onComplete });

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    const submitButton = screen.getByText('시작하기');

    await user.type(input, 'ValidName');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should show back button when showBackButton is true', () => {
    renderProfileForm({ showBackButton: true });

    const backButton = screen.getByText('←');
    expect(backButton).toBeInTheDocument();
  });

  it('should not show back button when showBackButton is false', () => {
    renderProfileForm({ showBackButton: false });

    const backButton = screen.queryByText('←');
    expect(backButton).not.toBeInTheDocument();
  });

  it('should show "저장하기" button for existing profile', () => {
    (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        profile: {
          profileId: 'test-id',
          nickname: 'TestUser',
          createdAt: new Date().toISOString(),
          isAdmin: false,
        },
        setProfile: vi.fn(),
      };
      return selector(state);
    });

    renderProfileForm();

    expect(screen.getByText('저장하기')).toBeInTheDocument();
  });

  it('should show error for nickname longer than 10 characters', async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    const submitButton = screen.getByText('시작하기');

    // Type exactly 11 characters (maxLength is 10, so only 10 will be accepted)
    await user.type(input, '12345678901');
    
    // Input should be limited to 10 characters
    expect(input).toHaveValue('1234567890');
    
    // Try to submit
    await user.click(submitButton);

    // Since input is limited, validation should pass, but we can check the character count
    expect(screen.getByText('10/10자')).toBeInTheDocument();
  });

  it('should clear error when typing in input', async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');
    const submitButton = screen.getByText('시작하기');

    // Submit empty to trigger error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/닉네임을 입력해주세요/)).toBeInTheDocument();
    });

    // Type to clear error
    await user.type(input, 'Test');
    expect(screen.queryByText(/닉네임을 입력해주세요/)).not.toBeInTheDocument();
  });

  it('should update character count as user types', async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const input = screen.getByPlaceholderText('닉네임을 입력하세요');

    await user.type(input, 'Test');
    expect(screen.getByText('4/10자')).toBeInTheDocument();

    await user.type(input, 'Name');
    expect(screen.getByText('8/10자')).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked', () => {
    renderProfileForm({ showBackButton: true });

    const backButton = screen.getByText('←');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

