export type Operator = '+' | '-' | '*' | '/';

export interface StageConfig {
  id: number;
  world: number;
  description: string;
  type:
    | 'standard'
    | 'sequential'
    | 'fill-blank'
    | 'parentheses'
    | 'decimal'
    | 'fraction'
    | 'time'
    | 'modulo';
  operators: Operator[];
  operandCount: number;
  // Array of ranges for each operand position.
  ranges: { min: number; max: number }[];
  constraints?: {
    resultMax?: number;
    resultMin?: number;
    allowNegative?: boolean;
    ensureIntegerDivision?: boolean;
    precision?: number; // for decimals
    denominator?: number; // for fractions
  };
}

export const STAGES: StageConfig[] = [
  // World 1 기초 (Training) Curriculum: 15 Levels
  {
    id: 1,
    world: 1,
    description: '한 자릿수 덧셈',
    type: 'standard',
    operators: ['+'],
    operandCount: 2,
    ranges: [
      { min: 1, max: 9 },
      { min: 1, max: 9 },
    ],
    constraints: { resultMax: 10 },
  },
  {
    id: 2,
    world: 1,
    description: '한 자릿수 뺄셈',
    type: 'standard',
    operators: ['-'],
    operandCount: 2,
    ranges: [
      { min: 1, max: 9 },
      { min: 1, max: 9 },
    ],
    constraints: { resultMin: 0 },
  },
  {
    id: 3,
    world: 1,
    description: '받아올림 덧셈',
    type: 'standard',
    operators: ['+'],
    operandCount: 2,
    ranges: [
      { min: 1, max: 9 },
      { min: 1, max: 9 },
    ],
    constraints: { resultMin: 10 },
  },
  {
    id: 4,
    world: 1,
    description: '받아내림 뺄셈',
    type: 'standard',
    operators: ['-'],
    operandCount: 2,
    ranges: [
      { min: 10, max: 19 },
      { min: 1, max: 9 },
    ],
    constraints: { resultMax: 9 },
  },
  {
    id: 5,
    world: 1,
    description: '기초 구구단',
    type: 'standard',
    operators: ['*'],
    operandCount: 2,
    ranges: [
      { min: 2, max: 5 },
      { min: 1, max: 9 },
    ],
  },
  {
    id: 6,
    world: 1,
    description: '심화 구구단',
    type: 'standard',
    operators: ['*'],
    operandCount: 2,
    ranges: [
      { min: 6, max: 9 },
      { min: 1, max: 9 },
    ],
  },
  {
    id: 7,
    world: 1,
    description: '나눗셈 기초',
    type: 'standard',
    operators: ['/'],
    operandCount: 2,
    ranges: [
      { min: 2, max: 9 },
      { min: 2, max: 9 },
    ],
    constraints: { ensureIntegerDivision: true },
  },
  {
    id: 8,
    world: 1,
    description: '사칙연산 혼합',
    type: 'sequential',
    operators: ['+', '-', '*'],
    operandCount: 3,
    ranges: [
      { min: 1, max: 10 },
      { min: 1, max: 10 },
      { min: 1, max: 5 },
    ],
  },
  {
    id: 9,
    world: 1,
    description: '연산 우선순위',
    type: 'parentheses',
    operators: ['+', '-', '*'],
    operandCount: 3,
    ranges: [
      { min: 1, max: 10 },
      { min: 1, max: 5 },
      { min: 2, max: 5 },
    ],
  },
  {
    id: 10,
    world: 1,
    description: '소수(Decimal) 계산',
    type: 'decimal',
    operators: ['+', '-'],
    operandCount: 2,
    ranges: [
      { min: 1, max: 5 },
      { min: 1, max: 5 },
    ],
    constraints: { precision: 1 },
  },
  {
    id: 11,
    world: 1,
    description: '분수(Fraction) 기초',
    type: 'fraction',
    operators: ['+'],
    operandCount: 2,
    ranges: [
      { min: 1, max: 4 },
      { min: 1, max: 4 },
    ],
    constraints: { denominator: 4 },
  },
  {
    id: 12,
    world: 1,
    description: '60진법 시각 계산',
    type: 'time',
    operators: ['+'],
    operandCount: 2,
    ranges: [
      { min: 0, max: 59 },
      { min: 5, max: 45 },
    ],
  },
  {
    id: 13,
    world: 1,
    description: '두 자릿수 곱셈',
    type: 'standard',
    operators: ['*'],
    operandCount: 2,
    ranges: [
      { min: 10, max: 50 },
      { min: 2, max: 9 },
    ],
  },
  {
    id: 14,
    world: 1,
    description: '나눗셈 검산',
    type: 'modulo',
    operators: ['/'],
    operandCount: 2,
    ranges: [
      { min: 10, max: 50 },
      { min: 3, max: 7 },
    ],
  },
  {
    id: 15,
    world: 1,
    description: '기초 산수 마스터',
    type: 'sequential',
    operators: ['+', '-', '*', '/'],
    operandCount: 3,
    ranges: [
      { min: 1, max: 20 },
      { min: 1, max: 20 },
      { min: 2, max: 10 },
    ],
  },
];

