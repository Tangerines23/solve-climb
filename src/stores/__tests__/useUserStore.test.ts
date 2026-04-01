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
      isAnonymous: false,
      remainingPauses: 3,
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

  it('should set minerals locally', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      result.current.setMinerals(500);
    });
    expect(result.current.minerals).toBe(500);
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
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await act(async () => {
      await result.current.consumeStamina(); // first
      await result.current.consumeStamina(); // immediate second
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('[UserStore] Stamina consumption throttled');
    consoleLogSpy.mockRestore();
  });

  it('should handle pause system', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      result.current.handlePauseClick();
    });
    expect(result.current.showPauseModal).toBe(true);
    await act(async () => {
      result.current.handlePauseResume();
    });
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

    // Mock RPC for secure_reward_ad_view
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        return HttpResponse.json({ success: true, minerals: 500, message: 'Rewarded' });
      }),
      // Mock profiles fetch after refresh
      http.get(`${SUPABASE_REST_URL}/profiles`, () => {
        return HttpResponse.json([{ minerals: 500, stamina: 5 }]);
      })
    );

    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.recoverMineralsAds();
    });

    await waitFor(() => {
      expect(result.current.minerals).toBe(500);
    });
  });

  it('should handle recoverStaminaAds failure (PGRST202 / Missing RPC)', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        return new HttpResponse(
          JSON.stringify({
            code: 'PGRST202',
            message: 'Function not found',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    // Now it enters the error handler in callRpcAndRefresh and returns success: false
    expect(response?.success).toBe(false);
  });

  it('should handle recoverStaminaAds failure (AdService failure)', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: false, error: 'Ad failed' });
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean; message?: string } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
    expect(response?.message).toBe('Ad failed');
  });

  it('should handle recoverStaminaAds failure (RPC internal error)', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        return HttpResponse.json({ success: false, message: 'RPC Error' });
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
  });

  it('should handle recoverStaminaAds failure (Unexpected Error)', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        throw new Error('Unexpected');
      })
    );
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
  });

  it('should handle fetchUserData error during refresh', async () => {
    vi.mocked(AdService.showRewardedAd).mockResolvedValue({ success: true });
    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        return HttpResponse.json({ success: true, stamina: 10 });
      }),
      http.get(`${SUPABASE_REST_URL}/profiles`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      await result.current.recoverStaminaAds();
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should reward minerals (failure expected due to security policy)', async () => {
    const { result } = renderHook(() => useUserStore());
    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.rewardMinerals(100);
    });
    expect(response?.success).toBe(false);
    expect(response?.message).toContain('제한됩니다');
    expect(result.current.minerals).toBe(0);
  });

  it('should refund stamina (failure expected due to security policy)', async () => {
    const { result } = renderHook(() => useUserStore());
    await act(async () => {
      result.current.setStamina(3);
    });
    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.refundStamina();
    });
    expect(response?.success).toBe(false);
    expect(response?.message).toContain('제한됩니다');
    expect(result.current.stamina).toBe(3); // No change
  });

  it('should prevent stamina recovery if on cooldown', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    useUserStore.setState({ lastAdRechargeTime: twoHoursAgo });

    server.use(
      http.post(`${SUPABASE_REST_URL}/rpc/secure_reward_ad_view`, () => {
        return HttpResponse.json({ success: false, message: '쿨다운 120분 남음' });
      })
    );

    const { result } = renderHook(() => useUserStore());

    let response: { success: boolean; message?: string } | undefined;
    await act(async () => {
      response = await result.current.recoverStaminaAds();
    });
    expect(response?.success).toBe(false);
    expect(response?.message).toContain('남음');
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
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null } as any,
      error: null as any,
    });
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
      await act(async () => {
        await result.current.debugAddItems();
      });
      expect(rpcSpy).toHaveBeenCalled();
    });

    it('should call debugResetItems', async () => {
      const rpcSpy = vi.fn();
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_reset_inventory`, () => {
          rpcSpy();
          return HttpResponse.json({ success: true });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugResetItems();
      });
      expect(rpcSpy).toHaveBeenCalled();
    });

    it('should handle infiniteStamina debug mode in consumeStamina', async () => {
      const { useDebugStore } = await import('../useDebugStore');
      useDebugStore.setState({ infiniteStamina: true });

      const { result } = renderHook(() => useUserStore());
      let response: { success: boolean; message: string } | undefined;
      await act(async () => {
        response = await result.current.consumeStamina();
      });
      expect(response?.success).toBe(true);
      expect(response?.message).toContain('Infinite Stamina');
      expect(result.current.stamina).toBe(5); // Not consumed

      useDebugStore.setState({ infiniteStamina: false });
    });

    it('should handle result not found in getProfiles after debugResetItems', async () => {
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_reset_inventory`, () =>
          HttpResponse.json({ success: true })
        ),
        http.get(`${SUPABASE_REST_URL}/profiles`, () => HttpResponse.json([]))
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugResetItems();
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle item deletions in debugRemoveItems', async () => {
      server.use(
        http.get(`${SUPABASE_REST_URL}/inventory`, () => {
          return HttpResponse.json([
            { id: 1, quantity: 3, items: { id: 1, name: 'A', code: 'A' } },
          ]);
        }),
        http.delete(`${SUPABASE_REST_URL}/inventory`, () => HttpResponse.json({ success: true })),
        http.get(`${SUPABASE_REST_URL}/profiles`, () => HttpResponse.json([]))
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugRemoveItems();
      });
    });

    it('should handle item updates in debugRemoveItems', async () => {
      server.use(
        http.get(`${SUPABASE_REST_URL}/inventory`, () => {
          return HttpResponse.json([
            { id: 1, quantity: 10, items: { id: 1, name: 'A', code: 'A' } },
          ]);
        }),
        http.post(`${SUPABASE_REST_URL}/inventory`, () => HttpResponse.json({ success: true })),
        http.get(`${SUPABASE_REST_URL}/profiles`, () => HttpResponse.json([]))
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugRemoveItems();
      });
    });
  });

  describe('Debug Setters', () => {
    it('should set minerals via debug RPC', async () => {
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_set_minerals`, () => {
          return HttpResponse.json({ success: true });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugSetMinerals(1000);
      });
      expect(result.current.minerals).toBe(1000);
    });

    it('should set stamina via debug RPC', async () => {
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_set_stamina`, () => {
          return HttpResponse.json({ success: true });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugSetStamina(20);
      });
      expect(result.current.stamina).toBe(20);
    });

    it('should not update local state if debug RPC fails', async () => {
      server.use(
        http.post(`${SUPABASE_REST_URL}/rpc/debug_set_minerals`, () => {
          return HttpResponse.json({ success: false });
        })
      );
      const { result } = renderHook(() => useUserStore());
      await act(async () => {
        await result.current.debugSetMinerals(9999);
      });
      expect(result.current.minerals).not.toBe(9999);
    });
  });
});
