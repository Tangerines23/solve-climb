import { storageService, STORAGE_KEYS } from '../services';
import { type DebugPreset, type PresetHistory, type CustomPreset } from '../types/debug';

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
 * 프리셋 히스토리 저장
 */
const MAX_HISTORY_COUNT = 50;

export function savePresetHistory(history: PresetHistory): void {
  try {
    const histories = getPresetHistories();
    histories.unshift(history);
    // 최대 개수 제한
    const limitedHistories = histories.slice(0, MAX_HISTORY_COUNT);
    storageService.set(STORAGE_KEYS.DEBUG_PRESET_HISTORY, limitedHistories);
  } catch (error) {
    console.error('Failed to save preset history:', error);
  }
}

export function getPresetHistories(): PresetHistory[] {
  try {
    const histories = storageService.get<PresetHistory[]>(STORAGE_KEYS.DEBUG_PRESET_HISTORY);
    if (!histories) return [];

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
    storageService.remove(STORAGE_KEYS.DEBUG_PRESET_HISTORY);
  } catch (error) {
    console.error('Failed to clear preset history:', error);
  }
}

/**
 * 커스텀 프리셋 관리
 */

export function getCustomPresets(): CustomPreset[] {
  try {
    const presets = storageService.get<CustomPreset[]>(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS);
    if (!presets) return [];

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
      presets.splice(existingIndex, 1, preset);
    } else {
      // 새 프리셋 추가
      presets.push(preset);
    }

    storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, presets);
  } catch (error) {
    console.error('Failed to save custom preset:', error);
    throw error;
  }
}

export function deleteCustomPreset(presetId: string): void {
  try {
    const presets = getCustomPresets();
    const filtered = presets.filter((p) => p.id !== presetId);
    storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, filtered);
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

    storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, merged);
  } catch (error) {
    console.error('Failed to import custom presets:', error);
    throw error;
  }
}
