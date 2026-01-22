export const ALGEBRA_LEVELS = [
  // Phase 1: x의 등장 (Lv 1~10)
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

  // Phase 2: 구조의 변형 (Lv 11~15) - 이항의 물리법칙
  { level: 11, name: '상수 이항', description: 'x + 5 = 12 (+5 -> -5)' },
  { level: 12, name: '부호 변환', description: 'x - 3 = 7 (-3 -> +3)' },
  { level: 13, name: '변수 이항', description: '2x = x + 5 (x 이항)' },
  { level: 14, name: '괄호 풀기', description: '2(x+1) = 8 (분배법칙)' },
  { level: 15, name: '이항 마스터', description: '혼합 방정식 (보스)' },

  // Phase 3: 응용 (Lv 16~20)
  { level: 16, name: '비례식 심화', description: '1:2 = 3:x (내항=외항)' },
  { level: 17, name: '대입법', description: 'y=x+2, y=5 (연립 기초)' },
  { level: 18, name: '부등식 기초', description: 'x > 3 (정답: 4)' },
  { level: 19, name: '부등식 풀기', description: '2x > 10 (정답: 6)' },
  { level: 20, name: '대수왕', description: '종합 평가' },
];
