export const BADGE_DEFINITIONS = [
  // 1. 성장형 (누적 고도)
  {
    id: 'altitude_1',
    name: '첫 걸음',
    description: '누적 고도 1m를 달성하세요.',
    emoji: '⛰️',
    goalAltitude: 1,
  },
  {
    id: 'altitude_100',
    name: '워밍업',
    description: '누적 고도 100m를 돌파하세요.',
    emoji: '🚠',
    goalAltitude: 100,
  },
  {
    id: 'altitude_1000',
    name: '구름 위로',
    description: '누적 고도 1,000m를 돌파하세요.',
    emoji: '☁️',
    goalAltitude: 1000,
  },
  {
    id: 'altitude_8848',
    name: '에베레스트',
    description: '누적 고도 8,848m(에베레스트 높이)를 돌파하세요.',
    emoji: '🏔️',
    goalAltitude: 8848,
  },
  {
    id: 'altitude_space',
    name: '우주로',
    description: '누적 고도 100km(성층권)를 돌파하세요.',
    emoji: '🚀',
    goalAltitude: 100000,
  },

  // 2. 끈기형 (스트릭)
  {
    id: 'streak_3',
    name: '작심삼일 탈출',
    description: '3일 연속으로 게임에 접속하세요.',
    emoji: '🔥',
    goalStreak: 3,
  },
  {
    id: 'streak_7',
    name: '주간 등반가',
    description: '7일 연속으로 게임에 접속하세요.',
    emoji: '🗓️',
    goalStreak: 7,
  },

  // 3. 실력형 (정확도/모드) - *Checking logic needs granular session data, keeping simple for now*
  /*
   * Note: These require per-game checking.
   * Current passive check in RoadmapPage can covers aggregate stats.
   * We will implement these partially or mark them as "Coming Soon" if stats are missing.
   * 'totalCorrect' is available in history stats.
   */
  {
    id: 'accuracy_master',
    name: '정확도 마스터',
    description: '평균 정확도 90% 이상을 유지하세요 (최소 10게임).',
    emoji: '🎯',
    minGames: 10,
    minAccuracy: 90,
  },

  // 4. 분야별 마스터 (Subject Master)
  // 4. 분야별 마스터 (Subject Master)
  {
    id: 'master_arithmetic_god',
    name: '사칙연산의 신',
    description: '사칙연산 레벨 15 (최종 보스)를 정복하세요.',
    emoji: '👑',
    goalThemePart: 'arithmetic',
    goalLevel: 15,
  },
];
