import { Difficulty, MathProblem } from '../types/quiz';

function getRandomInt(
  min: number,
  max: number,
  rng?: { randomInt: (min: number, max: number) => number }
): number {
  if (rng) return rng.randomInt(min, max + 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateHardAlgebraProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { randomInt: (min: number, max: number) => number }
): MathProblem {
  const problemType = getRandomInt(1, 3, rng);
  if (level <= 10) {
    if (problemType === 1 || problemType === 2) return generateQuadratic(rng);
    return generateExponential(rng);
  } else if (level <= 20) {
    if (problemType === 1) return generateQuadratic(rng);
    if (problemType === 2) return generateExponential(rng);
    return generateLogarithm(rng);
  } else {
    if (problemType === 1) return generateQuadratic(rng);
    if (problemType === 2) return generateExponential(rng);
    return generateLogarithm(rng);
  }
}

function generateQuadratic(rng?: { randomInt: (min: number, max: number) => number }): MathProblem {
  const a = getRandomInt(1, 10, rng);
  const b = getRandomInt(1, 10, rng);
  const larger = Math.max(a, b);
  const S = a + b;
  const P = a * b;

  return {
    expression: `x² - ${S}x + ${P} = 0 (큰 근)`,
    answer: larger,
    inputType: 'number',
  };
}

function generateExponential(rng?: {
  randomInt: (min: number, max: number) => number;
}): MathProblem {
  const bases = [2, 3, 4, 5];
  const base = bases[getRandomInt(0, bases.length - 1, rng)];
  const x = getRandomInt(2, 4, rng);
  const b = Math.pow(base, x);

  return {
    expression: `${base}ˣ = ${b}, x = ?`,
    answer: x,
    inputType: 'number',
  };
}

function generateLogarithm(rng?: { randomInt: (min: number, max: number) => number }): MathProblem {
  const bases = [2, 3, 4, 5];
  const base = bases[getRandomInt(0, bases.length - 1, rng)];
  const x = getRandomInt(2, 4, rng);
  const b = Math.pow(base, x);

  const subMap: Record<number, string> = { 2: '₂', 3: '₃', 4: '₄', 5: '₅' };
  const sub = subMap[base as keyof typeof subMap] || `_${base}`;

  return {
    expression: `log${sub}(${b}) = ?`,
    answer: x,
    inputType: 'number',
  };
}