export interface MathProblem {
  expression: string;
  answer: number;
  displayExpression?: string; // For fill-in-the-blank or specific formatting
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomOperator(operators: Operator[]): Operator {
  return operators[Math.floor(Math.random() * operators.length)];
}

function calculate(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
  }
}

/**
 * 안전하게 수식의 결과를 계산합니다 (연산자 우선순위 적용)
 * @param numbers 숫자 배열
 * @param operators 연산자 배열
 * @returns 계산 결과
 */
function calculateWithPrecedence(numbers: number[], operators: Operator[]): number {
  // 배열을 복사하여 원본을 보존
  const nums = [...numbers];
  const ops = [...operators];

  // 먼저 곱셈과 나눗셈을 처리 (우선순위 높음)
  let i = 0;
  while (i < ops.length) {
    if (ops[i] === '*' || ops[i] === '/') {
      const result = calculate(nums[i], nums[i + 1], ops[i]);
      nums[i] = result;
      nums.splice(i + 1, 1);
      ops.splice(i, 1);
      // i를 증가시키지 않고 다시 같은 위치 확인
    } else {
      i++;
    }
  }

  // 남은 덧셈과 뺄셈을 왼쪽에서 오른쪽으로 처리
  let result = nums[0];
  for (let j = 0; j < ops.length; j++) {
    result = calculate(result, nums[j + 1], ops[j]);
  }

  return result;
}

export function generateProblem(stageId: number): MathProblem {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) {
    throw new Error(`Stage ${stageId} not found`);
  }

  let problem: MathProblem = { expression: '', answer: 0 };
  let isValid = false;
  let attempts = 0;

  while (!isValid && attempts < 100) {
    attempts++;
    try {
      if (stage.type === 'standard' || stage.type === 'fill-blank') {
        problem = generateStandardProblem(stage);
      } else if (stage.type === 'sequential') {
        problem = generateSequentialProblem(stage);
      } else if (stage.type === 'parentheses') {
        problem = generateParenthesesProblem(stage);
      } else if (stage.type === 'decimal') {
        problem = generateDecimalProblem(stage);
      } else if (stage.type === 'fraction') {
        problem = generateFractionProblem(stage);
      } else if (stage.type === 'time') {
        problem = generateTimeProblem(stage);
      } else if (stage.type === 'modulo') {
        problem = generateModuloProblem(stage);
      }
      isValid = true;
    } catch {
      // Retry if constraints met failure (e.g. negative result when not allowed)
      continue;
    }
  }

  if (!isValid) {
    console.warn(`Failed to generate valid problem for stage ${stageId} after 100 attempts`);
    // Fallback to simple 1+1 to avoid crash
    return { expression: '1 + 1', answer: 2 };
  }

  return problem;
}

