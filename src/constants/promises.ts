export interface PromiseData {
  rule: string;
  example: string;
}

export const LOGIC_PROMISES: Record<number, PromiseData> = {
  11: { rule: '절댓값: 부호 떼고 크기만!', example: '|-5| = 5' },
  12: { rule: '나머지(Mod): 나눈 후 남는 조각!', example: '14 mod 3 = 2' },
  13: { rule: '팩토리얼(!): 1부터 몽땅 곱하기!', example: '3! = 3x2x1 = 6' },
  14: { rule: '사용자 연산: 기호 약속 지키기!', example: 'A ★ B = A+B+1' },
  15: { rule: '논리왕: 모든 규칙 혼합!', example: '팩토리얼 + 나머지' },
};
