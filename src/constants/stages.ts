export interface StageConfig {
  id: string;
  range: [number, number]; // [시작 레벨, 끝 레벨]
  title: string;
  desc: string;
  color: string;
  icon: string;
  bgTheme: string;
}

export const STAGE_CONFIG: StageConfig[] = [
  {
    id: 'warmup',
    range: [1, 3], // Lv 1 ~ 3
    title: '몸풀기 구간',
    desc: '가벼운 반사신경으로 시작해볼까요?',
    color: '#4ADE80', // 연한 초록 (쉬움)
    icon: '🌱', // 새싹
    bgTheme: 'sky-light',
  },
  {
    id: 'basic',
    range: [4, 6], // Lv 4 ~ 6
    title: '기초 연산',
    desc: '올림과 내림에 주의하며 올라가세요.',
    color: '#60A5FA', // 파랑 (보통)
    icon: '💧', // 물방울
    bgTheme: 'sky-medium',
  },
  {
    id: 'focus',
    range: [7, 9], // Lv 7 ~ 9
    title: '집중력 구간',
    desc: '나눗셈과 복합 연산이 등장합니다.',
    color: '#F59E0B', // 주황 (주의)
    icon: '⚡', // 번개
    bgTheme: 'sunset',
  },
  {
    id: 'wall',
    range: [10, 12], // Lv 10 ~ 12
    title: '암산의 벽',
    desc: '가장 험난한 고비입니다. 꽉 잡으세요!',
    color: '#EF4444', // 빨강 (어려움)
    icon: '🧗', // 등반가
    bgTheme: 'dark-storm',
  },
  {
    id: 'master',
    range: [13, 15], // Lv 13 ~ 15
    title: '마스터',
    desc: '정상이 눈앞입니다!',
    color: '#A855F7', // 보라 (고수)
    icon: '👑', // 왕관
    bgTheme: 'space',
  },
];

