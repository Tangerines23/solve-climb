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
    // [Phase 1: 판단 (Lv 1~5) - 양자택일]
    case 1:
      return generateEvenOddProblem(difficulty);
    case 2:
      return generatePosNegProblem(difficulty);
    case 3:
      return generateMultipleProblem(difficulty); // 3의 배수 판별 등
    case 4:
      return generatePrimeProblem(difficulty);
    case 5:
      return generateComparisonProblem(difficulty); // 두 수 중 소수 찾기 등

    // [Phase 2: 추론 (Lv 6~10) - 빈칸 채우기]
    case 6:
      return generateSequenceProblem(difficulty, 'arithmetic');
    case 7:
      return generateSequenceProblem(difficulty, 'geometric');
    case 8:
      return generateSequenceProblem(difficulty, 'fibonacci');
    case 9:
      return generateSequenceProblem(difficulty, 'alternating'); // 건너뛰기/교대
    case 10:
      return generateSequenceProblem(difficulty, 'incrementing_diff'); // 계차

    // [Phase 3: 약속 (Lv 11~15) - 규칙 학습]
    case 11:
      return generateAbsoluteProblem(difficulty);
    case 12:
      return generateModProblem(difficulty);
    case 13:
      return generateFactorialProblem(difficulty);
    case 14:
      return generateCustomOpProblem(difficulty); // A * B = A + B + 1
    case 15:
      return generateSequenceProblem(difficulty); // 보스: 랜덤 혼합
    default:
      return generateSequenceProblem(difficulty);
  }
}

function generateMultipleProblem(_difficulty: Difficulty): LogicProblem {
  const base = [3, 4, 6, 7, 8, 9][Math.floor(Math.random() * 6)];
  const isMultiple = Math.random() > 0.5;
  const num = isMultiple ? base * getRandomInt(2, 12) : base * getRandomInt(2, 12) + 1;
  const question = `${num}은(는) ${base}의 배수입니까? (1: 예, 2: 아니오)`;
  return { question, answer: isMultiple ? 1 : 2 };
}

function generateComparisonProblem(_difficulty: Difficulty): LogicProblem {
  const primes = [13, 17, 19, 23, 29];
  const nonPrimes = [15, 21, 25, 27, 33];
  const p = primes[Math.floor(Math.random() * primes.length)];
  const np = nonPrimes[Math.floor(Math.random() * nonPrimes.length)];
  const isPrimeFirst = Math.random() > 0.5;
  const question = isPrimeFirst
    ? `[${p}] [${np}] 소수(Prime)인 것은? (1: 왼쪽, 2: 오른쪽)`
    : `[${np}] [${p}] 소수(Prime)인 것은? (1: 왼쪽, 2: 오른쪽)`;
  return { question, answer: isPrimeFirst ? 1 : 2 };
}

function generateAbsoluteProblem(_difficulty: Difficulty): LogicProblem {
  const num = getRandomInt(-50, -1);
  const question = `|${num}| (절댓값)의 값은?`;
  return { question, answer: Math.abs(num) };
}

function generateCustomOpProblem(_difficulty: Difficulty): LogicProblem {
  const a = getRandomInt(1, 10);
  const b = getRandomInt(1, 10);
  const type = getRandomInt(1, 2);
  let question = '';
  let answer = 0;
  if (type === 1) {
    question = `A ★ B = A + B + 1 일 때, ${a} ★ ${b} = ?`;
    answer = a + b + 1;
  } else {
    question = `A ○ B = A * B - 1 일 때, ${a} ○ ${b} = ?`;
    answer = a * b - 1;
  }
  return { question, answer };
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
