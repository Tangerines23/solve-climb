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
      return generateBitwiseBasic();
    case 9:
      return generateAlgoBasic();
    case 10:
      return generateCSMaster();
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

function generateBitwiseBasic(): CSProblem {
  return {
    question: '8비트(bit)는 몇 바이트(byte)입니까?',
    answer: 1,
  };
}

function generateAlgoBasic(): CSProblem {
  return {
    question: '데이터를 순서대로 나열하는 알고리즘의 이름은? (1: 정렬, 2: 탐색)',
    answer: 1,
  };
}

function generateCSMaster(): CSProblem {
  return {
    question: '1024 킬로바이트(KB)는 몇 메가바이트(MB)입니까?',
    answer: 1,
  };
}
