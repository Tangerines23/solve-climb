import { supabase } from './supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { useQuizStore, type TimeLimit } from '../stores/useQuizStore';
import { calculateScoreForTier } from './tierUtils';

export interface DebugAction {
  type:
    | 'reset'
    | 'setTier'
    | 'setMasteryScore'
    | 'setMinerals'
    | 'setStamina'
    | 'grantAllItems'
    | 'grantAllBadges'
    | 'setGameTime';
  target?: string; // reset 타입에서 사용 ('all' | 'score' | 'minerals' | 'tier')
  level?: number; // setTier에서 사용
  value?: number; // setMinerals, setStamina, setMasteryScore에서 사용
  quantity?: number; // grantAllItems에서 사용
  seconds?: number; // setGameTime에서 사용
}

export interface DebugPreset {
  id: string;
  name: string;
  description: string;
  actions: DebugAction[];
}

export interface PresetHistory {
  id: string;
  presetId: string;
  presetName: string;
  appliedAt: Date;
  userId: string;
  success: boolean;
  error?: string;
}

export interface CustomPreset extends DebugPreset {
  isCustom: true;
}

/**
 * 프리셋 데이터 정의
 * veteran 프리셋의 점수는 calculateScoreForTier(6, 10, 100000)로 동적으로 계산됨
 * 계산식: 250000 * 10 (stars) + 250000 (Legend minScore) + 100000 (bonus) = 2850000
 */
export const debugPresets: DebugPreset[] = [
  {
    id: 'newbie',
    name: '뉴비 세팅',
    description: '모든 데이터 초기화 + 튜토리얼 상태',
    actions: [
      { type: 'reset', target: 'all' },
      { type: 'setTier', level: 0 },
      { type: 'setMinerals', value: 0 },
      { type: 'setStamina', value: 5 },
    ],
  },
  {
    id: 'veteran',
    name: '고인물 세팅',
    description: '티어 Legend + 별 10개 + 모든 아이템 99개 + 뱃지 All Clear',
    actions: [
      { type: 'setMasteryScore', value: -1 }, // -1은 동적 계산 필요를 의미 (applyPreset에서 calculateScoreForTier로 계산)
      { type: 'setTier', level: 6 }, // Legend
      { type: 'setMinerals', value: 999999 },
      { type: 'grantAllItems', quantity: 99 },
      { type: 'grantAllBadges' },
    ],
  },
  {
    id: 'crisis',
    name: '위기 상황',
    description: '스태미나 0 + 시간 5초 남음 (엣지 케이스 테스트용)',
    actions: [
      { type: 'setStamina', value: 0 },
      { type: 'setGameTime', seconds: 5 },
    ],
  },
  {
    id: 'midgame',
    name: '중간 단계',
    description: '티어 Camp 3 + 기본 아이템',
    actions: [
      { type: 'setTier', level: 3 },
      { type: 'setMinerals', value: 10000 },
      { type: 'setStamina', value: 3 },
      { type: 'grantAllItems', quantity: 10 },
    ],
  },
];

/**
 * 개별 디버그 액션 실행
 */
