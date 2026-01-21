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
  transposition?: {
    term: string;
    targetSide: 'LHS' | 'RHS';
    targetResult: string;
  };
}

export const EQUATION_STAGES: EquationStageConfig[] = [
  // [Phase 1: x의 등장 (Lv 1~10)]
  { id: 1, world: 1, stage: 1, description: '□ + a = b', format: 'fill_plus' },
  { id: 2, world: 1, stage: 2, description: '□ - a = b', format: 'fill_minus' },
  { id: 3, world: 1, stage: 3, description: 'a - □ = b', format: 'fill_subtract' },
  { id: 4, world: 1, stage: 4, description: '□ x a = b', format: 'fill_multiply' },
  { id: 5, world: 1, stage: 5, description: '□ / a = b', format: 'fill_divide' },
  { id: 6, world: 1, stage: 6, description: 'x + a = b (시각적 치환)', format: 'x_plus' },
  { id: 7, world: 1, stage: 7, description: 'ax = b (곱셈 생략)', format: 'coefficient_multiply' },
  { id: 8, world: 1, stage: 8, description: 'ax + b = c (기초 방정식)', format: 'two_step_plus' },
  { id: 9, world: 1, stage: 9, description: 'ax - b = c', format: 'two_step_minus' },
  { id: 10, world: 1, stage: 10, description: 'ax + b = c (복합)', format: 'two_step_large' },

  // [Phase 2: 구조의 변형 (Lv 11~15)]
  { id: 11, world: 1, stage: 11, description: '상수 이항 (x + a = b)', format: 'x_plus' },
  { id: 12, world: 1, stage: 12, description: '부호 변환 (x - a = b)', format: 'x_minus' },
  { id: 13, world: 1, stage: 13, description: '변수 이항 (ax = bx + c)', format: 'both_sides_simple' },
  { id: 14, world: 1, stage: 14, description: '괄호 풀기 a(x + b) = c', format: 'parentheses' },
  { id: 15, world: 1, stage: 15, description: '보스 (ax + b = cx + d)', format: 'both_sides_complex' },

  // [Phase 3: 응용 (Lv 16~20)]
  { id: 16, world: 1, stage: 16, description: '비례식 (a:b = c:x)', format: 'ratio' },
  { id: 17, world: 1, stage: 17, description: '대입법 (y=x+a, y=b)', format: 'substitution' },
  { id: 18, world: 1, stage: 18, description: '부등식 기초 (x > a)', format: 'inequality_basic' },
  { id: 19, world: 1, stage: 19, description: '부등식 풀기 (ax > b)', format: 'inequality_solve' },
  { id: 20, world: 1, stage: 20, description: '대수왕 (종합)', format: 'both_sides_complex' },
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
    question: `□ + ${a} = ${b}`,
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
    question: `□ - ${a} = ${b}`,
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
    question: `${a} - □ = ${b}`,
    x: x,
  };
}

function generateFillMultiply(): EquationProblem {
  const x = getRandomInt(1, 12);
  const a = getRandomInt(2, 9);
  const b = x * a;
  return {
    question: `□ x ${a} = ${b}`,
    x: x,
  };
}

function generateFillDivide(): EquationProblem {
  const a = getRandomInt(2, 9);
  const x = getRandomInt(1, 10);
  const b = a * x;
  return {
    question: `□ ÷ ${a} = ${x}`,
    x: b,
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
    transposition: { term: `+ ${a}`, targetSide: 'RHS', targetResult: `- ${a}` },
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
    transposition: { term: `- ${a}`, targetSide: 'RHS', targetResult: `+ ${a}` },
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
    transposition: { term: `${b}x`, targetSide: 'LHS', targetResult: `-${b}x` },
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
    transposition: { term: `${c}x`, targetSide: 'LHS', targetResult: `-${c}x` },
  };
}

function generateRatio(): EquationProblem {
  // a:b = c:x -> ax = bc -> x = bc/a
  const a = getRandomInt(1, 5);
  const x = getRandomInt(1, 10);
  const b = getRandomInt(1, 5);
  const c = (a * x) / b;
  if (!Number.isInteger(c)) return generateRatio();

  return {
    question: `${a} : ${b} = ${c} : x`,
    x: x,
  };
}

function generateSubstitution(): EquationProblem {
  const x = getRandomInt(1, 15);
  const a = getRandomInt(1, 10);
  const b = x + a;
  return {
    question: `y = x + ${a}, y = ${b}`,
    x: x,
  };
}

function generateInequalityBasic(): EquationProblem {
  const x = getRandomInt(1, 20);
  const question = `x > ${x}, 최소 정수는?`;
  return {
    question,
    x: x + 1,
  };
}

function generateInequalitySolve(): EquationProblem {
  const a = getRandomInt(2, 5);
  // ax > rhs -> x > rhs/a
  const x_ans = getRandomInt(5, 10);
  const rhs = a * x_ans - a + 1; // so x > (rhs/a) -> x >= x_ans

  return {
    question: `${a}x > ${rhs}, 최소 정수는?`,
    x: x_ans,
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
    case 'fill_multiply':
      return generateFillMultiply();
    case 'fill_divide':
      return generateFillDivide();
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
    case 'ratio':
      return generateRatio();
    case 'substitution':
      return generateSubstitution();
    case 'inequality_basic':
      return generateInequalityBasic();
    case 'inequality_solve':
      return generateInequalitySolve();
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
