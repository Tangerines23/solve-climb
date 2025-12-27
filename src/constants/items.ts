export interface ItemMetadata {
    name: string;
    emoji: string;
    description: string;
}

export const ITEM_METADATA: Record<string, ItemMetadata> = {
    oxygen_tank: {
        name: '산소통',
        emoji: '🧪',
        description: '제한 시간 +10초',
    },
    power_gel: {
        name: '파워젤',
        emoji: '⚡',
        description: '시작 시 모멘텀(콤보1) 활성',
    },
    safety_rope: {
        name: '안전 로프',
        emoji: '🛡️',
        description: '오답 1회 방어',
    },
    flare: {
        name: '구조 신호탄',
        emoji: '🧨',
        description: '게임 오버 시 부활',
    },
    last_spurt: {
        name: '라스트 스퍼트',
        emoji: '🔥',
        description: '시간 0초 시 +15초 추가 + 5초 피버',
    },
};

export const getItemEmoji = (code: string) => ITEM_METADATA[code]?.emoji || '📦';
export const getItemName = (code: string) => ITEM_METADATA[code]?.name || '알 수 없는 아이템';
export const getItemDescription = (code: string) => ITEM_METADATA[code]?.description || '';
