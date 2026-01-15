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
    ENABLE_LANGUAGE_MOUNTAIN: false, // 언어의 산 (준비 중 - 비활성)
    ENABLE_LOGIC_MOUNTAIN: false, // 논리/상식 (준비 중 - 비활성)
    ENABLE_GENERAL_MOUNTAIN: false, // 상식 (준비 중 - 비활성)
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
  ],

  // 산 ID -> 이름 매핑
  MOUNTAIN_MAP: {
    math: '수학의 산',
    language: '언어의 산',
  },

  // 카테고리 설정 (산 내부의 4대 분야)
  CATEGORIES: [
    { id: '기초', name: '기초 (Training)', icon: '1️⃣', color: '#10b981', symbol: '1, 2, 3' },
    { id: '논리', name: '논리 (Brain)', icon: '🧩', color: '#3b82f6', symbol: '?, O/X' },
    { id: '대수', name: '대수 (Equation)', icon: 'χ', color: '#8b5cf6', symbol: 'x, y' },
    { id: '심화', name: '심화 (Expert)', icon: '📈', color: '#f59e0b', symbol: 'f, ∫' },
  ] as const,

  // 호환성을 위한 하위 주제 매핑 (Mountain ID -> Categories)
  SUB_TOPICS: {
    math: [
      { id: '기초', name: '기초 (Training)', icon: '1️⃣' },
      { id: '논리', name: '논리 (Brain)', icon: '🧩' },
      { id: '대수', name: '대수 (Equation)', icon: 'χ' },
      { id: '심화', name: '심화 (Expert)', icon: '📈' },
    ],
    language: [],
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
    { id: 'World1', name: '수와 대수', desc: '수의 확장과 기초 방정식' },
    { id: 'World2', name: '도형과 공간', desc: '공간 지각과 기하학' },
    { id: 'World3', name: '확률과 통계', desc: '데이터 분석과 예측' },
    { id: 'World4', name: '공학 및 응용', desc: '컴퓨터 과학과 신호 처리' },
  ],

  // 월드 ID -> 이름 매핑
  WORLD_MAP: {
    World1: '수와 대수',
    World2: '도형과 공간',
    World3: '확률과 통계',
    World4: '공학 및 응용',
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
    CHALLENGE: '/challenge',
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
  },
} as const;
