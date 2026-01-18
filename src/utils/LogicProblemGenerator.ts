import { Difficulty } from '../types/quiz';

export interface LogicProblem {
  question: string;
  answer: number;
}

type SequenceType = 'arithmetic' | 'geometric' | 'fibonacci' | 'incrementing_diff' | 'alternating';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSequenceProblem(
  difficulty: Difficulty,
  specificType?: SequenceType
): LogicProblem {
  const types: SequenceType[] = [];

  // 난이도별 문제 유형 정의
  if (difficulty === 'easy') {
    types.push('arithmetic', 'geometric');
  } else if (difficulty === 'medium') {
    types.push('arithmetic', 'geometric', 'fibonacci');
  } else {
    types.push('fibonacci', 'incrementing_diff', 'alternating');
  }

  const type = specificType || types[Math.floor(Math.random() * types.length)];
  let sequence: number[] = [];
  let answer = 0;

  switch (type) {
    case 'arithmetic': {
      // 등차수열
      const start = getRandomInt(1, 20);
      const diff = getRandomInt(1, 10);
      for (let i = 0; i < 5; i++) {
        sequence.push(start + i * diff);
      }
      answer = sequence[4];
      sequence.pop(); // 마지막 숫자를 정답으로
      break;
    }
    case 'geometric': {
      // 등비수열 (숫자가 너무 커지지 않게 조절)
      const start = getRandomInt(1, 5);
      const ratio = getRandomInt(2, 4);
      for (let i = 0; i < 5; i++) {
        sequence.push(start * Math.pow(ratio, i));
      }
      answer = sequence[4];
      sequence.pop();
      break;
    }
    case 'fibonacci': {
      // 피보나치
      const start1 = getRandomInt(1, 3);
      const start2 = getRandomInt(start1, 5);
      sequence = [start1, start2];
      for (let i = 2; i < 6; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
      }
      answer = sequence[5];
      sequence.pop();
      break;
    }
    case 'incrementing_diff': {
      // 계차수열 (차이가 1, 2, 3... 씩 증가)
      let current = getRandomInt(1, 10);
      sequence.push(current);
      let diff = 1;
      for (let i = 0; i < 4; i++) {
        current += diff;
        sequence.push(current);
        diff++;
      }
      answer = sequence[4];
      sequence.pop();
      break;
    }
    case 'alternating': {
      // 교대 수열 (예: +2, -1, +2, -1...)
      let current = getRandomInt(10, 30);
      const diff1 = getRandomInt(2, 5);
      const diff2 = getRandomInt(1, 3);
      sequence.push(current);

      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) current += diff1;
        else current -= diff2;
        sequence.push(current);
      }
      answer = sequence[4];
      sequence.pop();
      break;
    }
  }

  return {
    question: `${sequence.join(', ')}, [ ? ]`,
    answer,
  };
}

export function generateLogicProblem(level: number, difficulty: Difficulty): LogicProblem {
  switch (level) {
    case 1:
      return generateEvenOddProblem(difficulty);
    case 2:
      return generatePosNegProblem(difficulty);
    case 3:
      return generateSequenceProblem(difficulty, 'arithmetic');
    case 4:
      return generateSequenceProblem(difficulty, 'geometric');
    case 5:
      return generateSequenceProblem(difficulty, 'fibonacci');
    case 6:
      return generatePrimeProblem(difficulty);
    case 7:
      return generateModProblem(difficulty);
    case 8:
      return generateFactorialProblem(difficulty);
    case 9:
      return generateClockProblem(difficulty);
    case 10:
      return generateSequenceProblem(difficulty, 'incrementing_diff');
    default:
      return generateSequenceProblem(difficulty);
  }
}

function generateEvenOddProblem(_difficulty: Difficulty): LogicProblem {
  const num = getRandomInt(1, 100);
  const question = `${num}은(는) 홀수입니까 짝수입니까? (1: 홀수, 2: 짝수)`;
  const answer = num % 2 === 0 ? 2 : 1;
  return { question, answer };
}

function generatePosNegProblem(_difficulty: Difficulty): LogicProblem {
  const num = getRandomInt(-50, 50);
  if (num === 0) return generatePosNegProblem(_difficulty);
  const question = `${num}은(는) 양수입니까 음수입니까? (1: 양수, 2: 음수)`;
  const answer = num > 0 ? 1 : 2;
  return { question, answer };
}

function generatePrimeProblem(_difficulty: Difficulty): LogicProblem {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
  const nonPrimes = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];

  const isPrimeTarget = Math.random() > 0.5;
  const num = isPrimeTarget
    ? primes[Math.floor(Math.random() * primes.length)]
    : nonPrimes[Math.floor(Math.random() * nonPrimes.length)];

  const question = `${num}은(는) 소수(Prime Number)입니까? (1: 예, 2: 아니오)`;
  const answer = isPrimeTarget ? 1 : 2;
  return { question, answer };
}

function generateModProblem(_difficulty: Difficulty): LogicProblem {
  const a = getRandomInt(10, 50);
  const b = getRandomInt(2, 9);
  const question = `${a}을(를) ${b}(으)로 나눈 나머지는?`;
  const answer = a % b;
  return { question, answer };
}

function generateFactorialProblem(_difficulty: Difficulty): LogicProblem {
  const n = getRandomInt(1, 5); // Keep small
  let answer = 1;
  for (let i = 1; i <= n; i++) answer *= i;
  const question = `${n}! (팩토리얼)의 값은?`;
  return { question, answer };
}

function generateClockProblem(_difficulty: Difficulty): LogicProblem {
  const hour = getRandomInt(1, 12);
  // Simple: Angle of hour hand from 12? No, let's do: "3시는 몇 도입니까?"
  const angle = hour * 30;
  const question = `시계의 시침이 ${hour}시를 가리킬 때, 12시와의 각도는? (0~360)`;
  return { question, answer: angle };
}
