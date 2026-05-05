import { Difficulty } from '../types/quiz';

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
  {
    id: 13,
    world: 1,
    stage: 13,
    description: '변수 이항 (ax = bx + c)',
    format: 'both_sides_simple',
  },
  { id: 14, world: 1, stage: 14, description: '괄호 풀기 a(x + b) = c', format: 'parentheses' },
  {
    id: 15,
    world: 1,
    stage: 15,
    description: '보스 (ax + b = cx + d)',
    format: 'both_sides_complex',
  },

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
function getRandomInt(
  min: number,
  max: number,
  rng?: { randomInt: (min: number, max: number) => number }
): number {
  if (rng) return rng.randomInt(min, max + 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Stage 1: ? + a = b
 */
/**
 * Stage 1: ? + a = b
 */
function generateFillPlus(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(1, 20, rng);
  const b = x + a;
  return { question: `□ + ${a} = ${b}`, x };
}

/**
 * Stage 2: ? - a = b
 */
function generateFillMinus(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 30, rng);
  const a = getRandomInt(1, 20, rng);
  const b = x - a;
  if (b < 0) return generateFillMinus(rng);
  return { question: `□ - ${a} = ${b}`, x };
}

/**
 * Stage 3: a - ? = b
 */
function generateFillSubtract(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(x + 1, 30, rng);
  const b = a - x;
  return { question: `${a} - □ = ${b}`, x };
}

function generateFillMultiply(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 12, rng);
  const a = getRandomInt(2, 9, rng);
  const b = x * a;
  return { question: `□ x ${a} = ${b}`, x };
}

function generateFillDivide(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const a = getRandomInt(2, 9, rng);
  const x = getRandomInt(1, 10, rng);
  const b = a * x;
  return { question: `□ ÷ ${a} = ${x}`, x: b };
}

/**
 * Stage 4: x + a = b
 */
function generateXPlus(rng?: { randomInt: (min: number, max: number) => number }): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(1, 20, rng);
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
function generateXMinus(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 30, rng);
  const a = getRandomInt(1, 20, rng);
  const b = x - a;
  if (b < 0) return generateXMinus(rng);
  return {
    question: `x - ${a} = ${b}`,
    x: x,
    transposition: { term: `- ${a}`, targetSide: 'RHS', targetResult: `+ ${a}` },
  };
}

/**
 * Stage 7: ax = b
 */
function generateCoefficientMultiply(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 15, rng);
  const a = getRandomInt(2, 9, rng);
  const b = a * x;
  return { question: `${a}x = ${b}`, x };
}

/**
 * Stage 8: x / a = b
 */
function generateCoefficientDivide(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const a = getRandomInt(2, 9, rng);
  const b = getRandomInt(1, 10, rng);
  const x = a * b;
  return { question: `x ÷ ${a} = ${b}`, x };
}

/**
 * Stage 10: ax + b = c (a, b, x > 0)
 */
function generateTwoStepPlus(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 15, rng);
  const a = getRandomInt(2, 9, rng);
  const b = getRandomInt(1, 20, rng);
  const c = a * x + b;
  return { question: `${a}x + ${b} = ${c}`, x };
}

/**
 * Stage 11: ax - b = c
 */
function generateTwoStepMinus(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 15, rng);
  const a = getRandomInt(2, 9, rng);
  const b = getRandomInt(1, 20, rng);
  const c = a * x - b;
  if (c < 0) return generateTwoStepMinus(rng);
  return { question: `${a}x - ${b} = ${c}`, x };
}

/**
 * Stage 12: ax + b = c (Larger numbers)
 */
function generateTwoStepLarge(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 30, rng);
  const a = getRandomInt(2, 15, rng);
  const b = getRandomInt(10, 50, rng);
  const c = a * x + b;
  return { question: `${a}x + ${b} = ${c}`, x };
}

/**
 * Stage 13: ax = bx + c (Variables on both sides, ensure a > b for positive x)
 */