function generateStandardProblem(stage: StageConfig): MathProblem {
  const op = getRandomOperator(stage.operators);
  let a: number, b: number;

  if (op === '/') {
    // Special handling for division to ensure integer result
    // Generate divisor (b) and quotient (answer) first
    const divisorRange = stage.ranges[1] || stage.ranges[0];
    const quotientRange = { min: 2, max: 9 }; // Reasonable quotient range for mental math

    b = getRandomInt(divisorRange.min, divisorRange.max);
    const answer = getRandomInt(quotientRange.min, quotientRange.max);
    a = b * answer;

    return {
      expression: `${a} ÷ ${b}`,
      answer: answer,
    };
  } else {
    a = getRandomInt(stage.ranges[0].min, stage.ranges[0].max);
    b = getRandomInt(
      stage.ranges[1]?.min ?? stage.ranges[0].min,
      stage.ranges[1]?.max ?? stage.ranges[0].max
    );

    const result = calculate(a, b, op);

    // Check constraints
    if (stage.constraints?.resultMax !== undefined && result > stage.constraints.resultMax)
      throw new Error('Result too high');
    if (stage.constraints?.resultMin !== undefined && result < stage.constraints.resultMin)
      throw new Error('Result too low');
    if (!stage.constraints?.allowNegative && result < 0) throw new Error('Negative result');

    let expression = `${a} ${op} ${b}`;
    let displayExpression = expression;

    if (stage.type === 'fill-blank') {
      // Randomly hide a, op, or b? Usually hide operand.
      // Let's hide the second operand for simplicity: "15 - ? = 6"
      // Or hide result? No, result is the answer usually.
      // Requirement: "Return the answer and the masked expression string"
      // If the question is "15 - ? = 6", the answer the user types is 9.
      // So the 'answer' field should be the missing value.

      const hideFirst = Math.random() > 0.5;
      if (hideFirst) {
        // ? + b = result
        displayExpression = `? ${op} ${b} = ${result}`;
        return { expression: displayExpression, answer: a };
      } else {
        // a + ? = result
        displayExpression = `${a} ${op} ? = ${result}`;
        return { expression: displayExpression, answer: b };
      }
    }

    return { expression, answer: result };
  }
}

