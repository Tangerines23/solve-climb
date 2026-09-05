import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/stores/useProfileStore', () => ({
  useProfileStore: vi.fn(),
}));

vi.mock('../AuthModal', () => ({
  AuthModal: vi.fn(({ isOpen }: any) =>
    isOpen ? <div data-testid="auth-modal">Auth Modal</div> : null
  ),
}));

describe('RequireAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user session and profile are valid', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        session: { user: { id: 'user-1' } },
        user: { id: 'user-1' },
        isLoading: false,
      })
    );
    vi.mocked(useProfileStore).mockImplementation((selector: any) =>
      selector({
        isProfileComplete: true,
      })
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected Content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should NOT flash loading fallback when user exists even if isLoading is true', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        session: { user: { id: 'user-1' } },
        user: { id: 'user-1' },
        isLoading: true, // background refreshing
      })
    );
    vi.mocked(useProfileStore).mockImplementation((selector: any) =>
      selector({
        isProfileComplete: true,
      })
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected Content Without Flash</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // 인증 확인 중... 대신 보호된 화면이 부드럽게유지됨 (Layout Shift & Flash 제거)
    expect(screen.queryByText('인증 확인 중...')).toBeNull();
    expect(screen.getByText('Protected Content Without Flash')).toBeInTheDocument();
  });

  it('should render AuthModal and NOT render protected content when unauthenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        session: null,
        user: null,
        isLoading: false,
      })
    );
    vi.mocked(useProfileStore).mockImplementation((selector: any) =>
      selector({
        isProfileComplete: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>Protected Content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });

  it('should render AuthModal without rendering Home content when unauthenticated on home route (/)', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        session: null,
        user: null,
        isLoading: false,
      })
    );
    vi.mocked(useProfileStore).mockImplementation((selector: any) =>
      selector({
        isProfileComplete: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <div>Home Content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Home Content')).toBeNull();
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });
});
