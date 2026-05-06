import { Difficulty } from '../types/quiz';

export interface CSProblem {
  question: string;
  answer: number | string;
}

function getRandomInt(
  min: number,
  max: number,
  rng?: { randomInt: (min: number, max: number) => number }
): number {
  if (rng) return rng.randomInt(min, max + 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCSProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): CSProblem {
  if (level > 10) {
    const randomVal = rng ? rng.randomInt(1, 4) : Math.floor(Math.random() * 4) + 1;
    switch (randomVal) {
      case 1:
        return generateBinaryToDec(rng);
      case 2:
        return generateDecToBinary(rng);
      case 3:
        return generateBitwiseAdvanced(rng);
      case 4:
        return generateMemoryUnitMaster(rng);
      default:
        return generateBinaryToDec(rng);
    }
  }

  switch (level) {
    case 1:
      return generateBinaryToDec(rng);
    case 2:
      return generateDecToBinary(rng);
    case 3:
      return generateHexToDec(rng);
    case 4:
      return generateLogicAND(rng);
    case 5:
      return generateLogicOR(rng);
    case 6:
      return generateLogicNOT(rng);
    case 7:
      return generateLogicXOR(rng);
    case 8:
      return generateBitwiseAdvanced(rng);
    case 9:
      return generateAlgoVariety(rng);
    case 10:
      return generateMemoryUnitMaster(rng);
    default:
      return generateBinaryToDec(rng);
  }
}

function generateBinaryToDec(rng?: { randomInt: (min: number, max: number) => number }): CSProblem {
  const num = getRandomInt(1, 15, rng);
  const binary = num.toString(2);
  return {
    question: `2진수 ${binary}을(를) 10진수로 바꾸면?`,
    answer: num,
  };
}

function generateDecToBinary(rng?: { randomInt: (min: number, max: number) => number }): CSProblem {
  const num = getRandomInt(1, 15, rng);
  return {
    question: `10진수 ${num}을(를) 2진수로 바꾸면?`,
    answer: num.toString(2),
  };
}

function generateHexToDec(rng?: { randomInt: (min: number, max: number) => number }): CSProblem {
  const num = getRandomInt(10, 25, rng);
  const hex = num.toString(16).toUpperCase();
  return {
    question: `16진수 ${hex}을(를) 10진수로 바꾸면?`,
    answer: num,
  };
}

function generateLogicAND(rng?: { random: () => number }): CSProblem {
  const randomVal1 = rng ? rng.random() : Math.random();
  const randomVal2 = rng ? rng.random() : Math.random();
  const a = randomVal1 > 0.5 ? 1 : 0;
  const b = randomVal2 > 0.5 ? 1 : 0;
  return {
    question: `${a} AND ${b} 의 결과는? (0 또는 1)`,
    answer: a && b ? 1 : 0,
  };
}

function generateLogicOR(rng?: { random: () => number }): CSProblem {
  const randomVal1 = rng ? rng.random() : Math.random();
  const randomVal2 = rng ? rng.random() : Math.random();
  const a = randomVal1 > 0.5 ? 1 : 0;
  const b = randomVal2 > 0.5 ? 1 : 0;
  return {
    question: `${a} OR ${b} 의 결과는? (0 또는 1)`,
    answer: a || b ? 1 : 0,
  };
}

function generateLogicNOT(rng?: { random: () => number }): CSProblem {
  const randomVal = rng ? rng.random() : Math.random();
  const a = randomVal > 0.5 ? 1 : 0;
  return {
    question: `NOT ${a} 의 결과는? (0 또는 1)`,
    answer: a ? 0 : 1,
  };
}

function generateLogicXOR(rng?: { random: () => number }): CSProblem {
  const randomVal1 = rng ? rng.random() : Math.random();
  const randomVal2 = rng ? rng.random() : Math.random();
  const a = randomVal1 > 0.5 ? 1 : 0;
  const b = randomVal2 > 0.5 ? 1 : 0;
  return {
    question: `${a} XOR ${b} 의 결과는? (0 또는 1)`,
    answer: a !== b ? 1 : 0,
  };
}

function generateBitwiseAdvanced(rng?: {
  randomInt: (min: number, max: number) => number;
}): CSProblem {
  const n1 = getRandomInt(1, 15, rng);
  const n2 = getRandomInt(1, 15, rng);
  const ops = ['&', '|', '^'];
  const op = ops[getRandomInt(0, 2, rng)];
  let ans = 0;
  if (op === '&') ans = n1 & n2;
  if (op === '|') ans = n1 | n2;
  if (op === '^') ans = n1 ^ n2;

  return {
    question: `10진수 ${n1} ${op} ${n2} 의 비트 연산 결과는?`,
    answer: ans,
  };
}

function generateAlgoVariety(rng?: { randomInt: (min: number, max: number) => number }): CSProblem {
  const type = getRandomInt(1, 3, rng);
  if (type === 1) {
    return {
      question: '데이터를 마지막에 넣고 마지막에서 빼는 구조(LIFO)는? (1: 스택, 2: 큐)',
      answer: 1,
    };
  } else if (type === 2) {
    return {
      question: '데이터를 마지막에 넣고 처음에서 빼는 구조(FIFO)는? (1: 스택, 2: 큐)',
      answer: 2,
    };
  } else {
    return {
      question: '정렬된 데이터에서 절반씩 나누어 찾는 탐색법은? (1: 선형탐색, 2: 이진탐색)',
      answer: 2,
    };
  }
}

function generateMemoryUnitMaster(rng?: {
  randomInt: (min: number, max: number) => number;
}): CSProblem {
  const type = getRandomInt(1, 2, rng);
  if (type === 1) {
    const kb = Math.pow(2, getRandomInt(1, 4, rng));
    return {
      question: `${kb * 1024} 바이트(Byte)는 몇 KB입니까?`,
      answer: kb,
    };
  } else {
    const mb = Math.pow(2, getRandomInt(1, 2, rng));
    return {
      question: `${mb * 1024} KB는 몇 MB입니까?`,
      answer: mb,
    };
  }
}
