import packageJson from '../../package.json';

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

  // 앱 정보
  APP_NAME: 'Solve Climb',
  APP_VERSION: packageJson.version,

  // 오늘의 챌린지 설정
  TODAY_CHALLENGE: {
    id: 'today_challenge_001',
    title: '사칙연산 스피드런!',
    category: '수학',
    topic: '덧셈',
    mode: 'time_attack',
    level: 5,
  },

  // 카테고리 설정
  CATEGORIES: [
    {
      id: 'math',
      name: '수학의 산',
      icon: '➕',
      totalLevels: 20,
    },
    {
      id: 'language',
      name: '언어의 산',
      icon: 'あ',
      totalLevels: 20,
    },
    {
      id: 'logic',
      name: '미지의 산',
      icon: '?',
      totalLevels: 15,
    },
    {
      id: 'general',
      name: '미지의 산',
      icon: '?',
      totalLevels: 20,
    },
  ],

  // 라우팅 경로
  ROUTES: {
    HOME: '/',
    SUB_CATEGORY: '/subcategory',
    LEVEL_SELECT: '/level-select',
    GAME: '/quiz',
    RESULT: '/result',
    RANKING: '/ranking',
    CHALLENGE: '/challenge',
    HISTORY: '/challenge',
    MY_PAGE: '/my-page',
    NOTIFICATIONS: '/notifications',
  },

  // 카테고리 ID 매핑
  CATEGORY_MAP: {
    math: '수학',
    language: '언어',
    logic: '논리',
    general: '상식',
  },

  // 하위 주제 목록 (SUB_TOPICS)
  SUB_TOPICS: {
    math: [
      { id: 'arithmetic', name: '사칙연산', desc: '덧셈, 뺄셈, 곱셈, 나눗셈', icon: '➕' },
      { id: 'equations', name: '방정식', desc: '미지수 X의 값을 찾아보세요', icon: 'x' },
      { id: 'sequence', name: '수열', desc: '규칙을 찾아 다음 수를 맞춰보세요', icon: '🔢' },
      { id: 'calculus', name: '미적분', desc: '미분과 적분을 배워보세요', icon: '∫' },
    ],
    language: [
      { id: 'japanese', name: '일본어', desc: '히라가나, 가타카나, 한자 학습', icon: 'あ' },
      { id: 'english', name: '영어', desc: '기초 영단어, 문법, 회화', icon: 'A' },
      { id: 'korean', name: '한글', desc: '맞춤법, 띄어쓰기, 문법', icon: '한' },
      { id: 'chinese', name: '중국어', desc: '한자, 병음, 회화', icon: '中' },
    ],
    logic: [
      { id: 'sequence', name: '수열', desc: '규칙을 찾아보세요', icon: '🔢' },
      { id: 'pattern', name: '패턴', desc: '반복되는 패턴을 발견하세요', icon: '🔁' },
      { id: 'reasoning', name: '추론', desc: '논리적으로 생각해보세요', icon: '💭' },
    ],
    general: [
      { id: 'history', name: '역사', desc: '한국사, 세계사를 알아보세요', icon: '📜' },
      { id: 'science', name: '과학', desc: '자연과학의 원리를 배워보세요', icon: '🔬' },
      { id: 'geography', name: '지리', desc: '나라와 도시를 알아보세요', icon: '🌍' },
      { id: 'culture', name: '문화', desc: '다양한 문화를 탐험해보세요', icon: '🎭' },
    ],
  },

  // 레벨 데이터 정의 (각 서브토픽별 레벨 목록)
  LEVELS: {
    math: {
      arithmetic: [
        // World 1: Warm-up
        { level: 1, name: '한 자리 덧셈', description: '결과가 10 이하' },
        { level: 2, name: '한 자리 뺄셈', description: '결과가 0 이상' },
        { level: 3, name: '덧셈과 뺄셈', description: '한 자리 수 혼합' },
        // World 2: Basics
        { level: 4, name: '받아올림 덧셈', description: '1자리 + 1자리 = 2자리' },
        { level: 5, name: '받아내림 뺄셈', description: '2자리 - 1자리 = 1자리' },
        { level: 6, name: '연속 계산', description: '2자리와 1자리 혼합' },
        // World 3: Expansion
        { level: 7, name: '기초 곱셈', description: '구구단 2~5단' },
        { level: 8, name: '심화 곱셈', description: '구구단 6~9단' },
        { level: 9, name: '딱 떨어지는 나눗셈', description: '나머지가 없는 나눗셈' },
        // World 4: Skill
        { level: 10, name: '두 자리 연산', description: '두 자리 수 덧셈/뺄셈' },
        { level: 11, name: '세 수의 연산', description: '세 개의 숫자 계산' },
        { level: 12, name: '두 자리 곱셈', description: '2자리 × 1자리' },
        // World 5: Master
        { level: 13, name: '혼합 계산', description: '사칙연산 우선순위' },
        { level: 14, name: '빈칸 채우기', description: '□ 안에 들어갈 수는?' },
        { level: 15, name: '괄호 계산', description: '괄호가 포함된 식' },
      ],
      equations: [
        { level: 1, name: '직관 덧셈', description: '? + 3 = 8' },
        { level: 2, name: '직관 뺄셈', description: '? - 5 = 10' },
        { level: 3, name: '순서 함정', description: '10 - ? = 3' },
        { level: 4, name: '이항 기초 +', description: 'x + 5 = 12' },
        { level: 5, name: '이항 기초 -', description: 'x - 7 = 15' },
        { level: 6, name: '거울 모드', description: '20 = x + 8' },
        { level: 7, name: '계수 나누기', description: '3x = 21' },
        { level: 8, name: '분수 꼴', description: 'x ÷ 4 = 5' },
        { level: 9, name: '음수 계수', description: '-x = -5' },
        { level: 10, name: '2단계 표준', description: '2x + 4 = 14' },
        { level: 11, name: '2단계 뺄셈', description: '3x - 5 = 16' },
        { level: 12, name: '큰 수 도전', description: '5x + 20 = 120' },
        { level: 13, name: '양변 x', description: '3x = x + 10' },
        { level: 14, name: '괄호 분배', description: '2(x + 3) = 16' },
        { level: 15, name: '혼합 보스', description: '3x + 5 = 2x + 10' },
      ],
      sequence: [
        { level: 1, name: '등차수열 기초', description: '1, 3, 5, 7...' },
        { level: 2, name: '등차수열', description: '복잡한 등차수열' },
        { level: 3, name: '등비수열 기초', description: '2, 4, 8, 16...' },
        { level: 4, name: '등비수열', description: '복잡한 등비수열' },
        { level: 5, name: '피보나치 수열', description: '1, 1, 2, 3, 5...' },
        { level: 6, name: '계차수열', description: '차이가 변하는 수열' },
        { level: 7, name: '조화수열', description: '역수가 등차수열' },
        { level: 8, name: '수열의 합', description: '수열의 합 구하기' },
        { level: 9, name: '고급 수열', description: '복잡한 규칙 찾기' },
        { level: 10, name: '수열 종합', description: '다양한 수열 종합' },
      ],
      calculus: [
        { level: 1, name: '기초 미분', description: 'xⁿ의 미분' },
        { level: 2, name: '상수배 미분', description: 'axⁿ의 미분' },
        { level: 3, name: '합과 차의 미분', description: 'f(x) ± g(x)의 미분' },
        { level: 4, name: '곱의 미분', description: 'f(x)·g(x)의 미분' },
        { level: 5, name: '몫의 미분', description: 'f(x)/g(x)의 미분' },
        { level: 6, name: '합성함수 미분', description: 'f(g(x))의 미분' },
        { level: 7, name: '삼각함수 미분', description: 'sin(x), cos(x)의 미분' },
        { level: 8, name: '지수·로그 미분', description: 'eˣ, ln(x)의 미분' },
        { level: 9, name: '고급 미분', description: '복잡한 함수의 미분' },
        { level: 10, name: '미분 종합', description: '다양한 미분 종합' },
      ],
    },
    language: {
      japanese: [
        { level: 1, name: '기본 모음', description: 'あ, い, う, え, お' },
        { level: 2, name: 'K행', description: 'か, き, く, け, こ' },
        { level: 3, name: 'S행', description: 'さ, し, す, せ, そ' },
        { level: 4, name: 'T행', description: 'た, ち, つ, て, と' },
        { level: 5, name: 'N행', description: 'な, に, ぬ, ね, の' },
        { level: 6, name: 'H행', description: 'は, ひ, ふ, へ, ほ' },
        { level: 7, name: 'M행', description: 'ま, み, む, め, も' },
        { level: 8, name: 'Y행', description: 'や, ゆ, よ' },
        { level: 9, name: 'R행', description: 'ら, り, る, れ, ろ' },
        { level: 10, name: '히라가나 종합', description: '전체 히라가나' },
      ],
      english: [
        { level: 1, name: '기초 단어', description: 'Apple, Book, Cat' },
        { level: 2, name: '일상 단어', description: 'Hello, World, Friend' },
        { level: 3, name: '동물', description: 'Dog, Cat, Bird' },
        { level: 4, name: '색깔', description: 'Red, Blue, Green' },
        { level: 5, name: '숫자', description: 'One, Two, Three' },
        { level: 6, name: '가족', description: 'Father, Mother, Sister' },
        { level: 7, name: '음식', description: 'Food, Water, Bread' },
        { level: 8, name: '학교', description: 'School, Teacher, Student' },
        { level: 9, name: '감정', description: 'Happy, Sad, Angry' },
        { level: 10, name: '영단어 종합', description: '다양한 단어 종합' },
      ],
      korean: [
        { level: 1, name: '기본 맞춤법', description: '기초 띄어쓰기' },
        { level: 2, name: '띄어쓰기', description: '띄어쓰기 규칙' },
        { level: 3, name: '받침 규칙', description: '받침 사용법' },
        { level: 4, name: '어미 변화', description: '어미 활용' },
        { level: 5, name: '높임말', description: '존댓말과 반말' },
        { level: 6, name: '띄어쓰기 심화', description: '복잡한 띄어쓰기' },
        { level: 7, name: '맞춤법 심화', description: '어려운 맞춤법' },
        { level: 8, name: '문장 구조', description: '문장 구성' },
        { level: 9, name: '표준어', description: '표준어 규칙' },
        { level: 10, name: '한글 종합', description: '맞춤법 종합' },
      ],
      chinese: [
        { level: 1, name: '기본 한자', description: '一, 二, 三, 四, 五' },
        { level: 2, name: '일상 한자', description: '人, 大, 小, 中, 国' },
        { level: 3, name: '가족 한자', description: '父, 母, 子, 女, 兄' },
        { level: 4, name: '시간 한자', description: '年, 月, 日, 時, 分' },
        { level: 5, name: '방향 한자', description: '東, 西, 南, 北, 中' },
        { level: 6, name: '자연 한자', description: '山, 水, 火, 木, 金' },
        { level: 7, name: '색깔 한자', description: '紅, 藍, 綠, 白, 黑' },
        { level: 8, name: '숫자 한자', description: '十, 百, 千, 萬, 億' },
        { level: 9, name: '고급 한자', description: '복잡한 한자 학습' },
        { level: 10, name: '중국어 종합', description: '다양한 한자 종합' },
      ],
    },
    logic: {
      sequence: [
        { level: 1, name: '기본 패턴', description: '간단한 규칙 찾기' },
        { level: 2, name: '숫자 패턴', description: '숫자 규칙' },
        { level: 3, name: '도형 패턴', description: '도형 규칙' },
        { level: 4, name: '색깔 패턴', description: '색깔 규칙' },
        { level: 5, name: '복잡한 패턴', description: '여러 규칙 혼합' },
        { level: 6, name: '시간 패턴', description: '시간 순서' },
        { level: 7, name: '공간 패턴', description: '위치 규칙' },
        { level: 8, name: '고급 패턴', description: '복잡한 규칙' },
        { level: 9, name: '추상 패턴', description: '추상적 규칙' },
        { level: 10, name: '패턴 종합', description: '다양한 패턴 종합' },
      ],
      pattern: [
        { level: 1, name: '반복 패턴', description: '반복되는 패턴' },
        { level: 2, name: '대칭 패턴', description: '대칭 구조' },
        { level: 3, name: '증가 패턴', description: '점점 커지는 패턴' },
        { level: 4, name: '감소 패턴', description: '점점 작아지는 패턴' },
        { level: 5, name: '교차 패턴', description: '교차되는 패턴' },
        { level: 6, name: '순환 패턴', description: '순환하는 패턴' },
        { level: 7, name: '조합 패턴', description: '여러 패턴 조합' },
        { level: 8, name: '변형 패턴', description: '변형된 패턴' },
        { level: 9, name: '고급 조합', description: '복잡한 조합' },
        { level: 10, name: '패턴 마스터', description: '패턴 종합' },
      ],
      reasoning: [
        { level: 1, name: '기본 추론', description: '간단한 논리 추론' },
        { level: 2, name: '연역 추론', description: '일반에서 특수로' },
        { level: 3, name: '귀납 추론', description: '특수에서 일반으로' },
        { level: 4, name: '유추 추론', description: '비슷한 것 비교' },
        { level: 5, name: '인과 추론', description: '원인과 결과' },
        { level: 6, name: '가정 추론', description: '가정 설정' },
        { level: 7, name: '모순 추론', description: '모순 찾기' },
        { level: 8, name: '복합 추론', description: '여러 추론 혼합' },
        { level: 9, name: '고급 추론', description: '복잡한 추론' },
        { level: 10, name: '추론 마스터', description: '추론 종합' },
      ],
    },
    general: {
      history: [
        { level: 1, name: '고대사', description: '고대 한국사' },
        { level: 2, name: '삼국시대', description: '고구려, 백제, 신라' },
        { level: 3, name: '고려시대', description: '고려 왕조' },
        { level: 4, name: '조선시대', description: '조선 왕조' },
        { level: 5, name: '근대사', description: '개항과 근대화' },
        { level: 6, name: '현대사', description: '현대 한국사' },
        { level: 7, name: '세계 고대사', description: '고대 세계사' },
        { level: 8, name: '세계 중세사', description: '중세 세계사' },
        { level: 9, name: '세계 근현대사', description: '근현대 세계사' },
        { level: 10, name: '역사 종합', description: '역사 종합' },
      ],
      science: [
        { level: 1, name: '물리 기초', description: '기본 물리 법칙' },
        { level: 2, name: '화학 기초', description: '원소와 화합물' },
        { level: 3, name: '생물 기초', description: '생명체의 구조' },
        { level: 4, name: '지구과학', description: '지구와 우주' },
        { level: 5, name: '물리 심화', description: '고급 물리' },
        { level: 6, name: '화학 심화', description: '고급 화학' },
        { level: 7, name: '생물 심화', description: '고급 생물' },
        { level: 8, name: '과학 실험', description: '실험 원리' },
        { level: 9, name: '과학 이론', description: '과학 이론' },
        { level: 10, name: '과학 종합', description: '과학 종합' },
      ],
      geography: [
        { level: 1, name: '한국 지리', description: '한국의 지형' },
        { level: 2, name: '아시아', description: '아시아 국가들' },
        { level: 3, name: '유럽', description: '유럽 국가들' },
        { level: 4, name: '아메리카', description: '북미와 남미' },
        { level: 5, name: '아프리카', description: '아프리카 대륙' },
        { level: 6, name: '오세아니아', description: '오세아니아 지역' },
        { level: 7, name: '도시', description: '주요 도시들' },
        { level: 8, name: '자연 지형', description: '산, 강, 바다' },
        { level: 9, name: '기후', description: '기후와 날씨' },
        { level: 10, name: '지리 종합', description: '지리 종합' },
      ],
      culture: [
        { level: 1, name: '한국 문화', description: '한국의 전통 문화' },
        { level: 2, name: '음악', description: '세계 음악' },
        { level: 3, name: '미술', description: '회화와 조각' },
        { level: 4, name: '문학', description: '세계 문학' },
        { level: 5, name: '영화', description: '영화와 영상' },
        { level: 6, name: '요리', description: '세계 요리' },
        { level: 7, name: '축제', description: '세계 축제' },
        { level: 8, name: '종교', description: '세계 종교' },
        { level: 9, name: '풍습', description: '전통 풍습' },
        { level: 10, name: '문화 종합', description: '문화 종합' },
      ],
    },
  },
} as const;
