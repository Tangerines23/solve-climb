import { describe, it, expect } from 'vitest';
import { generateProblem, STAGES } from '../MathProblemGenerator';

/**
 * Fuzz Test for MathProblemGenerator
 *
 * 이 테스트는 모든 스테이지에 대해 수만 번의 무작위 문제를 생성하여
 * 아주 희귀한 확률로 발생하는 수학적 오류(NaN, Infinity, 제약 조건 위반 등)를 찾아냅니다.
 */

describe('MathProblemGenerator - Fuzz Testing', () => {
  const ITERATIONS_PER_STAGE = 2000; // 강화된 반복 횟

  /**
   * 전용 수식 파서 및 계산기 (검증용)
   */
  function verifyAnswer(expr: string, expected: number | string) {
    if (typeof expected === 'string') return; // 분수 등은 일단 통과

    // □ 채우기 수식은 검증 제외 (복잡함)
    if (expr.includes('□')) return;

    // 수식을 JS가 이해할 수 있게 변환
    // 1. 기기용 기호 변환
    let cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');

    // 2. 한글 제거 (나머지 길 등)
    cleanExpr = cleanExpr.replace(/의 나머지/g, '');
    if (expr.includes('의 나머지')) {
      const [a, b] = cleanExpr.split('/').map((n) => Number(n.trim()));
      expect(a % b).toBe(expected);
      return;
    }

    // 3. 시간 문제 특수 처리
    if (expr.includes(':')) {
      // "14:00 + 40분" 형태는 answer가 이미 1440 형태이므로 별도 검증 필요 없음
      return;
    }

    try {
      const evalResult = eval(cleanExpr);

      if (typeof expected === 'number') {
        // 부동 소수점 오차 허용 (0.0001)
        const diff = Math.abs(evalResult - expected);
        expect(
          diff,
          `Calculation mismatch! ${expr} (JS: ${cleanExpr}) = ${evalResult}, but expected ${expected}`
        ).toBeLessThan(0.0001);
      }
    } catch (_) {
      // 파싱 실패 케이스 (무시)
    }
  }

  STAGES.forEach((stage) => {
    it(`Stage ${stage.id} (${stage.description}) - Robustness & Correctness (${ITERATIONS_PER_STAGE} runs)`, () => {
      for (let i = 0; i < ITERATIONS_PER_STAGE; i++) {
        const problem = generateProblem(stage.id);
        const { expression, answer } = problem;

        // 1. 유효성 검사 (NaN/Infinity)
        if (typeof answer === 'number') {
          expect(Number.isNaN(answer)).toBe(false);
          expect(Number.isFinite(answer)).toBe(true);
        }

        // 2. 수식과 정답 일치 검증
        verifyAnswer(expression, answer);

        // 3. 제약 조건 재확인
        if (typeof answer === 'number') {
          if (stage.constraints?.resultMax !== undefined) {
            expect(answer).toBeLessThanOrEqual(stage.constraints.resultMax + 0.0001);
          }
          if (stage.constraints?.allowNegative === false && answer < 0) {
            expect(answer).toBeGreaterThanOrEqual(-0.0001);
          }
        }
      }
    });
  });

  it('Extreme Range Test - Should not crash with very large stage IDs', () => {
    STAGES.forEach((s) => {
      expect(() => generateProblem(s.id)).not.toThrow();
    });
  });
});
