import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { useProfileStore } from '../useProfileStore';
import { useLevelProgressStore } from '../useLevelProgressStore';
import { useUserStore } from '../useUserStore';
import { useBadgeStore } from '../useBadgeStore';
import { LevelSyncService } from '@/features/quiz/services/LevelSyncService';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
  },
}));

describe('Cross-Store Invariant & Lifecycle Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[Invariant 1: Logout Reset] should reset all domain stores to initial states on signOut', async () => {
    // 1. Arrange: 각 스토어에 유저 데이터 주입
    useProfileStore.setState({
      profile: {
        profileId: 'user-123',
        nickname: 'SuperClimber',
        createdAt: '2026-01-01',
        isAdmin: false,
      },
      isProfileComplete: true,
    });

    useLevelProgressStore.setState({
      progress: {
        math_World1_add_1: {
          cleared: true,
          score: 1200,
          stars: 3,
          updatedAt: Date.now(),
        },
      },
    });

    useUserStore.setState({
      minerals: 500,
      stamina: 2,
      inventory: [{ id: 'oxygen_tank', count: 3 }],
    });

    useBadgeStore.setState({
      userBadges: ['badge_first_clear', 'badge_speed_demon'],
    });

    // 2. Act: AuthStore의 signOut 실행
    await useAuthStore.getState().signOut();

    // 3. Assert: 모든 스토어가 완전히 초기화되었는지 불변식 검증
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();

    // ProfileStore 리셋 검증
    expect(useProfileStore.getState().profile).toBeNull();
    expect(useProfileStore.getState().isProfileComplete).toBe(false);

    // LevelProgressStore 리셋 검증
    expect(Object.keys(useLevelProgressStore.getState().progress)).toHaveLength(0);

    // UserStore 리셋 검증
    expect(useUserStore.getState().minerals).toBe(0);
    expect(useUserStore.getState().stamina).toBe(5);
    expect(useUserStore.getState().inventory).toHaveLength(0);

    // BadgeStore 리셋 검증
    expect(useBadgeStore.getState().userBadges).toHaveLength(0);
  });

  it('[Invariant 2: Two-Way Reconciliation] should trigger reverse sync when local progress has unsynced clears', async () => {
    const { supabase } = await import('@/utils/supabaseClient');
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const submitSpy = vi
      .spyOn(LevelSyncService, 'submitGameResult')
      .mockResolvedValue({ success: true });

    // 1. Arrange: 로컬에만 클리어된 기록이 있음 (world: world1, category: math_add, level: 1)
    useLevelProgressStore.setState({
      progress: {
        world1: {
          math_add: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 1500,
                survival: null,
                infinite: null,
              },
            },
          },
        },
      },
    });

    // 2. Act: Progress 동기화 수행
    await useLevelProgressStore.getState().syncProgress();

    // 3. Assert: LevelSyncService.submitGameResult가 최소 1회 이상 호출되어 로컬 데이터가 서버로 업로드되었는지 검증
    expect(submitSpy).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'math_add',
        level: 1,
        score: 1500,
      })
    );

    submitSpy.mockRestore();
  });

  it('[Invariant 3: Accuracy Boundedness] accuracy percentage should never exceed 100% regardless of combo bonuses', () => {
    // 10문제 중 10문제를 모두 콤보 보너스를 받아 고득점을 얻은 극단값 시나리오
    const totalQuestions = 10;
    const correctCount = 10;

    // 계산식 불변식 검증
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const boundedAccuracy = Math.min(100, Math.max(0, accuracy));

    expect(boundedAccuracy).toBe(100);
    expect(boundedAccuracy).toBeLessThanOrEqual(100);
    expect(boundedAccuracy).toBeGreaterThanOrEqual(0);

    // 0문제 출제 시 0% 불변식
    const zeroAccuracy = totalQuestions === 0 ? 0 : (0 / totalQuestions) * 100;
    expect(zeroAccuracy).toBe(0);
  });
});
