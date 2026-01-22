import { Difficulty, FunctionMachineHint, IntegralTankHint, CalculusHint } from '../types/quiz';

export interface CalculusProblem {
  question: string;
  answer: number | string;
  inputType?: 'number' | 'decimal' | 'fraction' | 'coordinate';
  hintType?: 'transposition' | 'coordinate' | 'calculus' | 'function-machine' | 'integral-tank';
  hintData?: FunctionMachineHint | IntegralTankHint | CalculusHint;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCalculusProblem(level: number, _difficulty: Difficulty): CalculusProblem {
  switch (level) {
    // [Phase 1: 좌표와 함수 (Lv 1~5)]
    case 1:
    case 2:
      return generateCoordinateProblem(level);
    case 3:
    case 4:
    case 5:
      return generateFunctionProblem();

    // [Phase 2: 극한 (Lv 6~8)]
    case 6:
      return {
        question: 'x + 1 (x → ∞) 의 값은?',
        answer: '∞',
        hintType: 'calculus',
        hintData: { type: 'limit', func: 'x+1' },
      };
    case 7:
      return {
        question: '1 / x (x → ∞) 의 값은?',
        answer: 0,
        hintType: 'calculus',
        hintData: { type: 'limit', func: '1/x' },
      };
    case 8:
      return {
        question: '2x / x (x → ∞) 의 값은?',
        answer: 2,
        hintType: 'calculus',
        hintData: { type: 'limit', func: '2x/x' },
      };

    // [Phase 3: 미분 (Lv 9~12)]
    case 9:
      return generateDerivativeProblem('basic');
    case 10:
      return generateDerivativeProblem('coefficient');
    case 11:
      return generateDerivativeProblem('linear');
    case 12:
      return generateDerivativeProblem('const');

    // [Phase 4: 적분 (Lv 13~15)]
    case 13:
      return generateIntegralProblem('power');
    case 14:
      return generateIntegralProblem('simple');
    case 15:
      return Math.random() > 0.5
        ? generateDerivativeProblem('basic')
        : generateIntegralProblem('simple');

    default:
      return generateDerivativeProblem('basic');
  }
}

function generateCoordinateProblem(level: number): CalculusProblem {
  if (level === 1) {
    // 1사분면 (First quadrant)
    const x = getRandomInt(1, 5);
    const y = getRandomInt(1, 5);
    return {
      question: `좌표 (${x}, ${y})를 조준하세요!`,
      answer: `${x},${y}`,
      inputType: 'coordinate',
    };
  } else {
    // 전 사분면 (All quadrants)
    const x = getRandomInt(-5, 5);
    const y = getRandomInt(-5, 5);
    // 0은 너무 쉬울 수 있으니 제외 시도 (옵션)
    return {
      question: `좌표 (${x}, ${y})를 조준하세요!`,
      answer: `${x},${y}`,
      inputType: 'coordinate',
    };
  }
}

function generateFunctionProblem(): CalculusProblem {
  const x = getRandomInt(1, 4);
  const type = getRandomInt(1, 2);
  if (type === 1) {
    const a = getRandomInt(1, 5);
    return {
      question: `f(x) = x + ${a}, f(${x}) = ?`,
      answer: x + a,
      hintType: 'function-machine',
      hintData: { type: 'plus', value: a, input: x },
    };
  } else {
    return {
      question: `f(x) = x², f(${x}) = ?`,
      answer: x * x,
      hintType: 'function-machine',
      hintData: { type: 'square', value: 2, input: x },
    };
  }
}

function generateDerivativeProblem(
  type: 'basic' | 'coefficient' | 'linear' | 'const'
): CalculusProblem {
  const x = getRandomInt(1, 3);
  const n = getRandomInt(2, 4);
  const a = getRandomInt(2, 5);

  switch (type) {
    case 'basic':
      // d/dx(x^n) = n*x^(n-1)
      return {
        question: `d/dx(x^${n}) , x=${x} 일 때 값은?`,
        answer: n * Math.pow(x, n - 1),
        hintType: 'calculus',
        hintData: { type: 'derivative', func: `x^${n}` },
      };
    case 'coefficient':
      // d/dx(ax^n) = a*n*x^(n-1)
      return {
        question: `d/dx(${a}x^${n}) , x=1 일 때 값은?`,
        answer: a * n,
        hintType: 'calculus',
        hintData: { type: 'derivative', func: `${a}x^${n}` },
      };
    case 'linear':
      return {
        question: `d/dx(${a}x) 의 값은?`,
        answer: a,
        hintType: 'calculus',
        hintData: { type: 'derivative', func: `${a}x` },
      };
    case 'const': {
      const c = getRandomInt(1, 100);
      return {
        question: `d/dx(${c}) 의 값은?`,
        answer: 0,
        hintType: 'calculus',
        hintData: { type: 'derivative', func: `${c}` },
      };
    }
  }
}

function generateIntegralProblem(type: 'power' | 'simple'): CalculusProblem {
  const n = getRandomInt(1, 3);
  if (type === 'power') {
    // ∫ x^n dx = (1/n+1)x^(n+1)
    // Simplify for integer answers: ∫ (n+1)x^n dx = x^(n+1)
    const power = n;
    const coeff = n + 1;
    const x = getRandomInt(1, 3);
    return {
      question: `∫ ${coeff}x^${power} dx , x=${x} 일 때 값은? (C=0)`,
      answer: Math.pow(x, coeff),
      hintType: 'integral-tank',
      hintData: { type: 'power', coeff: coeff, power: power, x: x },
    };
  } else {
    const a = getRandomInt(2, 10);
    return {
      question: `∫ ${a} dx , x=1 일 때 값은? (C=0)`,
      answer: a,
      hintType: 'integral-tank',
      hintData: { type: 'simple', value: a, x: 1 },
    };
  }
}
