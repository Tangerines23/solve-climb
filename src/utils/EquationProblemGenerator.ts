/**
 * EquationProblemGenerator
 *
 * 15단계 난이도 기반 선형 방정식 문제 생성기
 * 핵심: 해 x는 항상 정수여야 함 (분수/소수 불가)
 * 전략: 역공학 방식 - 답(x)을 먼저 선택하고, 계수/상수를 생성한 후 결과값 계산
 */

export interface EquationStageConfig {
  id: number;
  world: number;
  stage: number;
  description: string;
  format: string;
}

export interface EquationProblem {
  question: string;
  x: number;
}

export const EQUATION_STAGES: EquationStageConfig[] = [
  // World 1: Intuition (Fill-in-the-blank)
  {
    id: 1,
    world: 1,
    stage: 1,
    description: '? + a = b',
    format: 'fill_plus',
  },
  {
    id: 2,
    world: 1,
    stage: 2,
    description: '? - a = b',
    format: 'fill_minus',
  },
  {
    id: 3,
    world: 1,
    stage: 3,
    description: 'a - ? = b',
    format: 'fill_subtract',
  },

  // World 2: Intro to 'x' (One-step)
  {
    id: 4,
    world: 2,
    stage: 4,
    description: 'x + a = b',
    format: 'x_plus',
  },
  {
    id: 5,
    world: 2,
    stage: 5,
    description: 'x - a = b',
    format: 'x_minus',
  },
  {
    id: 6,
    world: 2,
    stage: 6,
    description: 'b = x + a',
    format: 'x_plus_reverse',
  },

  // World 3: Coefficients
  {
    id: 7,
    world: 3,
    stage: 7,
    description: 'ax = b',
    format: 'coefficient_multiply',
  },
  {
    id: 8,
    world: 3,
    stage: 8,
    description: 'x / a = b',
    format: 'coefficient_divide',
  },
  {
    id: 9,
    world: 3,
    stage: 9,
    description: '-ax = b',
    format: 'coefficient_negative',
  },

  // World 4: Two-step Equations
  {
    id: 10,
    world: 4,
    stage: 10,
    description: 'ax + b = c (a, b, x > 0)',
    format: 'two_step_plus',
  },
  {
    id: 11,
    world: 4,
    stage: 11,
    description: 'ax - b = c',
    format: 'two_step_minus',
  },
  {
    id: 12,
    world: 4,
    stage: 12,
    description: 'ax + b = c (Larger numbers)',
    format: 'two_step_large',
  },

  // World 5: Master (Complex)
  {
    id: 13,
    world: 5,
    stage: 13,
    description: 'ax = bx + c (Variables on both sides)',
    format: 'both_sides_simple',
  },
  {
    id: 14,
    world: 5,
    stage: 14,
    description: 'a(x + b) = c (Parentheses)',
    format: 'parentheses',
  },
  {
    id: 15,
    world: 5,
    stage: 15,
    description: 'ax + b = cx + d (Variables on both sides + constants)',
    format: 'both_sides_complex',
  },
];

/**
 * 랜덤 정수 생성 (min 이상 max 이하)
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Stage 1: ? + a = b
 */
function generateFillPlus(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (1~20)
  const a = getRandomInt(1, 20);
  // b = x + a
  const b = x + a;

  return {
    question: `? + ${a} = ${b}`,
    x: x,
  };
}

/**
 * Stage 2: ? - a = b
 */
function generateFillMinus(): EquationProblem {
  // x를 먼저 선택 (1~30)
  const x = getRandomInt(1, 30);
  // a를 선택 (1~20)
  const a = getRandomInt(1, 20);
  // b = x - a (b >= 0이 되도록)
  const b = x - a;

  if (b < 0) {
    // x가 a보다 작으면 재생성
    return generateFillMinus();
  }

  return {
    question: `? - ${a} = ${b}`,
    x: x,
  };
}

/**
 * Stage 3: a - ? = b
 */
function generateFillSubtract(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (x보다 크게, 1~30)
  const a = getRandomInt(x + 1, 30);
  // b = a - x
  const b = a - x;

  return {
    question: `${a} - ? = ${b}`,
    x: x,
  };
}

/**
 * Stage 4: x + a = b
 */
function generateXPlus(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (1~20)
  const a = getRandomInt(1, 20);
  // b = x + a
  const b = x + a;

  return {
    question: `x + ${a} = ${b}`,
    x: x,
  };
}

/**
 * Stage 5: x - a = b
 */
function generateXMinus(): EquationProblem {
  // x를 먼저 선택 (1~30)
  const x = getRandomInt(1, 30);
  // a를 선택 (1~20)
  const a = getRandomInt(1, 20);
  // b = x - a (b >= 0)
  const b = x - a;

  if (b < 0) {
    return generateXMinus();
  }

  return {
    question: `x - ${a} = ${b}`,
    x: x,
  };
}

/**
 * Stage 6: b = x + a
 */
function generateXPlusReverse(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (1~20)
  const a = getRandomInt(1, 20);
  // b = x + a
  const b = x + a;

  return {
    question: `${b} = x + ${a}`,
    x: x,
  };
}

/**
 * Stage 7: ax = b
 */
function generateCoefficientMultiply(): EquationProblem {
  // x를 먼저 선택 (1~15)
  const x = getRandomInt(1, 15);
  // a를 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b = a * x
  const b = a * x;

  return {
    question: `${a}x = ${b}`,
    x: x,
  };
}

/**
 * Stage 8: x / a = b
 */
function generateCoefficientDivide(): EquationProblem {
  // x를 먼저 선택 (a의 배수가 되도록)
  // a를 먼저 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b를 선택 (1~10)
  const b = getRandomInt(1, 10);
  // x = a * b
  const x = a * b;

  return {
    question: `x ÷ ${a} = ${b}`,
    x: x,
  };
}

