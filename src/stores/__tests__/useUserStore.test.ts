import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserStore } from '../useUserStore';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { supabase } from '../../utils/supabaseClient';
import { AdService } from '../../utils/adService';

// Mock AdService
vi.mock('../../utils/adService', () => ({
  AdService: {
    showRewardedAd: vi.fn(),
  },
}));

const SUPABASE_REST_URL = '*/rest/v1';

describe('useUserStore (Comprehensive Tests)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock getUser
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'test-user-id' } as any },
      error: null,
    });

    // Mock getSession
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } as any },
      error: null,
    });

    // Reset store
    useUserStore.setState({
      minerals: 0,
      stamina: 5,
      inventory: [],
      isLoading: false,
      lastStaminaConsumeTime: 0,
      showPauseModal: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUserStore());
    expect(result.current.minerals).toBe(0);
    expect(result.current.stamina).toBe(5);
    expect(result.current.inventory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set stamina locally', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      result.current.setStamina(10);
    });
    expect(result.current.stamina).toBe(10);
  });

  it('should fetch user data successfully', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.fetchUserData();
    });
    expect(result.current.minerals).toBe(1000); // from default MSW handler
    expect(result.current.stamina).toBe(5);
  });

  it('should handle fetch user data error', async () => {
    server.use(
      http.get('*/rest/v1/profiles', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.fetchUserData();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.minerals).toBe(0); // maintained default
  });

  it('should consume stamina', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.fetchUserData();
    });
    await act(async () => {
      const response = await result.current.consumeStamina();
      expect(response.success).toBe(true);
    });
    expect(result.current.stamina).toBe(4);
  });

  it('should throttle consumeStamina calls', async () => {
    const { result } = renderHook(() => useUserStore());
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

    await act(async () => {
      await result.current.consumeStamina(); // first
      await result.current.consumeStamina(); // immediate second
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('[UserStore] Stamina consumption throttled');
    consoleLogSpy.mockRestore();
  });

  it('should handle pause system', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => { result.current.handlePauseClick(); });
    expect(result.current.showPauseModal).toBe(true);
    await act(async () => { result.current.handlePauseResume(); });
    expect(result.current.showPauseModal).toBe(false);
  });

  it('should purchase item and refresh data', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/purchase_item`, () => {
        return HttpResponse.json({ success: true, message: 'Purchased' });
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.purchaseItem(1);
    });
    expect(response?.success).toBe(true);
  });

  it('should recover minerals via ads', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.recoverMineralsAds();
    });
    await waitFor(() => {
      expect(result.current.minerals).toBe(500);
    });
  });

  it('should handle recoverStaminaAds fallback simulation (PGRST202)', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/recover_stamina_ads`, () => {
        return new HttpResponse(JSON.stringify({
          code: 'PGRST202',
          message: 'Function not found'
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      })
    );
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.recoverStaminaAds();
    });
    expect(result.current.stamina).toBe(5);
  });

  it('should reward minerals with bonus', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.rewardMinerals(100, true);
    });
    expect(result.current.minerals).toBe(100);
  });

  it('should refund stamina', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => { result.current.setStamina(3); });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/recover_stamina_ads`, () => {
        return HttpResponse.json({ success: true });
      })
    );
    await act(async () => {
      await result.current.refundStamina();
    });
    expect(result.current.stamina).toBe(4);
  });

  it('should prevent stamina recovery if on cooldown', async () => {
    const sixHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    useUserStore.setState({ lastAdRechargeTime: sixHoursAgo });
    const { result } = renderHook(() => useUserStore());

    let response: { success: boolean; message?: string } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
    expect(response?.message).toContain('분 남음');
  });

  it('should handle recoverStaminaAds generic server error', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/recover_stamina_ads`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
  });

  it('should handle consumeStamina server error', async () => {
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/consume_stamina`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.consumeStamina();
    });
    expect(response?.success).toBe(false);
  });

  it('should return early in checkStamina if no session', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null } as any, error: null as any });
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.checkStamina();
    });
  });

  describe('Debug Functions (DEV ONLY)', () => {
    it('should call debugAddItems', async () => {
      const rpcSpy = vi.fn();
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_grant_items`, () => {
          rpcSpy();
          return HttpResponse.json({ success: true });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => { await result.current.debugAddItems(); });
      expect(rpcSpy).toHaveBeenCalled();
    });

    it('should call debugResetItems', async () => {
      const delSpy = vi.fn();
      server.use(
        http.delete(`${SUPABASE_REST_URL}/inventory`, () => {
          delSpy();
          return HttpResponse.json({ success: true });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => { await result.current.debugResetItems(); });
      expect(delSpy).toHaveBeenCalled();
    });

    it('should handle item deletions in debugRemoveItems', async () => {
      server.use(
        http.get(`${SUPABASE_REST_URL}/inventory`, () => {
          return HttpResponse.json([{ id: 1, quantity: 3, items: { id: 1, name: 'A', code: 'A' } }]);
        }),
        http.delete(`${SUPABASE_REST_URL}/inventory`, () => HttpResponse.json({ success: true })),
        http.get(`${SUPABASE_REST_URL}/profiles`, () => HttpResponse.json([]))
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => { await result.current.debugRemoveItems(); });
    });

    it('should handle item updates in debugRemoveItems', async () => {
      server.use(
        http.get(`${SUPABASE_REST_URL}/inventory`, () => {
          return HttpResponse.json([{ id: 1, quantity: 10, items: { id: 1, name: 'A', code: 'A' } }]);
        }),
        http.post(`${SUPABASE_REST_URL}/inventory`, () => HttpResponse.json({ success: true })),
        http.get(`${SUPABASE_REST_URL}/profiles`, () => HttpResponse.json([]))
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => { await result.current.debugRemoveItems(); });
    });
  });

  it('should handle refundStamina simulation fallback (PGRST202)', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => { result.current.setStamina(3); });

    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/recover_stamina_ads`, () => {
        return new HttpResponse(JSON.stringify({ code: 'PGRST202' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      })
    );

    await act(async () => {
      const response = await result.current.refundStamina();
      expect(response.success).toBe(true);
      expect(response.message).toContain('Simulation');
    });

    expect(result.current.stamina).toBe(4);
  });
});