export async function executeDebugAction(action: DebugAction, userId: string): Promise<void> {
  switch (action.type) {
    case 'reset': {
      const resetType = (action.target || 'all') as 'all' | 'score' | 'minerals' | 'tier';
      const { error } = await supabase.rpc('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: resetType,
      });
      if (error) throw error;
      break;
    }

    case 'setTier': {
      if (action.level === undefined) {
        throw new Error('setTier action requires level');
      }
      const { error } = await supabase.rpc('debug_set_tier', {
        p_user_id: userId,
        p_level: action.level,
      });
      if (error) throw error;
      break;
    }

    case 'setMasteryScore': {
      if (action.value === undefined) {
        throw new Error('setMasteryScore action requires value');
      }
      const { error } = await supabase.rpc('debug_set_mastery_score', {
        p_user_id: userId,
        p_score: action.value,
      });
      if (error) throw error;
      break;
    }

    case 'setMinerals': {
      if (action.value === undefined) {
        throw new Error('setMinerals action requires value');
      }
      const { setMinerals } = useUserStore.getState();
      await setMinerals(action.value);
      break;
    }

    case 'setStamina': {
      if (action.value === undefined) {
        throw new Error('setStamina action requires value');
      }
      const { setStamina } = useUserStore.getState();
      await setStamina(action.value);
      break;
    }

    case 'grantAllItems': {
      // items 테이블에서 모든 아이템 조회
      const { data: items, error: itemsError } = await supabase.from('items').select('id');

      if (itemsError) throw itemsError;

      // 배치 upsert: 한 번의 네트워크 요청으로 모든 아이템 처리
      const inventoryData = (items || []).map((item) => ({
        user_id: userId,
        item_id: item.id,
        quantity: action.quantity || 99,
      }));

      const { error: upsertError } = await supabase.from('inventory').upsert(inventoryData, {
        onConflict: 'user_id,item_id',
      });

      if (upsertError) throw upsertError;
      break;
    }

    case 'grantAllBadges': {
      // badge_definitions 테이블에서 모든 뱃지 조회
      const { data: badges, error: badgesError } = await supabase
        .from('badge_definitions')
        .select('id');

      if (badgesError) throw badgesError;

      // Promise.allSettled로 병렬 처리: 모든 뱃지를 동시에 지급 (일부 실패해도 계속 진행)
      const badgePromises = (badges || []).map((badge) =>
        supabase
          .rpc('debug_grant_badge', {
            p_user_id: userId,
            p_badge_id: badge.id,
          })
          .then(
            (result) => ({ success: true, badgeId: badge.id, result }),
            (error) => ({ success: false, badgeId: badge.id, error })
          )
      );

      const results = await Promise.allSettled(badgePromises);

      // 실패한 항목 확인 및 상세 로깅
      const failures = results
        .map((result, index) => {
          if (result.status === 'rejected') {
            return { badgeId: badges?.[index]?.id || 'unknown', error: result.reason };
          }
          if (result.status === 'fulfilled' && !result.value.success) {
            return {
              badgeId: result.value.badgeId,
              error: (result.value as { error?: unknown }).error,
            };
          }
          return null;
        })
        .filter((f): f is { badgeId: string; error: unknown } => f !== null);

      if (failures.length > 0) {
        const failedIds = failures.map((f) => f.badgeId).join(', ');
        console.warn(`${failures.length} badges failed to grant:`, failedIds, failures);
        // 일부 실패해도 계속 진행
      }
      break;
    }

    case 'setGameTime': {
      const seconds = action.seconds || 5;

      // 게임 세션이 진행 중인지 확인
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'playing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      if (session) {
        // 진행 중인 게임 세션: expires_at을 정확한 시간으로 업데이트
        const newExpiresAt = new Date(Date.now() + seconds * 1000).toISOString();

        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({ expires_at: newExpiresAt })
          .eq('id', session.id);

        if (updateError) throw updateError;
      } else {
        // 게임이 진행 중이 아닐 때: useQuizStore의 timeLimit 설정 (다음 게임 시작 시 적용)
        // TimeLimit 타입에 맞게 매핑 (10 | 15 | 60 | 120 | 180)
        const { setTimeLimit } = useQuizStore.getState();
        const mappedTime: TimeLimit =
          seconds <= 10 ? 10 : seconds <= 15 ? 15 : seconds <= 60 ? 60 : seconds <= 120 ? 120 : 180;

        setTimeLimit(mappedTime);
      }
      break;
    }

    default:
      throw new Error(`Unknown action type: ${(action as { type?: string }).type}`);
  }
}

/**
 * 프리셋 히스토리 저장
 */
const PRESET_HISTORY_KEY = 'debug_preset_history';
const MAX_HISTORY_COUNT = 50;

export function savePresetHistory(history: PresetHistory): void {
  try {
    const histories = getPresetHistories();
    histories.unshift(history);
    // 최대 개수 제한
    const limitedHistories = histories.slice(0, MAX_HISTORY_COUNT);
    localStorage.setItem(PRESET_HISTORY_KEY, JSON.stringify(limitedHistories));
  } catch (error) {
    console.error('Failed to save preset history:', error);
  }
}

export function getPresetHistories(): PresetHistory[] {
  try {
    const stored = localStorage.getItem(PRESET_HISTORY_KEY);
    if (!stored) return [];

    const histories = JSON.parse(stored) as PresetHistory[];
    // Date 객체 복원
    return histories.map((h) => ({
      ...h,
      appliedAt: new Date(h.appliedAt),
    }));
  } catch (error) {
    console.error('Failed to load preset history:', error);
    return [];
  }
}