function generateBothSidesSimple(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(2, 10, rng);
  const b = getRandomInt(1, a - 1, rng);
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
function generateParentheses(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(2, 9, rng);
  const b = getRandomInt(1, 15, rng);
  const c = a * (x + b);
  return { question: `${a}(x + ${b}) = ${c}`, x };
}

/**
 * Stage 15: ax + b = cx + d (Variables on both sides + constants)
 */
function generateBothSidesComplex(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  const a = getRandomInt(2, 10, rng);
  const c = getRandomInt(1, a - 1, rng);
  const b = getRandomInt(1, 30, rng);
  const d = (a - c) * x + b;
  return {
    question: `${a}x + ${b} = ${c}x + ${d}`,
    x: x,
    transposition: { term: `${c}x`, targetSide: 'LHS', targetResult: `-${c}x` },
  };
}

function generateRatio(rng?: { randomInt: (min: number, max: number) => number }): EquationProblem {
  const a = getRandomInt(1, 5, rng);
  const x = getRandomInt(1, 10, rng);
  const b = getRandomInt(1, 5, rng);
  const c = (a * x) / b;
  if (!Number.isInteger(c)) return generateRatio(rng);
  return { question: `${a} : ${b} = ${c} : x`, x };
}

function generateSubstitution(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 15, rng);
  const a = getRandomInt(1, 10, rng);
  const b = x + a;
  return { question: `y = x + ${a}, y = ${b}`, x };
}

function generateInequalityBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const x = getRandomInt(1, 20, rng);
  return { question: `x > ${x}, 최소 정수는?`, x: x + 1 };
}

function generateInequalitySolve(rng?: {
  randomInt: (min: number, max: number) => number;
}): EquationProblem {
  const a = getRandomInt(2, 5, rng);
  const x_ans = getRandomInt(5, 10, rng);
  const rhs = a * x_ans - a + 1;
  return { question: `${a}x > ${rhs}, 최소 정수는?`, x: x_ans };
}

/**
 * 주어진 stageLevel에 해당하는 방정식 문제 생성
 *
 * @param stageLevel 1~15 사이의 스테이지 레벨
 * @returns EquationProblem { question: string, x: number }
 */
export function generateEquation(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): EquationProblem {
  const stage = EQUATION_STAGES.find((s) => s.id === level);
  const format = stage ? stage.format : 'fill_plus';

  switch (format) {
    case 'fill_plus':
      return generateFillPlus(rng);
    case 'fill_minus':
      return generateFillMinus(rng);
    case 'fill_subtract':
      return generateFillSubtract(rng);
    case 'fill_multiply':
      return generateFillMultiply(rng);
    case 'fill_divide':
      return generateFillDivide(rng);
    case 'x_plus':
      return generateXPlus(rng);
    case 'x_minus':
      return generateXMinus(rng);
    case 'coefficient_multiply':
      return generateCoefficientMultiply(rng);
    case 'coefficient_divide':
      return generateCoefficientDivide(rng);
    case 'two_step_plus':
      return generateTwoStepPlus(rng);
    case 'two_step_minus':
      return generateTwoStepMinus(rng);
    case 'two_step_large':
      return generateTwoStepLarge(rng);
    case 'both_sides_simple':
      return generateBothSidesSimple(rng);
    case 'parentheses':
      return generateParentheses(rng);
    case 'both_sides_complex':
      return generateBothSidesComplex(rng);
    case 'ratio':
      return generateRatio(rng);
    case 'substitution':
      return generateSubstitution(rng);
    case 'inequality_basic':
      return generateInequalityBasic(rng);
    case 'inequality_solve':
      return generateInequalitySolve(rng);
    default:
      return generateFillPlus(rng);
  }
}

/**
 * EquationProblemGenerator 클래스 (선택적 사용)
 */
export const EquationProblemGenerator = {
  generate: generateEquation,
  getStages: () => EQUATION_STAGES,
  getStage: (level: number) => EQUATION_STAGES.find((s) => s.id === level),
};
