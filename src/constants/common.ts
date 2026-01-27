/**
 * 공통 상수 정의
 * 프로젝트 전반에서 반복적으로 사용되는 매직 스트링을 관리합니다.
 */

export const STORAGE_KEYS = {
    SESSION: 'solve-climb-local-session',
    BADGES: 'solve-climb-local-badges',
} as const;

export const ERROR_MESSAGES = {
    NETWORK_FAIL: 'Failed to fetch',
    GENERIC: '오류가 발생했습니다.',
    TOSS_LOGIN_FAIL: '토스 로그인 중 오류가 발생했습니다.',
    UNKNOWN: 'UNKNOWN',
} as const;

export const RPC_ERROR_CODES = {
    PGRST202: 'PGRST202',
} as const;

export const ANALYTICS_EVENTS = {
    PURCHASE_ITEM: 'purchase_item',
    SYSTEM: 'system',
} as const;
