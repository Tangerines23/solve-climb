import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStore } from '../useUserStore';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { supabase } from '../../utils/supabaseClient';

// Supabase API URL Pattern
const SUPABASE_API_URL = 'http://localhost';

describe('useUserStore (with MSW)', () => {
  beforeEach(async () => {
    // Mock getUser to bypass local token validation issues
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '',
        } as any,
      },
      error: null,
    });

    // Reset store state
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.setMinerals(0);
      result.current.setStamina(5);
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUserStore());

    expect(result.current.minerals).toBe(0);
    expect(result.current.stamina).toBe(5);
    expect(result.current.inventory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set stamina locally', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setStamina(10);
    });

    expect(result.current.stamina).toBe(10);
  });

  it('should fetch user data successfully', async () => {
    // MSW default handler returns minerals: 1000, stamina: 5
    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.minerals).toBe(1000);
    expect(result.current.stamina).toBe(5);
  });

  it('should handle fetch user data error', async () => {
    // Override handler to return error
    server.use(
      http.get(`${SUPABASE_API_URL}/rest/v1/profiles`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.fetchUserData();
    });

    expect(result.current.isLoading).toBe(false);
    // Should maintain default values on error
    expect(result.current.minerals).toBe(0);
  });

  it('should consume stamina', async () => {
    const { result } = renderHook(() => useUserStore());

    // First load data (stamina: 5)
    await act(async () => {
      await result.current.fetchUserData();
    });

    // Consume stamina (MSW handler returns stamina: 4)
    await act(async () => {
      const response = await result.current.consumeStamina();
      expect(response.success).toBe(true);
    });

    expect(result.current.stamina).toBe(4);
  });

  it('should recover stamina from ads', async () => {
    const { result } = renderHook(() => useUserStore());

    // MSW handler for ad_reward_stamina returns stamina: 5
    await act(async () => {
      const response = await result.current.recoverStaminaAds();
      expect(response.success).toBe(true);
    });

    expect(result.current.stamina).toBe(5);
  });

  it('should set minerals with DB update', async () => {
    const { result } = renderHook(() => useUserStore());

    // MSW PATCH handler echoes the body
    await act(async () => {
      await result.current.setMinerals(500);
    });

    expect(result.current.minerals).toBe(500);
  });

  it('should handle setMinerals negative value', async () => {
    const { result } = renderHook(() => useUserStore());

    await act(async () => {
      await result.current.setMinerals(-100);
    });

    expect(result.current.minerals).toBe(0);
  });

  it('should throttle consumeStamina calls', async () => {
    const { result } = renderHook(() => useUserStore());
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await act(async () => {
      await result.current.setStamina(5);
      useUserStore.setState({ lastStaminaConsumeTime: 0 });
    });

    // First call
    await act(async () => {
      await result.current.consumeStamina();
    });

    // Second call immediately
    await act(async () => {
      await result.current.consumeStamina();
    });

    // Only one consumption should happen (stamina starts at 5, consumes to 4)
    expect(result.current.stamina).toBe(4);
    expect(consoleLogSpy).toHaveBeenCalledWith('[UserStore] Stamina consumption throttled');

    consoleLogSpy.mockRestore();
  });
});
