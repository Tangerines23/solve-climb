export const MAP_LAYOUT = {
  FIXED_MAX_LEVELS: 30,
  NODE_SPACING: 160,
  LIST_DISTANCE: 100,
  SCROLL_OFFSET: 60,
  SVG_WIDTH: 400,
} as const;

export interface StageConfig {
  id: string;
  range: [number, number]; // [시작 레벨, 끝 레벨]
  title: string;
  desc: string;
  color: string;
  icon: string;
  bgTheme: string;
}

// 월드별 특화 스테이지 설정
export const WORLD_STAGE_CONFIG: Record<string, StageConfig[]> = {
  World1: [
    {
      id: 'warmup',
      range: [1, 10], // Lv 1 ~ 10
      title: '산 입구 (기초)',
      desc: '가벼운 수감각과 기초 사칙연산',
      color: '#4ADE80', // 초록
      icon: '🌱',
      bgTheme: 'sky-light',
    },
    {
      id: 'basic',
      range: [11, 20], // Lv 11 ~ 20
      title: '수직선 중턱 (응용)',
      desc: '분수와 소수, 60진법 및 기초 개념 정립',
      color: '#60A5FA', // 파랑
      icon: '🧗',
      bgTheme: 'sky-medium',
    },
    {
      id: 'focus',
      range: [21, 30], // Lv 21 ~ 30
      title: '정상 공격 (심화)',
      desc: '정수와 유리수의 확장 및 종합 수 계산',
      color: '#A855F7', // 보라
      icon: '👑',
      bgTheme: 'space',
    },
  ],
  World2: [
    {
      id: 'warmup',
      range: [1, 6], // Lv 1 ~ 6
      title: '평면의 기초',
      desc: '도형의 꼭짓점, 대칭축, 내각과 넓이 기초',
      color: '#4ADE80',
      icon: '📐',
      bgTheme: 'sky-light',
    },
    {
      id: 'basic',
      range: [7, 10], // Lv 7 ~ 10
      title: '측정과 넓이',
      desc: '사다리꼴 넓이부터 원의 반지름, 둘레, 넓이 마스터',
      color: '#F59E0B',
      icon: '🧩',
      bgTheme: 'sunset',
    },
    {
      id: 'focus',
      range: [11, 15], // Lv 11 ~ 15
      title: '기하와 응용',
      desc: '대각선, 입체도형 부피부터 피타고라스와 삼각비 맛보기',
      color: '#EF4444',
      icon: '🛸',
      bgTheme: 'dark-storm',
    },
  ],
  World3: [
    {
      id: 'warmup',
      range: [1, 5], // Lv 1 ~ 5
      title: '통계의 시작',
      desc: '평균, 중앙값, 최빈값 등 대푯값 분석',
      color: '#60A5FA',
      icon: '📊',
      bgTheme: 'sky-medium',
    },
    {
      id: 'basic',
      range: [6, 10], // Lv 6 ~ 10
      title: '경우의 수',
      desc: '나열하기와 조합, 기초 확률의 경우의 수',
      color: '#F59E0B',
      icon: '🎲',
      bgTheme: 'sunset',
    },
    {
      id: 'focus',
      range: [11, 15], // Lv 11 ~ 15
      title: '확률의 법칙',
      desc: '백분율 확률, 복원/비복원 추출 및 결합 확률',
      color: '#A855F7',
      icon: '🃏',
      bgTheme: 'space',
    },
  ],
  World4: [
    {
      id: 'warmup',
      range: [1, 3], // Lv 1 ~ 3
      title: '디지털 기초',
      desc: '2진수, 16진수 및 데이터 진법 기초',
      color: '#60A5FA',
      icon: '💻',
      bgTheme: 'sky-medium',
    },
    {
      id: 'basic',
      range: [4, 7], // Lv 4 ~ 7
      title: '논리 게이트',
      desc: 'AND, OR, NOT, XOR 논리 연산의 구조',
      color: '#F59E0B',
      icon: '🔌',
      bgTheme: 'sunset',
    },
    {
      id: 'focus',
      range: [8, 15], // Lv 8 ~ 15
      title: '자료와 보수',
      desc: '자료구조(스택, 큐) 및 컴퓨터의 정수/소수 연산',
      color: '#EF4444',
      icon: '💾',
      bgTheme: 'dark-storm',
    },
  ],
  LangWorld1: [
    {
      id: 'warmup',
      range: [1, 5],
      title: '기본 50음도',
      desc: '히라가나/가타카나 글자 익히기',
      color: '#4ADE80',
      icon: '🎌',
      bgTheme: 'sky-light',
    },
    {
      id: 'basic',
      range: [6, 8],
      title: '탁음과 요음',
      desc: '일본어 특수 발음 훈련',
      color: '#F59E0B',
      icon: '🗣️',
      bgTheme: 'sunset',
    },
    {
      id: 'focus',
      range: [9, 10],
      title: '종합 완성',
      desc: '기초 어휘 및 문장 매칭',
      color: '#A855F7',
      icon: '🏆',
      bgTheme: 'space',
    },
  ],
};

// 호환성용 기존 STAGE_CONFIG (World1 기준)
export const STAGE_CONFIG: StageConfig[] = WORLD_STAGE_CONFIG.World1;

export function getStagesForWorld(world: string | undefined): StageConfig[] {
  if (!world) return STAGE_CONFIG;
  return WORLD_STAGE_CONFIG[world] || STAGE_CONFIG;
}