function generateSequentialProblem(stage: StageConfig): MathProblem {
  // e.g. a + b - c
  // Or 2 + 3 * 4 (Stage 13)

  const ops = [];
  const nums = [];

  for (let i = 0; i < stage.operandCount - 1; i++) {
    ops.push(getRandomOperator(stage.operators));
  }

  for (let i = 0; i < stage.operandCount; i++) {
    const range = stage.ranges[i] || stage.ranges[stage.ranges.length - 1];
    nums.push(getRandomInt(range.min, range.max));
  }

  // Construct expression string
  let expression = `${nums[0]}`;
  for (let i = 0; i < ops.length; i++) {
    expression += ` ${ops[i]} ${nums[i + 1]}`;
  }

  // Calculate result respecting precedence
  // Stage 13 (Mixed Operators with Precedence) uses standard math precedence
  // Other sequential problems also use precedence for consistency
  const result = calculateWithPrecedence(nums, ops as Operator[]);

  // Check constraints
  // For Stage 13 (2 + 3 * 4), result is 14.
  // Ensure result is integer (division might break this)
  if (!Number.isInteger(result)) throw new Error('Non-integer result');
  if (stage.constraints?.resultMin !== undefined && result < stage.constraints.resultMin)
    throw new Error('Result too low');
  if (!stage.constraints?.allowNegative && result < 0) throw new Error('Negative result');

  // Format for display (replace * with x, / with ÷)
  const displayExpression = expression.replace(/\*/g, '×').replace(/\//g, '÷');

  return { expression: displayExpression, answer: result };
}

function generateParenthesesProblem(stage: StageConfig): MathProblem {
  // (a + b) * c
  // Simple template: (a op1 b) op2 c
  const op1 = getRandomOperator(['+', '-']); // Inside parens usually additive
  const op2 = getRandomOperator(['*', '/']); // Outside usually multiplicative for "complex" feel

  const range = stage.ranges[0];
  const a = getRandomInt(range.min, range.max);
  const b = getRandomInt(range.min, range.max);
  const c = getRandomInt(2, 5); // Keep multiplier small

  // Ensure (a op1 b) is positive and valid
  const innerResult = calculate(a, b, op1);
  if (innerResult < 0) throw new Error('Negative inner result');

  let result;
  let expression;

  if (op2 === '/') {
    // Ensure divisibility
    // (inner) / c = result -> inner must be multiple of c
    // Hard to force random a,b to sum to multiple of c.
    // Reverse: generate result, then inner = result * c.
    // Then find a, b such that a op1 b = inner.
    const finalResult = getRandomInt(2, 9);
    const targetInner = finalResult * c;

    // a + b = targetInner OR a - b = targetInner
    if (op1 === '+') {
      // a + b = targetInner
      // split targetInner into two random parts
      const split = getRandomInt(1, targetInner - 1);
      const newA = split;
      const newB = targetInner - split;
      expression = `(${newA} + ${newB}) ÷ ${c}`;
      result = finalResult;
    } else {
      // a - b = targetInner
      const newB = getRandomInt(1, 9);
      const newA = targetInner + newB;
      expression = `(${newA} - ${newB}) ÷ ${c}`;
      result = finalResult;
    }
  } else {
    // Multiplication
    result = calculate(innerResult, c, op2);
    expression = `(${a} ${op1} ${b}) × ${c}`;
  }

  return { expression, answer: result };
}

function generateDecimalProblem(stage: StageConfig): MathProblem {
  const op = getRandomOperator(stage.operators);
  const precision = stage.constraints?.precision || 1;
  const factor = Math.pow(10, precision);

  const range0 = stage.ranges[0];
  const range1 = stage.ranges[1] || stage.ranges[0];

  const a = getRandomInt(range0.min * factor, range0.max * factor) / factor;
  const b = getRandomInt(range1.min * factor, range1.max * factor) / factor;

  const result = calculate(a, b, op);
  const roundedResult = Math.round(result * factor) / factor;

  return {
    expression: `${a.toFixed(precision)} ${op} ${b.toFixed(precision)}`,
    answer: roundedResult,
  };
}

function generateFractionProblem(stage: StageConfig): MathProblem {
  // Simple unit fractions or same denominator for World 1 Level 11
  const den = stage.constraints?.denominator || 4;
  const num1 = getRandomInt(1, den - 1);
  const num2 = getRandomInt(1, den - 1);

  // We'll return the answer as a decimal but show it as a fraction?
  // Or handle fraction input in UI. For now, let's keep it simple: 1/4 + 2/4 = ?
  // Answer as decimal: 0.75
  const result = (num1 + num2) / den;

  return {
    expression: `${num1}/${den} + ${num2}/${den}`,
    answer: Math.round(result * 100) / 100,
  };
}

function generateTimeProblem(stage: StageConfig): MathProblem {
  // 14:00 + 40min = 1440 (14:40)
  const hour = getRandomInt(0, 23);
  const min = getRandomInt(0, 59);
  const addMin = getRandomInt(stage.ranges[1].min, stage.ranges[1].max);

  const totalInMinutes = hour * 60 + min + addMin;
  const finalHour = Math.floor(totalInMinutes / 60) % 24;
  const finalMin = totalInMinutes % 60;

  const displayTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  const answer = Number(`${finalHour}${finalMin.toString().padStart(2, '0')}`);

  return {
    expression: `${displayTime} + ${addMin}분`,
    answer: answer,
  };
}

function generateModuloProblem(stage: StageConfig): MathProblem {
  const a = getRandomInt(stage.ranges[0].min, stage.ranges[0].max);
  const b = getRandomInt(stage.ranges[1].min, stage.ranges[1].max);
  const remainder = a % b;

  return {
    expression: `${a} ÷ ${b} 의 나머지`,
    answer: remainder,
  };
}
