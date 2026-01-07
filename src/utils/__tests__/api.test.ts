import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../api';
import { supabase } from '../supabaseClient';
import { useLoadingStore } from '../../stores/useLoadingStore';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock('../../stores/useLoadingStore', () => ({
  useLoadingStore: {
    getState: vi.fn(() => ({
      startLoading: vi.fn(),
      stopLoading: vi.fn(),
    })),
  },
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authApi', () => {
    describe('getCurrentUser', () => {
      it('should get current user successfully', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'test-user' } },
          error: null,
        } as never);

        const user = await authApi.getCurrentUser();

        expect(user).toBeDefined();
        expect(user?.id).toBe('test-user');
      });

      it('should handle errors', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: { message: 'Test error' },
        } as never);

        await expect(authApi.getCurrentUser()).rejects.toBeDefined();
      });
    });

    describe('getSession', () => {
      it('should get session successfully', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: { user: { id: 'test-user' } } },
          error: null,
        } as never);

        const session = await authApi.getSession();

        expect(session).toBeDefined();
      });

      it('should return null when no session', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: null },
          error: null,
        } as never);

        const session = await authApi.getSession();

        expect(session).toBeNull();
      });
    });

    describe('signOut', () => {
      it('should sign out successfully', async () => {
        vi.mocked(supabase.auth.signOut).mockResolvedValue({
          error: null,
        } as never);

        await authApi.signOut();

        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });

    describe('onAuthStateChange', () => {
      it('should register auth state change listener', () => {
        const callback = vi.fn();
        const mockUnsubscribe = vi.fn();
        const mockSubscription = { unsubscribe: mockUnsubscribe };
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
          data: { subscription: mockSubscription },
        } as never);

        const unsubscribe = authApi.onAuthStateChange(callback);

        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockSubscription);
      });
    });
  });
});

