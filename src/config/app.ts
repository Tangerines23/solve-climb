import packageJson from '../../package.json';

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
  // API 설정 (현재 사용하지 않음 - 백엔드 서버 없이 Supabase와 토스 SDK만 사용)
  // API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.solveclimb.com',

  // Deprecated: 구글 로그인 및 이메일 기반 어드민 기능 삭제됨
  // Google OAuth 설정 (googleAuth.ts 파일 삭제로 인해 사용하지 않음)
  // 방법 1: 환경변수 사용 (권장)
  // frontend 폴더에 .env 파일을 만들고 VITE_GOOGLE_CLIENT_ID=your-client-id 추가
  // 방법 2: 여기에 직접 입력 (개발용)
  // GOOGLE_CLIENT_ID: 'your-google-client-id-here',
  // GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Deprecated: 구글 로그인 및 이메일 기반 어드민 기능 삭제됨
  // 어드민 이메일 목록 (구글 로그인 이메일) - 현재 사용하지 않음
  // 실제 어드민 이메일로 변경하세요
  // ADMIN_EMAILS: [
  //   // 예시: 'admin@yourdomain.com',
  //   // 'another-admin@yourdomain.com',
  // ],

  APP_NAME: 'Solve Climb',
  APP_VERSION: packageJson.version,

  // 기능 플래그 (Feature Flags) - 산(카테고리) 활성화 상태 관리
  // 연결을 끊고 싶으면 false, 다시 연결하고 싶으면 true로 설정하세요.
  // 이 설정은 홈 화면 목록과 오늘의 챌린지 생성에 즉시 반영됩니다.
  FEATURE_FLAGS: {
    ENABLE_MATH_MOUNTAIN: true, // 수학의 산 (활성)
    ENABLE_LANGUAGE_MOUNTAIN: false, // 언어의 산 (비활성)
    ENABLE_LOGIC_MOUNTAIN: true, // 논리/상식 (활성)
    ENABLE_GENERAL_MOUNTAIN: true, // 상식 (활성)
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
    { id: 'language', name: '언어의 산', icon: '🗾', color: '#f87171', disabled: false },
  ],

  // 산 ID -> 이름 매핑
  MOUNTAIN_MAP: {
    math: '수학의 산',
    language: '언어의 산',
  },

  // 카테고리 설정 (산 내부의 4대 분야)
  CATEGORIES: [
    {
      id: '기초',
      name: '기초 (Training)',
      icon: '1️⃣',
      color: '#10b981',
      symbol: '1, 2, 3',
      mountainId: 'math',
    },
    {
      id: '논리',
      name: '논리 (Brain)',
      icon: '🧩',
      color: '#3b82f6',
      symbol: '?, O/X',
      mountainId: 'math',
      unlockCondition: { categoryId: '기초', progress: 30 },
    },
    {
      id: '대수',
      name: '대수 (Equation)',
      icon: 'χ',
      color: '#8b5cf6',
      symbol: 'x, y',
      mountainId: 'math',
      unlockCondition: { categoryId: '기초', progress: 60 },
    },
    {
      id: '심화',
      name: '심화 (Expert)',
      icon: '📈',
      color: '#f59e0b',
      symbol: 'f, ∫',
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
    { id: 'World1', name: '기초 탐험', desc: '기초 개념과 핵심 연산', mountainId: 'math' },
    { id: 'World2', name: '도형과 공간', desc: '공간 지각과 기하학', mountainId: 'math' },
    { id: 'World3', name: '확률과 통계', desc: '데이터 분석과 예측', mountainId: 'math' },
    { id: 'World4', name: '공학 및 응용', desc: '컴퓨터 과학과 신호 처리', mountainId: 'math' },
    { id: 'LangWorld1', name: '일본어 시작', desc: '문자와 기본 표현', mountainId: 'language' },
  ],

  // 월드 ID -> 이름 매핑
  WORLD_MAP: {
    World1: '수와 대수',
    World2: '도형과 공간',
    World3: '확률과 통계',
    World4: '공학 및 응용',
    LangWorld1: '일본어 시작',
  },

  // 라우팅 경로
  ROUTES: {
    HOME: '/',
    WORLD_SELECT: '/world-select',
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
  },

  // 레벨 데이터 정의 (World -> Category -> Levels)
  LEVELS: {
    World1: {
      기초: [
        { level: 1, name: '한 자릿수 덧셈', description: '10 이하의 합' },
        { level: 2, name: '한 자릿수 뺄셈', description: '0 이상의 차' },
        { level: 3, name: '받아올림 덧셈', description: '2자리 합 기초' },
        { level: 4, name: '받아내림 뺄셈', description: '2자리 차 기초' },
        { level: 5, name: '기초 구구단', description: '2~5단' },
        { level: 6, name: '심화 구구단', description: '6~9단' },
        { level: 7, name: '나눗셈 기초', description: '딱 떨어지는 나눗셈' },
        { level: 8, name: '사칙연산 혼합', description: '덧셈/뺄셈/곱셈 혼합' },
        { level: 9, name: '연산 우선순위', description: '괄호와 우선순위' },
        { level: 10, name: '소수(Decimal) 계산', description: '소수 덧셈/뺄셈' },
        { level: 11, name: '분수(Fraction) 기초', description: '단위 분수 계산' },
        { level: 12, name: '60진법 시각 계산', description: '시간 + 분 계산' },
        { level: 13, name: '두 자릿수 곱셈', description: '2자리 x 1자리' },
        { level: 14, name: '나눗셈 검산', description: '나머지가 있는 나눗셈' },
        { level: 15, name: '기초 산수 마스터', description: '복합 실전 문제' },
      ],
      논리: [
        { level: 1, name: '홀수와 짝수', description: '기본 홀짝 판별' },
        { level: 2, name: '양수와 음수', description: '크기 비교 및 부호' },
        { level: 3, name: '등차수열 기초', description: '일정한 차이 찾기' },
        { level: 4, name: '등비수열 기초', description: '일정한 비율 찾기' },
        { level: 5, name: '피보나치 수열', description: '앞의 두 수의 합' },
        { level: 6, name: '소수(Prime) 판별', description: '약수가 2개인 수' },
        { level: 7, name: '나머지 연산(Mod)', description: '나눈 후의 나머지' },
        { level: 8, name: '기초 팩토리얼', description: '계승(!)의 개념' },
        { level: 9, name: '시계 규칙(각도)', description: '분침과 시침의 위치' },
        { level: 10, name: '논리 퀴즈 종합', description: '규칙 찾고 적용하기' },
      ],
      대수: [
        { level: 1, name: '미지수 □ 채우기', description: '3 + □ = 10' },
        { level: 2, name: '미지수 x로의 전환', description: 'x - 5 = 12' },
        { level: 3, name: '일차방정식 (ax=b)', description: '계수 나누기' },
        { level: 4, name: '이항 기초', description: 'x + b = c' },
        { level: 5, name: '이항 심화', description: 'ax + b = c' },
        { level: 6, name: '비례식 기초', description: 'a:b = c:x' },
        { level: 7, name: '일차부등식', description: '범위 찾기' },
        { level: 8, name: '구조의 변형', description: '식 정리하기' },
        { level: 9, name: '연립방정식 기초', description: '두 미지수 찾기' },
        { level: 10, name: '방정식 마스터', description: '심화 방정식 풀이' },
      ],
      심화: [
        { level: 1, name: '함숫값 계산', description: 'f(a) 대입하기' },
        { level: 2, name: '지수 법칙', description: '2^n x 2^m' },
        { level: 3, name: '다항함수 미분', description: 'x^n 미분 공식' },
        { level: 4, name: '초월함수 미분', description: 'sin, cos 미분' },
        { level: 5, name: '직관적 극한', description: '무한대로 발산/수렴' },
        { level: 6, name: '부정적분 기초', description: '미분의 역연산' },
        { level: 7, name: '함수의 그래프', description: '기울기와 절편' },
        { level: 8, name: '다항함수의 극점', description: '미분하여 0인 곳' },
        { level: 9, name: '고급 응용', description: '함수와 기호 복합' },
        { level: 10, name: '수학의 끝', description: '통합 공학적 개념' },
      ],
    },
    World2: {
      기초: [
        { level: 1, name: '기초 도형', description: '꼭짓점과 변' },
        { level: 2, name: '삼각형의 성질', description: '각도와 분류' },
        { level: 3, name: '사각형의 성질', description: '평행과 대칭' },
        { level: 4, name: '직사각형 넓이', description: '가로 x 세로' },
        { level: 5, name: '삼각형 넓이', description: '밑변 x 높이 / 2' },
        { level: 6, name: '원의 기초', description: '반지름과 지름' },
        { level: 7, name: '원의 응용', description: '둘레와 넓이' },
        { level: 8, name: '입체 도형', description: '면의 개수' },
        { level: 9, name: '대칭축 기초', description: '도형의 대칭' },
        { level: 10, name: '피타고라스 기초', description: '직각삼각형의 변' },
      ],
      논리: [],
      대수: [],
      심화: [],
    },
    World3: {
      기초: [
        { level: 1, name: '평균 구하기', description: '세 수의 평균' },
        { level: 2, name: '중앙값 찾기', description: '크기 순서대로' },
        { level: 3, name: '최빈값 찾기', description: '가장 자주 나오는 수' },
        { level: 4, name: '동전 던지기', description: '경우의 수' },
        { level: 5, name: '주사위 던지기', description: '합의 경우의 수' },
        { level: 6, name: '공 뽑기', description: '주머니 속의 경우의 수' },
        { level: 7, name: '범위(Range)', description: '최대값 - 최소값' },
        { level: 8, name: '대표 뽑기(조합)', description: '기초 조합' },
        { level: 9, name: '확률의 기초', description: '0과 1 사이의 값' },
        { level: 10, name: '데이터 분석 마스터', description: '종합 응용' },
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
        { level: 8, name: '비트와 바이트', description: '단위의 이해' },
        { level: 9, name: '알고리즘 기초', description: '정렬과 탐색' },
        { level: 10, name: '공학 마스터', description: '이진법 응용' },
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
