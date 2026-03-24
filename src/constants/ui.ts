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
  FIRE: '🔥',
  LOCK: '🔒',
  STAR: '⭐',
  TIME: '⌛',
  ROPE: '🔗',
  FLARE: '🧨',
  OXYGEN: '🧪',
  GEL: '⚡',
};

export const UI_MESSAGES = {
  // Shop
  SHOP_TITLE: '마운틴 스토어',
  SHOP_TAB_STORE: '⛰️ 상점',
  SHOP_TAB_BAG: '🎒 내 배낭',
  INSUFFICIENT_MINERALS: '미네랄이 부족합니다!',
  PURCHASE_SUCCESS: `구매 완료! ${UI_EMOJIS.BACKPACK}`,
  PURCHASE_SUCCESS_SIMULATION: `구매 완료! (시뮬레이션) ${UI_EMOJIS.SUCCESS}`,
  PURCHASE_FAILED: '구매 실패',
  AD_LOADING: `광고를 불러오는 중... ${UI_EMOJIS.AD}`,
  FREE_MINERAL_RECHARGE: '무료 미네랄 충전',
  RECV_500_MINERALS: `광고 보고 500${UI_EMOJIS.MINERAL} 받기`,
  WATCH_AD: `${UI_EMOJIS.AD} 광고 보기`,
  AD_WATCHING: `⏳ 시청 중...`,
  MINERAL_RECHARGED: (amount: number) => `${amount} 미네랄이 충전되었습니다! ${UI_EMOJIS.MINERAL}`,
  MINERAL_REWARD: (amount: number, isBonus = false) =>
    isBonus
      ? `${amount} 보너스 미네랄 획득! ${UI_EMOJIS.MINERAL}`
      : `${amount} 미네랄 획득! ${UI_EMOJIS.MINERAL}`,

  // Stamina / User
  STAMINA_RECHARGED_FULL: `산소통(스태미나)이 전체 충전되었습니다! ${UI_EMOJIS.STAMINA}`,
  STAMINA_RECHARGED_SIMULATION: `산소통이 전체 충전되었습니다! (시뮬레이션)`,
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
};
