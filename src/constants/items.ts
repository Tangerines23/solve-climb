export interface ItemMetadata {
  id: number;
  code: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  shortEffect: string;
  category: string;
  guideDescription: string;
  guideColor: string;
}

/**
 * 아이템 메타데이터 중앙 정의
 * - ShopPage, PreGameLobby, BackpackBottomSheet, MyPageEffectsGuide 등에서 공유
 * - DB 장애 시 fallback 데이터로도 사용
 */
export const ITEM_LIST: ItemMetadata[] = [
  {
    id: 1,
    code: 'oxygen_tank',
    name: '산소통',
    emoji: '🧪',
    price: 500,
    description: '제한 시간 +10초',
    shortEffect: '+10초',
    category: 'time',
    guideDescription: '제한 시간 10초 연장 (타임어택)',
    guideColor: 'var(--color-cyan-400)',
  },
  {
    id: 2,
    code: 'power_gel',
    name: '파워젤',
    emoji: '⚡',
    price: 300,
    description: '시작 시 모멘텀(콤보1) 활성',
    shortEffect: '시작부터 질주',
    category: 'buff',
    guideDescription: '시작 시 콤보 1단계 획득',
    guideColor: 'var(--color-yellow-400)',
  },
  {
    id: 3,
    code: 'safety_rope',
    name: '안전 로프',
    emoji: '🔗',
    price: 1000,
    description: '오답 1회 방어',
    shortEffect: '실수 1회 방어',
    category: 'defense',
    guideDescription: '오답 시 콤보 보호 및 재도전',
    guideColor: 'var(--color-yellow-400)',
  },
  {
    id: 4,
    code: 'flare',
    name: '구조 신호탄',
    emoji: '🧨',
    price: 1500,
    description: '게임 오버 시 부활',
    shortEffect: '부활 1회',
    category: 'revive',
    guideDescription: '게임 오버 시 1회 부활 (서바이벌)',
    guideColor: 'var(--color-red-400)',
  },
  {
    id: 202,
    code: 'last_spurt',
    name: '라스트 스퍼트',
    emoji: '🔥',
    price: 800,
    description: '시간 0초 시 +15초 추가 + 5초 피버',
    shortEffect: '타임어택 부활',
    category: 'trigger',
    guideDescription: '종료 시 15초 추가 연장 (타임어택)',
    guideColor: 'var(--color-teal-400)',
  },
];

/** code → 메타데이터 빠른 조회용 맵 */
export const ITEM_MAP: Record<string, ItemMetadata> = Object.fromEntries(
  ITEM_LIST.map((item) => [item.code, item])
);

/** 기존 호환용: code → emoji */
export const getItemEmoji = (code: string): string => {
  if (Object.prototype.hasOwnProperty.call(ITEM_MAP, code)) {
    return ITEM_MAP[code as keyof typeof ITEM_MAP].emoji;
  }
  return '📦';
};


