export const EXPERT_LEVELS = [
  // Phase 1: 함수 (Lv 1~5)
  { level: 1, name: '1사분면 좌표 조준', description: '좌표 평면 조준 사격 (1사분면)' },
  { level: 2, name: '사분면 좌표 조준', description: '전 사분면 좌표 조준 사격' },
  { level: 3, name: '함숫값 - 덧셈', description: 'f(x) = x + a 값 구하기' },
  { level: 4, name: '함숫값 - 제곱', description: 'f(x) = x² 값 구하기' },
  { level: 5, name: '함숫값 믹스', description: '다양한 함숫값 대입 계산' },

  // Phase 2: 극한 (Lv 6~8) / Phase 3: 미분 (Lv 9~12)
  { level: 6, name: '무한대 발산', description: 'x + 1 (x → ∞)의 극한값' },
  { level: 7, name: '영(0)으로 수렴', description: '1 / x (x → ∞)의 극한값' },
  { level: 8, name: '기울기의 극한', description: '2x / x (x → ∞)의 극한값' },
  { level: 9, name: '다항함수 미분', description: 'd/dx(xⁿ) 미분 연산' },
  { level: 10, name: '미분과 계수', description: 'd/dx(axⁿ) 미분 연산' },

  // Phase 3 & 4 Extended (Lv 11~15)
  { level: 11, name: '일차식 미분', description: 'd/dx(ax) 선형 미분' },
  { level: 12, name: '상수 미분', description: 'd/dx(c) 상수의 미분' },
  { level: 13, name: '차수 올리기 (적분)', description: '∫ (n+1)xⁿ dx 부정적분' },
  { level: 14, name: '단순 적분', description: '∫ a dx 상수의 부정적분' },
  { level: 15, name: '미적분 마스터', description: '기초 미분/적분 종합 평가' },
];