/**
 * Stage 9: -ax = b (Result can be negative)
 */
function generateCoefficientNegative(): EquationProblem {
  // x를 먼저 선택 (1~15)
  const x = getRandomInt(1, 15);
  // a를 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b = -a * x (음수)
  const b = -a * x;

  return {
    question: `-${a}x = ${b}`,
    x: x,
  };
}

/**
 * Stage 10: ax + b = c (a, b, x > 0)
 */
function generateTwoStepPlus(): EquationProblem {
  // x를 먼저 선택 (1~15)
  const x = getRandomInt(1, 15);
  // a를 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b를 선택 (1~20)
  const b = getRandomInt(1, 20);
  // c = a * x + b
  const c = a * x + b;

  return {
    question: `${a}x + ${b} = ${c}`,
    x: x,
  };
}

/**
 * Stage 11: ax - b = c
 */
function generateTwoStepMinus(): EquationProblem {
  // x를 먼저 선택 (1~15)
  const x = getRandomInt(1, 15);
  // a를 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b를 선택 (1~20)
  const b = getRandomInt(1, 20);
  // c = a * x - b (c >= 0이 되도록)
  const c = a * x - b;

  if (c < 0) {
    return generateTwoStepMinus();
  }

  return {
    question: `${a}x - ${b} = ${c}`,
    x: x,
  };
}

/**
 * Stage 12: ax + b = c (Larger numbers)
 */
function generateTwoStepLarge(): EquationProblem {
  // x를 먼저 선택 (1~30)
  const x = getRandomInt(1, 30);
  // a를 선택 (2~15)
  const a = getRandomInt(2, 15);
  // b를 선택 (10~50)
  const b = getRandomInt(10, 50);
  // c = a * x + b
  const c = a * x + b;

  return {
    question: `${a}x + ${b} = ${c}`,
    x: x,
  };
}

/**
 * Stage 13: ax = bx + c (Variables on both sides, ensure a > b for positive x)
 */
function generateBothSidesSimple(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (2~10)
  const a = getRandomInt(2, 10);
  // b를 선택 (1~a-1, a > b 보장)
  const b = getRandomInt(1, a - 1);
  // c = a * x - b * x = (a - b) * x
  const c = (a - b) * x;

  return {
    question: `${a}x = ${b}x + ${c}`,
    x: x,
  };
}

/**
 * Stage 14: a(x + b) = c (Parentheses)
 */
function generateParentheses(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (2~9)
  const a = getRandomInt(2, 9);
  // b를 선택 (1~15)
  const b = getRandomInt(1, 15);
  // c = a * (x + b)
  const c = a * (x + b);

  return {
    question: `${a}(x + ${b}) = ${c}`,
    x: x,
  };
}

/**
 * Stage 15: ax + b = cx + d (Variables on both sides + constants)
 */
function generateBothSidesComplex(): EquationProblem {
  // x를 먼저 선택 (1~20)
  const x = getRandomInt(1, 20);
  // a를 선택 (2~10)
  const a = getRandomInt(2, 10);
  // c를 선택 (1~a-1, a > c 보장)
  const c = getRandomInt(1, a - 1);
  // b를 선택 (1~30)
  const b = getRandomInt(1, 30);
  // d = a * x + b - c * x = (a - c) * x + b
  const d = (a - c) * x + b;

  return {
    question: `${a}x + ${b} = ${c}x + ${d}`,
    x: x,
  };
}

/**
 * 주어진 stageLevel에 해당하는 방정식 문제 생성
 *
 * @param stageLevel 1~15 사이의 스테이지 레벨
 * @returns EquationProblem { question: string, x: number }
 */
export function generateEquation(stageLevel: number): EquationProblem {
  const stage = EQUATION_STAGES.find((s) => s.stage === stageLevel);

  if (!stage) {
    throw new Error(`Stage ${stageLevel} not found. Valid stages are 1-15.`);
  }

  switch (stage.format) {
    case 'fill_plus':
      return generateFillPlus();
    case 'fill_minus':
      return generateFillMinus();
    case 'fill_subtract':
      return generateFillSubtract();
    case 'x_plus':
      return generateXPlus();
    case 'x_minus':
      return generateXMinus();
    case 'x_plus_reverse':
      return generateXPlusReverse();
    case 'coefficient_multiply':
      return generateCoefficientMultiply();
    case 'coefficient_divide':
      return generateCoefficientDivide();
    case 'coefficient_negative':
      return generateCoefficientNegative();
    case 'two_step_plus':
      return generateTwoStepPlus();
    case 'two_step_minus':
      return generateTwoStepMinus();
    case 'two_step_large':
      return generateTwoStepLarge();
    case 'both_sides_simple':
      return generateBothSidesSimple();
    case 'parentheses':
      return generateParentheses();
    case 'both_sides_complex':
      return generateBothSidesComplex();
    default:
      throw new Error(`Unknown format: ${stage.format}`);
  }
}

/**
 * EquationProblemGenerator 클래스 (선택적 사용)
 */
export class EquationProblemGenerator {
  /**
   * 스테이지 레벨에 따른 방정식 문제 생성
   */
  static generate(stageLevel: number): EquationProblem {
    return generateEquation(stageLevel);
  }

  /**
   * 모든 스테이지 설정 조회
   */
  static getStages(): EquationStageConfig[] {
    return EQUATION_STAGES;
  }

  /**
   * 특정 스테이지 설정 조회
   */
  static getStage(stageLevel: number): EquationStageConfig | undefined {
    return EQUATION_STAGES.find((s) => s.stage === stageLevel);
  }
}
