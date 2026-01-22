export const BASIC_LEVELS = [
  // Phase 1: 산 입구 (Lv 1~10) - 반사신경
  { level: 1, name: '한 자릿수 덧셈', description: '10 이하의 합' },
  { level: 2, name: '한 자릿수 뺄셈', description: '0 이상의 차' },
  { level: 3, name: '받아올림 덧셈', description: '2자리 합 기초' },
  { level: 4, name: '받아내림 뺄셈', description: '2자리 차 기초' },
  { level: 5, name: '기초 구구단', description: '2~5단' },
  { level: 6, name: '심화 구구단', description: '6~9단' },
  { level: 7, name: '나눗셈 기초', description: '딱 떨어지는 나눗셈' },
  { level: 8, name: '사칙연산 혼합', description: '덧셈/뺄셈/곱셈 혼합' },
  { level: 9, name: '연산 우선순위', description: '괄호와 우선순위' },
  { level: 10, name: '소수(Decimal) 계산', description: '소수 덧셈/뺄셈' }, // 기존 10레벨 유지 또는 변경 필요? 디자인 문서에는 "0의 늪"이나, 기존 앱 데이터 유지. 기존 앱 데이터가 더 구체적이므로 유지하되, 디자인 문서의 Phase 2/3 확장 적용.
  // NOTE: 디자인 문서의 Lv 10은 "사칙연산 믹스"이나, 기존 앱의 '소수 계산'이 더 진도상 뒤에 있음.
  // 기존 앱 데이터(1~15)를 최대한 유지하면서 디자인 문서의 신규 컨셉(16~30)을 붙이는 방향으로 진행.

  // Phase 2: 중턱 (Lv 11~20) - 연산력 & 수직선
  { level: 11, name: '분수(Fraction) 기초', description: '단위 분수 계산' },
  { level: 12, name: '60진법 시각 계산', description: '시간 + 분 계산' },
  { level: 13, name: '두 자릿수 곱셈', description: '2자리 x 1자리' },
  { level: 14, name: '나눗셈 검산', description: '나머지가 있는 나눗셈' },
  { level: 15, name: '기초 산수 마스터', description: '복합 실전 문제' },

  // New Levels (16~30) based on Design Document
  { level: 16, name: '괄호의 벽', description: '2 x (3 + 4)' },
  { level: 17, name: '수직선 점프', description: '0에서 -3만큼 점프' },
  { level: 18, name: '나머지 길', description: '14 ÷ 3의 나머지' },
  { level: 19, name: '빈칸 맛보기', description: '□ + 5 = 12' },
  { level: 20, name: '정수 마스터', description: '정수 사칙연산 총정리' },

  // Phase 3: 정상 공격 (Lv 21~30) - 수의 확장
  { level: 21, name: '쪼개진 돌', description: '소수 덧셈 (0.1 + 0.2)' },
  { level: 22, name: '소수의 뺄셈', description: '소수 뺄셈 (1.5 - 0.8)' },
  { level: 23, name: '정수 만들기', description: '결과가 정수가 되는 연산' },
  { level: 24, name: '반 조각 (분수)', description: '분모가 같은 덧셈' },
  { level: 25, name: '소수/분수 믹스', description: '정수가 아닌 수 적응' },
  { level: 26, name: '피자 나누기', description: '자연수와 분수의 뺄셈' },
  { level: 27, name: '쉬운 통분', description: '배수 관계 분모 (2, 4)' },
  { level: 28, name: '작아지는 곱', description: '소수/분수 곱셈의 개념' },
  { level: 29, name: '나누기의 변신', description: '소수 나눗셈 (3 ÷ 0.5)' },
  { level: 30, name: '계산의 신', description: '정수/소수/분수 타임어택' },
];