export function clearPresetHistory(): void {
  try {
    localStorage.removeItem(PRESET_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear preset history:', error);
  }
}

/**
 * 프리셋 전체 적용
 */
export async function applyPreset(
  presetId: string,
  userId: string,
  refetch?: () => Promise<void>
): Promise<void> {
  // 기본 프리셋과 커스텀 프리셋 모두에서 찾기
  const preset =
    debugPresets.find((p) => p.id === presetId) ||
    getCustomPresets().find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }

  const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();

  // 순차적으로 액션 실행
  const executedActions: DebugAction[] = [];
  try {
    for (let i = 0; i < preset.actions.length; i++) {
      let action = preset.actions[i];

      // setMasteryScore 액션에서 value가 -1이면 동적 계산 필요
      if (action.type === 'setMasteryScore' && action.value === -1) {
        // veteran 프리셋: calculateScoreForTier(6, 10, 100000)
        if (presetId === 'veteran') {
          const calculatedScore = await calculateScoreForTier(6, 10, 100000);
          action = { ...action, value: calculatedScore };
        } else {
          throw new Error(`setMasteryScore with value -1 is only supported for veteran preset`);
        }
      }

      try {
        await executeDebugAction(action, userId);
        executedActions.push(action);
      } catch (error) {
        const actionInfo = JSON.stringify(action, null, 2);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `Failed to execute action [${i + 1}/${preset.actions.length}]: ${action.type}`,
          `\nAction details: ${actionInfo}`,
          `\nError: ${errorMessage}`
        );
        throw new Error(
          `프리셋 적용 실패: 액션 "${action.type}" (${i + 1}/${preset.actions.length}) 실행 중 오류 발생: ${errorMessage}`
        );
      }
    }

    // 상태 동기화
    const { fetchUserData } = useUserStore.getState();
    await fetchUserData();

    if (refetch) {
      await refetch();
    }

    // 성공 히스토리 저장
    savePresetHistory({
      id: historyId,
      presetId: preset.id,
      presetName: preset.name,
      appliedAt: startTime,
      userId,
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 실패 히스토리 저장
    savePresetHistory({
      id: historyId,
      presetId: preset.id,
      presetName: preset.name,
      appliedAt: startTime,
      userId,
      success: false,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * 커스텀 프리셋 관리
 */
const CUSTOM_PRESET_KEY = 'debug_custom_presets';

export function getCustomPresets(): CustomPreset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESET_KEY);
    if (!stored) return [];

    const presets = JSON.parse(stored) as CustomPreset[];
    return presets.map((p) => ({
      ...p,
      isCustom: true as const,
    }));
  } catch (error) {
    console.error('Failed to load custom presets:', error);
    return [];
  }
}

export function saveCustomPreset(preset: CustomPreset): void {
  try {
    const presets = getCustomPresets();
    const existingIndex = presets.findIndex((p) => p.id === preset.id);

    if (existingIndex >= 0) {
      // 기존 프리셋 수정
      presets[existingIndex] = preset;
    } else {
      // 새 프리셋 추가
      presets.push(preset);
    }

    localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save custom preset:', error);
    throw error;
  }
}

export function deleteCustomPreset(presetId: string): void {
  try {
    const presets = getCustomPresets();
    const filtered = presets.filter((p) => p.id !== presetId);
    localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete custom preset:', error);
    throw error;
  }
}

export function exportCustomPresets(): string {
  try {
    const presets = getCustomPresets();
    return JSON.stringify(presets, null, 2);
  } catch (error) {
    console.error('Failed to export custom presets:', error);
    throw error;
  }
}

export function importCustomPresets(json: string): void {
  try {
    const presets = JSON.parse(json) as CustomPreset[];

    // 유효성 검사
    if (!Array.isArray(presets)) {
      throw new Error('Invalid preset format: must be an array');
    }

    // 각 프리셋 검증
    for (const preset of presets) {
      if (!preset.id || !preset.name || !Array.isArray(preset.actions)) {
        throw new Error(`Invalid preset format: ${preset.id || 'unknown'}`);
      }
      // isCustom 플래그 추가
      preset.isCustom = true;
    }

    // 기존 프리셋과 병합 (id 기준으로 중복 체크)
    const existing = getCustomPresets();
    const existingIds = new Set(existing.map((p) => p.id));

    const merged = [...existing];
    for (const preset of presets) {
      if (!existingIds.has(preset.id)) {
        merged.push(preset);
      }
    }

    localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to import custom presets:', error);
    throw error;
  }
}
