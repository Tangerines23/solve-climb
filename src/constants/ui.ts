import { ITEM_MAP } from './items';

/**
 * UI 공통 메시지 및 이모지 정의
 */
export const UI_EMOJIS = {
  MINERAL: '💎',
  STAMINA: '🫧',
  AD: '📺',
  REWARD: '🎁',
  SUCCESS: '✨',
  ERROR: '❌',
  INFO: 'ℹ️',
  CHECK: '✅',
  BACKPACK: '🎒',
  LOCK: '🔒',
  STAR: '⭐',
  TIME: '⌛',

  // Item Emojis from centralized ITEM_MAP
  ROPE: ITEM_MAP['safety_rope']?.emoji || '🔗',
  FLARE: ITEM_MAP['flare']?.emoji || '🧨',
  OXYGEN: ITEM_MAP['oxygen_tank']?.emoji || '🧪',
  GEL: ITEM_MAP['power_gel']?.emoji || '⚡',
  FIRE: ITEM_MAP['last_spurt']?.emoji || '🔥',
};

/**
 * 상태 타입 상수 (v2.5)
 */
export const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

// Tutorial Steps (v2.5)
export const TUTORIAL_STEPS = [
  { targetId: 'quiz-display', text: '환영합니다! 지금부터 10문제를 풀어보세요.', action: 'read' },
  { targetId: 'keypad', text: '정답을 입력하고 엔터를 누르면 됩니다.', action: 'tap' },
  { targetId: 'timer-bar', text: '시간은 측정되지만 제한은 없습니다.', action: 'read' },
] as const;

export const UI_MESSAGES = {
  // Shop
  SHOP_TITLE: '마운틴 스토어',
  SHOP_TAB_STORE: '⛰️ 상점',
  SHOP_TAB_BAG: '🎒 내 배낭',
  LOADING_SHOP: '상점 물건을 진열 중...',
  PURCHASE: '구매하기',
  INSUFFICIENT_MINERALS: '미네랄이 부족합니다!',
  PURCHASE_SUCCESS: `구매 완료! ${UI_EMOJIS.BACKPACK}`,
  PURCHASE_SUCCESS_SIMULATION: `구매 완료! (시뮬레이션) ${UI_EMOJIS.SUCCESS}`,
  PURCHASE_FAILED: '구매 실패',
  LOCAL_PURCHASE_INFO: '네트워크 연결이 없어 로컬 모드로 구매되었습니다.',
  AD_LOADING: `광고를 불러오는 중... ${UI_EMOJIS.AD}`,
  FREE_MINERAL_RECHARGE: '무료 미네랄 충전',
  RECV_500_MINERALS: `광고 보고 500${UI_EMOJIS.MINERAL} 받기`,
  WATCH_AD: `${UI_EMOJIS.AD} 광고 보기`,
  AD_WATCHING: `⏳ 시청 중...`,
  AD_LOAD_FAILED: '광고 시청에 실패했습니다.',
  REWARD_EARNED: '보상을 획득했습니다!',
  DOUBLE_REWARD: '결과 보상 2배로 받기',
  REWARD_GIVING: '보상 지급 중...',
  MINERAL_RECHARGED: (amount: number) => `${amount} 미네랄이 충전되었습니다! ${UI_EMOJIS.MINERAL}`,
  MINERAL_REWARD: (amount: number, isBonus = false) =>
    isBonus
      ? `${amount} 보너스 미네랄 획득! ${UI_EMOJIS.MINERAL}`
      : `${amount} 미네랄 획득! ${UI_EMOJIS.MINERAL}`,

  // Stamina / User
  STAMINA_RECHARGED_FULL: `산소통(스태미나)이 전체 충전되었습니다! ${UI_EMOJIS.STAMINA}`,
  STAMINA_RECHARGED_SIMULATION: `산소통이 전체 충전되었습니다! (시뮬레이션)`,
  STAMINA_RECHARGE_FAILED: (msg: string) => `충전 실패: ${msg}`,
  STAMINA_REFUNDED: `첫 문제 도전 실패로 스태미나가 반환되었습니다.`,
  STAMINA_INSUFFICIENT: '산소통이 부족합니다.',

  // Quiz
  AD_WATCH_START: `광고 시청 중... ${UI_EMOJIS.AD}`,
  AD_WATCH_COMPLETE: `광고 시청 완료! 부활합니다. ${UI_EMOJIS.STAMINA}`,
  AD_WATCH_FAILED: (error?: string) => `광고 시청 실패: ${error || '잠시 후 다시 시도해주세요.'}`,
  BACK_NAV_CONFIRM: '뒤로 가려면 한 번 더 누르세요',
  LAST_SPURT: `${UI_EMOJIS.FIRE} LAST SPURT! +15s ${UI_EMOJIS.FIRE}`,
  SAFE_ROPE: 'SAFE! Rope Protected!',
  RETRY: '다시 시도',
  GIVE_UP: '그만하기',

  // Inventory
  MY_BAG: '나의 배낭',
  OWNED_COUNT: (count: number) => `보유 ${count}`,
  EMPTY_BAG: '배낭이 비어있습니다.',
  PREPARE_CLIMB: '아이템을 구매하여 등반을 준비하세요!',

  // Common Errors
  COMMON_ERROR: '오류가 발생했습니다.',
  LOGIN_REQUIRED: '로그인이 필요합니다.',

  // Roadmap & Results
  ROADMAP_TITLE: '등반 일지',
  CURRENT_ALTITUDE: '현재 고도',
  TOTAL_ALTITUDE: '누적 고도',
  NEXT_GOAL_REMAINING: '다음 목표 정상까지',
  FETCH_DATA_FAILED: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  ANALYZING: '분석 중...',
  STREAK_SUFFIX: '일째',
  ZOOM_LABEL: 'Zoom',
  LEVEL_LABEL: 'Level',
  SURVIVAL_CHALLENGE: '서바이벌 챌린지',
  RESULT_RETRY: '다시 도전하기',
  OTHER_LEVELS: '다른 레벨',
  GO_HOME: '홈으로 이동',
  RANKING_VIEW: '랭킹 보기',
  RANKING_FETCH_FAILED: '랭킹 데이터를 불러오지 못했습니다. 다시 시도해주세요.',
  REVENGE_DEATHNOTE: '데스노트 복수하기 (맞춤 재시도)',
  DIAGNOSIS_COMPLETE: '진단 완료!',
  BASE_CAMP_PREP_DONE: '베이스 캠프에서의 준비가 끝났습니다.',
  RECOMMENDED_COURSE: '추천 코스',
  COURSE_MATCH_DESC: '당신의 실력에 딱 맞는 난이도입니다.',
  START_RECOMMENDED_COURSE: '추천 코스로 등반 시작',
  RETURN_TO_WORLD: '월드로 돌아가기',
  LAST_HURDLE: '마지막 고비 💀',
  MY_WRONG_ANSWER: '내 오답',
  CORRECT_ANSWER: '정답',
  NEW_RECORD_LABEL: '최고 기록 달성',
  ACCURACY: '정확도',
  PROGRESS: '진행',
  AVERAGE_TIME: '평균 시간',
  CURRENT_RANK: '현재 순위',
  EXHAUSTED_PENALTY: '지침 상태 패널티',
  TIME_UP: '시간 종료!',
  CHALLENGE_END: '도전 종료',
  GAME_OVER: '게임 오버',
};
