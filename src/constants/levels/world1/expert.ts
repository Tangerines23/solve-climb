export const EXPERT_LEVELS = [
  // Phase 1: 함수 (Lv 1~4)
  { level: 1, name: '함숫값 계산', description: 'f(a) 대입하기' },
  { level: 2, name: '지수 법칙', description: '2^n x 2^m' },
  { level: 3, name: '다항함수 미분', description: 'x^n 미분 공식' },
  { level: 4, name: '초월함수 미분', description: 'sin, cos 미분' },

  // Phase 2: 극한 (Lv 5~7) / Phase 3: 미분 (Lv 8~12)
  { level: 5, name: '직관적 극한', description: '무한대로 발산/수렴' },
  { level: 6, name: '부정적분 기초', description: '미분의 역연산' },
  { level: 7, name: '함수의 그래프', description: '기울기와 절편' },
  { level: 8, name: '다항함수의 극점', description: '미분하여 0인 곳' },
  { level: 9, name: '고급 응용', description: '함수와 기호 복합' },
  { level: 10, name: '수학의 끝', description: '통합 공학적 개념' },

  // Phase 3 & 4 Extended (Lv 11~15) based on Design Document
  { level: 11, name: '상수 미분', description: '상수 c의 미분은 0' },
  { level: 12, name: '삼각함수 미분', description: 'sin(x) -> cos(x)' },
  { level: 13, name: '차수 올리기', description: '3x^2 -> x^3 (적분)' },
  { level: 14, name: '단순 적분', description: '2x -> x^2' },
  { level: 15, name: '미적분 마스터', description: '미분/적분 랜덤 (보스)' },
];
