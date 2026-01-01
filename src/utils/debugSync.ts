import { supabase } from './supabaseClient';
import { calculateTier } from '../constants/tiers';

export interface SyncResult {
  profile: { synced: boolean; issues: string[] };
  tier: { synced: boolean; issues: string[] };
  badges: { synced: boolean; issues: string[] };
  inventory: { synced: boolean; issues: string[] };
}

/**
 * 프로필 데이터 동기화 검증
 * - total_mastery_score와 실제 게임 기록 합계 일치 여부 확인
 */
async function verifyProfileSync(userId: string): Promise<{ synced: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // 프로필에서 total_mastery_score 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_mastery_score')
      .eq('id', userId)
      .single();

    if (profileError) {
      issues.push(`프로필 조회 실패: ${profileError.message}`);
      return { synced: false, issues };
    }

    // 실제 게임 기록 합계 계산
    const { data: gameRecords, error: recordsError } = await supabase
      .from('game_results')
      .select('mastery_score')
      .eq('user_id', userId);

    if (recordsError) {
      issues.push(`게임 기록 조회 실패: ${recordsError.message}`);
      return { synced: false, issues };
    }

    const calculatedScore = (gameRecords || []).reduce(
      (sum, record) => sum + (record.mastery_score || 0),
      0
    );
    const profileScore = profile?.total_mastery_score || 0;

    if (Math.abs(calculatedScore - profileScore) > 0.01) {
      issues.push(
        `점수 불일치: 프로필 점수(${profileScore.toLocaleString()}) vs 계산된 점수(${calculatedScore.toLocaleString()})`
      );
    }

    return {
      synced: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`검증 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    return { synced: false, issues };
  }
}

/**
 * 티어 데이터 동기화 검증
 * - current_tier_level과 total_mastery_score로 계산한 티어 일치 여부 확인
 */
async function verifyTierSync(userId: string): Promise<{ synced: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // 프로필에서 티어 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_tier_level, total_mastery_score')
      .eq('id', userId)
      .single();

    if (profileError) {
      issues.push(`프로필 조회 실패: ${profileError.message}`);
      return { synced: false, issues };
    }

    const profileTier = profile?.current_tier_level || 0;
    const profileScore = profile?.total_mastery_score || 0;

    // 점수로부터 티어 계산
    const calculatedTier = await calculateTier(profileScore);

    if (calculatedTier.level !== profileTier) {
      issues.push(
        `티어 불일치: 프로필 티어(${profileTier}) vs 계산된 티어(${calculatedTier.level}) (점수: ${profileScore.toLocaleString()})`
      );
    }

    return {
      synced: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`검증 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    return { synced: false, issues };
  }
}

/**
 * 뱃지 데이터 동기화 검증
 * - user_badges와 badge_definitions 일치 여부 확인
 */
async function verifyBadgesSync(userId: string): Promise<{ synced: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // 사용자 뱃지 조회
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    if (badgesError) {
      issues.push(`뱃지 조회 실패: ${badgesError.message}`);
      return { synced: false, issues };
    }

    const badgeIds = new Set((userBadges || []).map((b) => b.badge_id));

    // 뱃지 정의 조회
    const { data: badgeDefinitions, error: defError } = await supabase
      .from('badge_definitions')
      .select('id');

    if (defError) {
      issues.push(`뱃지 정의 조회 실패: ${defError.message}`);
      return { synced: false, issues };
    }

    const definedIds = new Set((badgeDefinitions || []).map((b) => b.id));

    // 사용자가 가지고 있는 뱃지 중 정의에 없는 뱃지 확인
    for (const badgeId of badgeIds) {
      if (!definedIds.has(badgeId)) {
        issues.push(`정의되지 않은 뱃지: ${badgeId}`);
      }
    }

    return {
      synced: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`검증 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    return { synced: false, issues };
  }
}

/**
 * 인벤토리 데이터 동기화 검증
 * - inventory와 items 일치 여부 확인
 */
async function verifyInventorySync(userId: string): Promise<{ synced: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // 사용자 인벤토리 조회
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('item_id, quantity')
      .eq('user_id', userId);

    if (inventoryError) {
      issues.push(`인벤토리 조회 실패: ${inventoryError.message}`);
      return { synced: false, issues };
    }

    // 아이템 정의 조회
    const { data: items, error: itemsError } = await supabase.from('items').select('id');

    if (itemsError) {
      issues.push(`아이템 정의 조회 실패: ${itemsError.message}`);
      return { synced: false, issues };
    }

    const itemIds = new Set((items || []).map((i) => i.id));

    // 인벤토리에 있는 아이템 중 정의에 없는 아이템 확인
    for (const invItem of inventory || []) {
      if (!itemIds.has(invItem.item_id)) {
        issues.push(`정의되지 않은 아이템: ${invItem.item_id}`);
      }
      if (invItem.quantity < 0) {
        issues.push(`음수 수량 아이템: ${invItem.item_id} (${invItem.quantity})`);
      }
    }

    return {
      synced: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`검증 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    return { synced: false, issues };
  }
}

/**
 * 전체 동기화 검증
 */
export async function verifySync(userId: string): Promise<SyncResult> {
  const [profile, tier, badges, inventory] = await Promise.all([
    verifyProfileSync(userId),
    verifyTierSync(userId),
    verifyBadgesSync(userId),
    verifyInventorySync(userId),
  ]);

  return {
    profile,
    tier,
    badges,
    inventory,
  };
}
