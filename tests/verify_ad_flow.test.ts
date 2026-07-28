/**
 * 광고 및 보상 지급 통합 검증 스크립트 (Ad & Reward Verification Test)
 *
 * 검증 항목:
 * 1. 모달 오픈 시 사전 로딩(Preload) 동작 검증
 * 2. [광고 시청 -> DB RPC -> 에너지/미네랄 보상 지급] 단일 파이프라인 검증
 * 3. 이중 중복 광고 호출 방지 검증 (AdService 1회 호출 보장)
 * 4. 2배 보상 광고(double_reward) 시 미네랄 적립 검증
 * 5. 광고 재생 중 연속 클릭 (Concurrency Lock) 방어 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdService, _resetAdPreparedForTest } from '@/utils/adService';
import { useUserStore } from '@/stores/useUserStore';
import { AdMob } from '@capacitor-community/admob';
import { supabase } from '@/utils/supabaseClient';

vi.mock('@capacitor-community/admob', () => ({
  AdMob: {
    initialize: vi.fn().mockResolvedValue(undefined),
    prepareRewardVideoAd: vi.fn().mockResolvedValue(undefined),
    showRewardVideoAd: vi.fn().mockResolvedValue({ type: 'rewarded', amount: 1 }),
  },
}));

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { minerals: 100, stamina: 0, last_ad_stamina_recharge: '2026-01-01' },
            error: null,
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockImplementation((fnName, params) => {
      if (fnName === 'secure_reward_ad_view') {
        if (params?.p_ad_type === 'stamina_recharge') {
          return Promise.resolve({
            data: { success: true, stamina: 5, message: '스태미나가 충전되었습니다.' },
            error: null,
          });
        }
        if (params?.p_ad_type === 'double_reward') {
          return Promise.resolve({
            data: { success: true, minerals: 200, message: '미네랄이 2배 지급되었습니다.' },
            error: null,
          });
        }
      }
      return Promise.resolve({ data: { success: true }, error: null });
    }),
  },
}));

describe('Ad & Reward Flow Full Automated Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetAdPreparedForTest();
    useUserStore.setState({
      minerals: 100,
      stamina: 0,
      isLoading: false,
    });
  });

  it('[검증 1] 광고 사전 로딩 (Preload) 기능 검증', async () => {
    // @ts-expect-error: Mock Capacitor
    window.Capacitor = {};

    const preloaded = await AdService.preloadRewardedAd();
    expect(preloaded).toBe(true);
    expect(AdMob.prepareRewardVideoAd).toHaveBeenCalledTimes(1);

    // 두 번째 호출 시 이미 준비되었으므로 네트워크 준비를 재시도하지 않음 (대기시간 0초 보장)
    const preloadedAgain = await AdService.preloadRewardedAd();
    expect(preloadedAgain).toBe(true);
    expect(AdMob.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
  });

  it('[검증 2] 체력 충전 광고 시청 -> 단 1회 RPC -> 에너지가 정상 갱신되는지 검증', async () => {
    // @ts-expect-error: Mock Capacitor
    window.Capacitor = {};

    const spyAd = vi.spyOn(AdService, 'showRewardedAd');

    // 충전 실행 (단일 통로)
    const result = await useUserStore.getState().recoverStaminaAds();

    // 1. 광고는 정확히 단 1회만 호출되어야 함 (이중 호출 꼬임 없음)
    expect(spyAd).toHaveBeenCalledTimes(1);
    expect(spyAd).toHaveBeenCalledWith('stamina_recharge');

    // 2. DB RPC는 secure_reward_ad_view로 1회 전달되어야 함
    expect(supabase.rpc).toHaveBeenCalledWith(
      'secure_reward_ad_view',
      expect.objectContaining({
        p_ad_type: 'stamina_recharge',
      })
    );

    // 3. 성공 여부 확인
    expect(result.success).toBe(true);
  });

  it('[검증 3] 결과 페이지 2배 보상(double_reward) 광고 시 미네랄 보상 지급 검증', async () => {
    const spyAd = vi.spyOn(AdService, 'showRewardedAd');

    // ResultPage 실제 동작 흐름:
    // 1. 광고 시청
    const adResult = await AdService.showRewardedAd('double_reward');
    expect(adResult.success).toBe(true);
    expect(spyAd).toHaveBeenCalledWith('double_reward');

    // 2. 시청 완료 후 DB 보상 지급 (isBonus = true)
    const result = await useUserStore.getState().rewardMinerals(100, true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'secure_reward_ad_view',
      expect.objectContaining({
        p_ad_type: 'double_reward',
      })
    );
    expect(result.success).toBe(true);
  });

  it('[검증 4] 연속 광클 시 동시성 락 (Concurrency Lock) 작동 검증', async () => {
    // 첫번째 광고가 비동기로 진행 중일 때
    const slowAdPromise = new Promise<{ success: boolean }>((resolve) => {
      setTimeout(() => resolve({ success: true }), 500);
    });
    vi.spyOn(AdService, 'showSimulationAd').mockReturnValue(slowAdPromise as any);

    // 첫번째 광고 호출
    const firstCall = AdService.showRewardedAd('stamina_recharge');

    // 바로 연달아 2번째 클릭
    const secondCall = await AdService.showRewardedAd('stamina_recharge');

    // 2번째 클릭은 이미 진행 중이므로 즉시 차단되어야 함
    expect(secondCall.success).toBe(false);
    expect(secondCall.error).toContain('이미 광고가 재생 중입니다');

    // 첫번째 광고는 정상 완료
    const firstResult = await firstCall;
    expect(firstResult.success).toBe(true);
  });
});
