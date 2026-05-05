import { Difficulty, FunctionMachineHint, IntegralTankHint, CalculusHint } from '../types/quiz';

export interface CalculusProblem {
  question: string;
  answer: number | string;
  inputType?: 'number' | 'decimal' | 'fraction' | 'coordinate';
  hintType?: 'transposition' | 'coordinate' | 'calculus' | 'function-machine' | 'integral-tank';
  hintData?: FunctionMachineHint | IntegralTankHint | CalculusHint;
}

function getRandomInt(
  min: number,
  max: number,
  rng?: { randomInt: (min: number, max: number) => number }
): number {
  if (rng) return rng.randomInt(min, max + 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCalculusProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): CalculusProblem {
  if (level > 15) {
    const randomVal = rng ? rng.randomInt(1, 3) : Math.floor(Math.random() * 3) + 1;
    switch (randomVal) {
      case 1:
        return generateDefiniteIntegral(rng);
      case 2:
        return generateAdvancedDerivative(rng);
      case 3:
        return generateFactorizationLimit(rng);
      default:
        return generateDefiniteIntegral(rng);
    }
  }

  switch (level) {
    // [Phase 1: 좌표와 함수 (Lv 1~5)]
    case 1:
    case 2:
      return generateCoordinateProblem(level, rng);
    case 3:
    case 4:
    case 5:
      return generateFunctionProblem(rng);

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
      return generateDerivativeProblem('basic', rng);
    case 10:
      return generateDerivativeProblem('coefficient', rng);
    case 11:
      return generateDerivativeProblem('linear', rng);
    case 12:
      return generateDerivativeProblem('const', rng);

    // [Phase 4: 적분 (Lv 13~15)]
    case 13:
      return generateIntegralProblem('power', rng);
    case 14:
      return generateIntegralProblem('simple', rng);
    case 15: {
      const randomVal = rng ? rng.random() : Math.random();
      return randomVal > 0.5
        ? generateDerivativeProblem('basic', rng)
        : generateIntegralProblem('simple', rng);
    }

    default:
      return generateDerivativeProblem('basic', rng);
  }
}

function generateCoordinateProblem(
  level: number,
  rng?: { randomInt: (min: number, max: number) => number }
): CalculusProblem {
  if (level === 1) {
    // 1사분면 (First quadrant)
    const x = getRandomInt(1, 5, rng);
    const y = getRandomInt(1, 5, rng);
    return {
      question: `좌표 (${x}, ${y})를 조준하세요!`,
      answer: `${x},${y}`,
      inputType: 'coordinate',
    };
  } else {
    // 전 사분면 (All quadrants)
    const x = getRandomInt(-5, 5, rng);
    const y = getRandomInt(-5, 5, rng);
    // 0은 너무 쉬울 수 있으니 제외 시도 (옵션)
    return {
      question: `좌표 (${x}, ${y})를 조준하세요!`,
      answer: `${x},${y}`,
      inputType: 'coordinate',
    };
  }
}

function generateFunctionProblem(rng?: {
  randomInt: (min: number, max: number) => number;
}): CalculusProblem {
  const x = getRandomInt(1, 4, rng);
  const type = getRandomInt(1, 2, rng);
  if (type === 1) {
    const a = getRandomInt(1, 5, rng);
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
  type: 'basic' | 'coefficient' | 'linear' | 'const',
  rng?: { randomInt: (min: number, max: number) => number }
): CalculusProblem {
  const x = getRandomInt(1, 3, rng);
  const n = getRandomInt(2, 4, rng);
  const a = getRandomInt(2, 5, rng);

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
      const c = getRandomInt(1, 100, rng);
      return {
        question: `d/dx(${c}) 의 값은?`,
        answer: 0,
        hintType: 'calculus',
        hintData: { type: 'derivative', func: `${c}` },
      };
    }
  }
}

function generateIntegralProblem(
  type: 'power' | 'simple',
  rng?: { randomInt: (min: number, max: number) => number }
): CalculusProblem {
  const n = getRandomInt(1, 3, rng);
  if (type === 'power') {
    // ∫ x^n dx = (1/n+1)x^(n+1)
    // Simplify for integer answers: ∫ (n+1)x^n dx = x^(n+1)
    const power = n;
    const coeff = n + 1;
    const x = getRandomInt(1, 3, rng);
    return {
      question: `∫ ${coeff}x^${power} dx , x=${x} 일 때 값은? (C=0)`,
      answer: Math.pow(x, coeff),
      hintType: 'integral-tank',
      hintData: { type: 'power', coeff: coeff, power: power, x: x },
    };
  } else {
    const a = getRandomInt(2, 10, rng);
    return {
      question: `∫ ${a} dx , x=1 일 때 값은? (C=0)`,
      answer: a,
      hintType: 'integral-tank',
      hintData: { type: 'simple', value: a, x: 1 },
    };
  }
}

function generateDefiniteIntegral(rng?: {
  randomInt: (min: number, max: number) => number;
}): CalculusProblem {
  const a = getRandomInt(1, 5, rng);
  const b = getRandomInt(1, 4, rng);
  const coeff = 2 * a;

  return {
    question: `∫(0부터 ${b}까지) ${coeff}x dx 의 값은?`,
    answer: a * b * b,
    hintType: 'calculus',
    hintData: { type: 'derivative', func: 'definite_integral' },
  };
}

function generateAdvancedDerivative(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): CalculusProblem {
  const isProduct = rng ? rng.random() > 0.5 : Math.random() > 0.5;
  if (isProduct) {
    const a = getRandomInt(1, 5, rng);
    return {
      question: `f(x) = x(x + ${a}) 일 때, f'(1) 의 값은?`,
      answer: 2 + a,
      hintType: 'calculus',
      hintData: { type: 'derivative', func: 'product_rule' },
    };
  } else {
    const a = getRandomInt(1, 5, rng);
    return {
      question: `f(x) = (x + ${a})² 일 때, f'(1) 의 값은?`,
      answer: 2 * (1 + a),
      hintType: 'calculus',
      hintData: { type: 'derivative', func: 'chain_rule' },
    };
  }
}

function generateFactorizationLimit(rng?: {
  randomInt: (min: number, max: number) => number;
}): CalculusProblem {
  const a = getRandomInt(2, 6, rng);
  return {
    question: `(x² - ${a * a}) / (x - ${a}) (x → ${a}) 의 극한값은?`,
    answer: 2 * a,
    hintType: 'calculus',
    hintData: { type: 'limit', func: 'factorization' },
  };
}
