import packageJson from '../../package.json';
import { WORLD1_LEVELS } from '@/constants/levels';

/**
 * [ solve-climb 카테고리/주제 관리 가이드 ]
 *
 * 1. 구조 (Hierarchy):
 *    - CATEGORIES: 대분류 (~의 산). 이름, 아이콘, 테마 색상 정의.
 *    - SUB_TOPICS: 중분류 (등반로). 특정 카테고리 ID에 속하는 주제 목록.
 *    - LEVELS: 소분류 (레벨). 특정 주제 ID에 속하는 실제 퀴즈 스테이지 목록.
 *
 * 2. 확장 방법 (How to Extend):
 *    - 새로운 산 추가: CATEGORIES, SUB_TOPICS, LEVELS에 각각 새 ID로 데이터 추가.
 *    - 레벨 수정: LEVELS 객체 내의 해당 주제 배열을 수정.
 *
 * 3. 연결 제어 (Connection Control):
 *    - FEATURE_FLAGS에서 ENABLE_***_MOUNTAIN 값을 true/false로 변경하여 UI 표시 여부 결정.
 */

// 앱 설정 상수 중앙 관리
export const APP_CONFIG = {
  APP_NAME: 'Solve Climb',
  APP_VERSION: packageJson.version,

  // 기능 플래그 (Feature Flags) - 초기 백업 설정
  // 실제 제어는 useFeatureFlagStore를 사용하세요.
  FEATURE_FLAGS_DEFAULT: {
    ENABLE_MATH_MOUNTAIN: true,
    ENABLE_LANGUAGE_MOUNTAIN: false,
    ENABLE_LOGIC_MOUNTAIN: true,
    ENABLE_GENERAL_MOUNTAIN: true,
  },

  // 오늘의 챌린지 설정
  TODAY_CHALLENGE: {
    id: 'today_challenge_001',
    title: '사칙연산 스피드런!',
    category: '수학',
    topic: '덧셈',
    mode: 'time_attack',
    level: 5,
  },

  // 산 선택 (Mountain Selection - 최상위 분야)
  MOUNTAINS: [
    { id: 'math', name: '수학의 산', icon: '⛰️', color: '#10b981', disabled: false },
    {
      id: 'language',
      name: '언어의 산',
      icon: '🗾',
      color: '#f87171',
      disabled: true, // 비활성 (향후 출시 예정)
    },
  ],

  // 산 ID -> 이름 매핑
  MOUNTAIN_MAP: {
    math: '수학의 산',
    language: '언어의 산',
  },

  CATEGORIES: [
    {
      id: '기초',
      name: '기초 (Training)',
      icon: '1️⃣',
      color: '#10b981',
      symbol: '워킹\n장비 없이 가볍게 걷는 완만한 산책길',
      mountainId: 'math',
    },
    {
      id: '논리',
      name: '논리 (Brain)',
      icon: '🧩',
      color: '#3b82f6',
      symbol: '트레킹\n안전 장비가 필요한 험준한 산길',
      mountainId: 'math',
      unlockCondition: { categoryId: '기초', progress: 30 },
    },
    {
      id: '대수',
      name: '대수 (Equation)',
      icon: 'χ',
      color: '#8b5cf6',
      symbol: '릿지\n손발을 다 써서 바위를 타고 오르는 길',
      mountainId: 'math',
      unlockCondition: { categoryId: '기초', progress: 60 },
    },
    {
      id: '심화',
      name: '심화 (Expert)',
      icon: '📈',
      color: '#f59e0b',
      symbol: '암벽\n전문 클라이밍 장비로 정복하는 절벽',
      mountainId: 'math',
      unlockCondition: { categoryId: '대수', progress: 50 },
    },
    {
      id: '히라가나',
      name: '히라가나',
      icon: 'あ',
      color: '#f87171',
      symbol: 'a, i, u',
      mountainId: 'language',
    },
    {
      id: '가타카나',
      name: '가타카나',
      icon: 'ア',
      color: '#fb923c',
      symbol: 'A, I, U',
      mountainId: 'language',
    },
    {
      id: '어휘',
      name: '기초 어휘',
      icon: '📚',
      color: '#fbbf24',
      symbol: '나, 너, 우리',
      mountainId: 'language',
    },
  ] as const,

  // 호환성을 위한 하위 주제 매핑 (Mountain ID -> Categories)
  SUB_TOPICS: {
    math: [
      { id: '기초', name: '기초 (Training)', icon: '1️⃣' },
      { id: '논리', name: '논리 (Brain)', icon: '🧩' },
      { id: '대수', name: '대수 (Equation)', icon: 'χ' },
      { id: '심화', name: '심화 (Expert)', icon: '📈' },
    ],
    language: [
      { id: '히라가나', name: '히라가나 (Hiragana)', icon: 'あ' },
      { id: '가타카나', name: '가타카나 (Katakana)', icon: 'ア' },
      { id: '어휘', name: '기초 어휘 (Vocabulary)', icon: '📚' },
    ],
    logic: [],
    general: [],
  } as const,

  // 카테고리 ID -> 이름 매핑 (호환성 유지)
  CATEGORY_MAP: {
    math: '수학의 산',
    language: '언어의 산',
    기초: '기초 (Training)',
    논리: '논리 (Brain)',
    대수: '대수 (Equation)',
    심화: '심화 (Expert)',
  },

  // 월드 설정
  WORLDS: [
    {
      id: 'World1',
      name: '수와 연산',
      desc: '사칙연산의 기초부터 방정식의 논리까지, 수학적 사고의 근육을 키워보세요.',
      mountainId: 'math',
    },
    {
      id: 'World2',
      name: '도형과 공간',
      desc: '평면과 입체를 넘나들며 각도와 넓이, 피타고라스의 정리를 정복하세요.',
      mountainId: 'math',
    },
    {
      id: 'World3',
      name: '확률과 통계',
      desc: '평균부터 조합까지, 데이터 속에서 확률의 법칙과 정보를 읽어내는 힘.',
      mountainId: 'math',
    },
    {
      id: 'World4',
      name: '공학 및 응용',
      desc: '이진수와 논리 게이트로 배우는 컴퓨터 과학, 공학적 문제 해결의 첫걸음.',
      mountainId: 'math',
    },
    {
      id: 'LangWorld1',
      name: '일본어 시작',
      desc: '문자와 기본 표현',
      mountainId: 'language',
    },
  ],

  // 월드 ID -> 이름 매핑
  WORLD_MAP: {
    World1: '수와 연산',
    World2: '도형과 공간',
    World3: '확률과 통계',
    World4: '공학 및 응용',
    LangWorld1: '일본어 시작',
  },

  // 라우팅 경로
  ROUTES: {
    HOME: '/',
    CATEGORY_SELECT: '/category-select',
    SUB_CATEGORY: '/category-select', // 호환성을 위해 추가
    LEVEL_SELECT: '/level-select',
    GAME: '/quiz',
    RESULT: '/result',
    RANKING: '/ranking',
    // CHALLENGE: '/challenge', // Deprecated: 연결된 페이지 없음
    HISTORY: '/roadmap',
    MY_PAGE: '/my-page',
    NOTIFICATIONS: '/notifications',
    LOGIN: '/login',
    REVIEW: '/review',
  },

  // 레벨 데이터 정의 (World -> Category -> Levels)
  LEVELS: {
    World1: {
      ...WORLD1_LEVELS,
    },
    World2: {
      기초: [
        { level: 1, name: '기초 도형', description: '꼭짓점과 변' },
        { level: 2, name: '다각형 대각선', description: '대각선의 개수' },
        { level: 3, name: '삼각형의 성질', description: '내각의 크기' },
        { level: 4, name: '사각형의 성질', description: '평행사변형과 대각' },
        { level: 5, name: '직사각형 넓이', description: '가로 x 세로' },
        { level: 6, name: '삼각형 넓이', description: '밑변 x 높이 / 2' },
        { level: 7, name: '원의 기초', description: '반지름과 지름' },
        { level: 8, name: '원의 둘레와 넓이', description: '원주율 = 3.1 연산' },
        { level: 9, name: '대칭축 기초', description: '정다각형의 선대칭' },
        { level: 10, name: '피타고라스 기초', description: '기본 직각삼각형' },
        { level: 11, name: '피타고라스 심화', description: '확장된 직각삼각형' },
        { level: 12, name: '입체도형 기본', description: '꼭짓점, 면, 모서리' },
        { level: 13, name: '입체도형 부피', description: '직육면체와 원기둥' },
        { level: 14, name: '입체도형 겉넓이', description: '정육면체의 겉넓이' },
      ],
      논리: [],
      대수: [],
      심화: [],
    },
    World3: {
      기초: [
        { level: 1, name: '평균 구하기', description: '세 수의 평균' },
        { level: 2, name: '평균 확장', description: '네 수의 평균' },
        { level: 3, name: '중앙값 찾기', description: '크기 순서대로' },
        { level: 4, name: '최빈값 찾기', description: '가장 자주 나오는 수' },
        { level: 5, name: '동전 던지기', description: '전체 경우의 수' },
        { level: 6, name: '가위바위보', description: '가위바위보 경우의 수' },
        { level: 7, name: '주사위 던지기', description: '합의 경우의 수' },
        { level: 8, name: '대표 뽑기(조합)', description: '기초 조합' },
        { level: 9, name: '순열(나열하기)', description: '기초 순열과 팩토리얼' },
        { level: 10, name: '확률의 기초', description: '백분율 확률 환산' },
        { level: 11, name: '확률의 응용', description: '여사건의 백분율 확률' },
        { level: 12, name: '확률의 연산', description: '덧셈 및 독립사건 곱셈' },
        { level: 13, name: '범위(Range)', description: '최대값 - 최소값' },
        { level: 14, name: '비복원 경우의 수', description: '돌려놓지 않을 때의 수' },
        { level: 15, name: '비복원 결합확률', description: '비복원 연속 추출 확률' },
      ],
      논리: [],
      대수: [],
      심화: [],
    },
    World4: {
      기초: [
        { level: 1, name: '2진수 -> 10진수', description: '이진법 변환' },
        { level: 2, name: '10진수 -> 2진수', description: '이진법 역변환' },
        { level: 3, name: '16진수 기초', description: '헥사 코드 이해' },
        { level: 4, name: '논리 게이트 AND', description: '논리곱' },
        { level: 5, name: '논리 게이트 OR', description: '논리합' },
        { level: 6, name: '논리 게이트 NOT', description: '부정' },
        { level: 7, name: '논리 게이트 XOR', description: '배타적 논리합' },
        { level: 8, name: '자료구조 스택', description: 'Stack 구조 이해' },
        { level: 9, name: '자료구조 큐', description: 'Queue 구조 이해' },
        { level: 10, name: '메모리 단위 기본', description: 'Byte와 KB 환산' },
        { level: 11, name: '메모리 단위 심화', description: 'KB와 MB 환산' },
        { level: 12, name: '보수법 - 1의 보수', description: '비트 반전 연산' },
        { level: 13, name: '보수법 - 2의 보수', description: '실제 음수 비트 표현' },
        { level: 14, name: '2진수의 덧셈', description: '캐리 발생 기본 연산' },
        { level: 15, name: '이진 소수의 연산', description: '0.1 + 1.1 이진 소수 연산' },
      ],
      논리: [],
      대수: [],
      심화: [],
    },
    LangWorld1: {
      히라가나: [
        { level: 1, name: '기본 모음', description: 'あ, い, う, え, お' },
        { level: 2, name: 'K/S행', description: 'か, さ행 글자들' },
        { level: 3, name: 'T/N행', description: 'た, な행 글자들' },
        { level: 4, name: 'H/M행', description: 'は, ま행 글자들' },
        { level: 5, name: 'Y/R/W행', description: 'や, ら, わ행 글자들' },
        { level: 6, name: '탁음 기초', description: '가, 자, 다행' },
        { level: 7, name: '탁음/반탁음', description: '바, 파행' },
        { level: 8, name: '요음 기초', description: 'きゃ, しゃ 등' },
        { level: 9, name: '히라가나 믹스', description: '랜덤 글자 맞추기' },
        { level: 10, name: '히라가나 마스터', description: '모든 히라가나 출현' },
      ],
      가타카나: [
        { level: 1, name: '기본 가타카나', description: '아, 이, 우, 에, 오' },
        { level: 2, name: '가타카나 기초', description: '글자 모양 익히기' },
      ],
      어휘: [
        { level: 1, name: '기초 숫자', description: 'ichi, ni, san...' },
        { level: 2, name: '색깔 명칭', description: 'aka, ao, shiro...' },
        { level: 3, name: '인사말 기초', description: 'ohayo, konnichiwa...' },
      ],
    },
  },
} as const;
