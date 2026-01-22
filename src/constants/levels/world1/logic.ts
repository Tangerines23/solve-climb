export const LOGIC_LEVELS = [
  // Phase 1: 판단 (Lv 1~5) - 양자택일
  { level: 1, name: '홀수와 짝수', description: '기본 홀짝 판별' },
  { level: 2, name: '양수와 음수', description: '크기 비교 및 부호' },
  { level: 3, name: '등차수열 기초', description: '일정한 차이 찾기' }, // 디자인 문서에는 Lv 3이 '명제 참/거짓'이나 기존 앱 데이터 유지 및 통합
  { level: 4, name: '등비수열 기초', description: '일정한 비율 찾기' }, // 디자인 문서 Lv 4 '배수 판별'
  { level: 5, name: '피보나치 수열', description: '앞의 두 수의 합' }, // 디자인 문서 Lv 5 '소수 찾기'

  // Phase 2: 추론 (Lv 6~10) - 빈칸 채우기
  { level: 6, name: '소수(Prime) 판별', description: '약수가 2개인 수' },
  { level: 7, name: '나머지 연산(Mod)', description: '나눈 후의 나머지' },
  { level: 8, name: '기초 팩토리얼', description: '계승(!)의 개념' },
  { level: 9, name: '시계 규칙(각도)', description: '분침과 시침의 위치' },
  { level: 10, name: '논리 퀴즈 종합', description: '규칙 찾고 적용하기' },

  // Phase 3: 약속 (Lv 11~15) - 규칙 학습 (New Content)
  { level: 11, name: '절댓값', description: '부호 떼기 (|-5|)' },
  { level: 12, name: '나머지(Mod) 심화', description: '시계/주기성 규칙' },
  { level: 13, name: '팩토리얼 심화', description: '3! = 3 x 2 x 1' },
  { level: 14, name: '사용자 연산', description: 'A ★ B = A+B+1' },
  { level: 15, name: '논리왕', description: '전체 혼합 (보스)' },
];
