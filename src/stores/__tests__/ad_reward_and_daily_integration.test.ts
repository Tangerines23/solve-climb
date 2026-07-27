import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserStore } from '../useUserStore';
import { useDailyRewardStore } from '../useDailyRewardStore';
import { supabase } from '../../utils/supabaseClient';

// Supabase 모킹
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-user-id', stamina: 5, minerals: 200 },
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'test-user-id', stamina: 5, minerals: 200 },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

describe('Ad Reward & Daily Login Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // store 초기화
    useUserStore.setState({
      user: { id: 'test-user-id', stamina: 0, minerals: 100 } as any,
      isAdLoading: false,
    });
    useDailyRewardStore.setState({
      rewardResult: null,
      isLoading: false,
      showModal: false,
    });
  });

  it('1. 광고 요청 시 1회만 호출되어야 함 (Double Call 방지)', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, reward_type: 'stamina_recharge', stamina: 5 },
      error: null,
    });

    const promise1 = useUserStore.getState().recoverStaminaAds();
    const promise2 = useUserStore.getState().recoverStaminaAds();

    const [res1, res2] = await Promise.all([promise1, promise2]);

    // 첫 번째 호출은 성공, 두 번째 호출은 isAdLoading에 의해 차단(false)되어야 함
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(false);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('2. 광고 시청 시 스태미나가 풀피(5) 완충 응답을 리턴해야 함', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, reward_type: 'stamina_recharge', stamina: 5 },
      error: null,
    });

    const result = await useUserStore.getState().recoverStaminaAds();

    expect(result.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('secure_reward_ad_view', {
      p_ad_type: 'stamina_recharge',
      p_user_id: 'test-user-id',
    });
  });

  it('3. 광고 시청 시 미네랄 리워드 응답을 정상 리턴하고 지급되어야 함', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, reward_type: 'mineral_recharge', reward_minerals: 100 },
      error: null,
    });

    const mineralResult = await useUserStore.getState().recoverMineralsAds();
    expect(mineralResult.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('secure_reward_ad_view', {
      p_ad_type: 'mineral_recharge',
      p_user_id: 'test-user-id',
    });
  });

  it('4. 출석 보상(handle_daily_login) 호출 시 보상이 지급되고 유저 상태가 동기화되어야 함', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: {
        success: true,
        reward_minerals: 100,
        streak: 1,
        message: '첫 출석 보상(100 미네랄)이 지급되었습니다!',
      },
      error: null,
    });

    await useDailyRewardStore.getState().checkDailyLogin();

    // handle_daily_login RPC가 p_user_id와 함께 호출되었는지 검증
    expect(supabase.rpc).toHaveBeenCalledWith('handle_daily_login', {
      p_user_id: 'test-user-id',
    });

    const state = useDailyRewardStore.getState();
    expect(state.showModal).toBe(true);
    expect(state.rewardResult?.reward_minerals).toBe(100);
  });
});
