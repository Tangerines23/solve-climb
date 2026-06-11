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
  specificType?: SequenceType,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
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

  const randomIdx = rng ? rng.randomInt(0, types.length) : Math.floor(Math.random() * types.length);
  const type = specificType || types.at(randomIdx) || types[0];
  let sequence: number[] = [];
  let answer = 0;

  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);

  switch (type) {
    case 'arithmetic': {
      // 등차수열
      const start = getInt(1, 20);
      const diff = getInt(1, 10);
      for (let i = 0; i < 5; i++) {
        sequence.push(start + i * diff);
      }
      answer = sequence[4];
      sequence.pop(); // 마지막 숫자를 정답으로
      break;
    }
    case 'geometric': {
      // 등비수열 (숫자가 너무 커지지 않게 조절)
      const start = getInt(1, 5);
      const ratio = getInt(2, 4);
      for (let i = 0; i < 5; i++) {
        sequence.push(start * Math.pow(ratio, i));
      }
      answer = sequence[4];
      sequence.pop();
      break;
    }
    case 'fibonacci': {
      // 피보나치
      const start1 = getInt(1, 3);
      const start2 = getInt(start1, 5);
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
      let current = getInt(1, 10);
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
      let current = getInt(10, 30);
      const diff1 = getInt(2, 5);
      const diff2 = getInt(1, 3);
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

export function generateLogicProblem(
  level: number,
  difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  if (level > 15) {
    const randomLevel = rng ? rng.randomInt(1, 14) : Math.floor(Math.random() * 14) + 1;
    return generateLogicProblem(randomLevel, difficulty, rng);
  }

  switch (level) {
    // [Phase 1: 판단 (Lv 1~5) - 양자택일]
    case 1:
      return generateEvenOddProblem(difficulty, rng);
    case 2:
      return generatePosNegProblem(difficulty, rng);
    case 3:
      return generateSequenceProblem(difficulty, 'arithmetic', rng); // 등차수열 기초
    case 4:
      return generateSequenceProblem(difficulty, 'geometric', rng); // 등비수열 기초
    case 5:
      return generateSequenceProblem(difficulty, 'fibonacci', rng); // 피보나치 수열

    // [Phase 2: 추론 (Lv 6~10) - 빈칸 채우기]
    case 6:
      return generatePrimeProblem(difficulty, rng); // 소수 판별
    case 7:
      return generateModProblem(difficulty, rng); // 나머지 연산 기초
    case 8:
      return generateFactorialProblem(difficulty, rng); // 기초 팩토리얼
    case 9:
      return generateClockProblem(rng); // 시계 규칙 (Modulo 12)
    case 10:
      return generateLogicMix1(difficulty, rng); // 논리 퀴즈 종합 (1~9 믹스)

    // [Phase 3: 약속 (Lv 11~15) - 규칙 학습]
    case 11:
      return generateAbsoluteProblem(difficulty, rng); // 절댓값
    case 12:
      return generateModAdvancedProblem(difficulty, rng); // 나머지 심화
    case 13:
      return generateFactorialAdvancedProblem(difficulty, rng); // 팩토리얼 심화
    case 14:
      return generateCustomOpProblem(difficulty, rng); // 사용자 연산
    case 15:
      return generateLogicMix2(difficulty, rng); // 논리왕 (11~14 믹스)
    default:
      return generateEvenOddProblem(difficulty, rng);
  }
}

function generateAbsoluteProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const num = rng ? rng.randomInt(-50, 0) : getRandomInt(-50, -1);
  const question = `|${num}| (절댓값)의 값은?`;
  return { question, answer: Math.abs(num) };
}

function generateCustomOpProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const a = getInt(1, 10);
  const b = getInt(1, 10);
  const type = rng ? rng.randomInt(1, 3) : getRandomInt(1, 2);
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

function generateEvenOddProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const num = rng ? rng.randomInt(1, 101) : getRandomInt(1, 100);
  const question = `${num}은(는) 홀수입니까 짝수입니까? (1: 홀수, 2: 짝수)`;
  const answer = num % 2 === 0 ? 2 : 1;
  return { question, answer };
}

function generatePosNegProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const num = rng ? rng.randomInt(-50, 51) : getRandomInt(-50, 50);
  if (num === 0) return generatePosNegProblem(_difficulty, rng);
  const question = `${num}은(는) 양수입니까 음수입니까? (1: 양수, 2: 음수)`;
  const answer = num > 0 ? 1 : 2;
  return { question, answer };
}

function generatePrimeProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
  const nonPrimes = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];

  const isPrimeTarget = rng ? rng.random() > 0.5 : Math.random() > 0.5;
  const num = isPrimeTarget
    ? primes[rng ? rng.randomInt(0, primes.length) : Math.floor(Math.random() * primes.length)]
    : nonPrimes[
        rng ? rng.randomInt(0, nonPrimes.length) : Math.floor(Math.random() * nonPrimes.length)
      ];

  const question = `${num}은(는) 소수(Prime Number)입니까? (1: 예, 2: 아니오)`;
  const answer = isPrimeTarget ? 1 : 2;
  return { question, answer };
}

function generateModProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const a = getInt(10, 50);
  const b = getInt(2, 9);
  const question = `${a}을(를) ${b}(으)로 나눈 나머지는?`;
  const answer = a % b;
  return { question, answer };
}

function generateFactorialProblem(
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const n = rng ? rng.randomInt(1, 6) : getRandomInt(1, 5); // Keep small
  let answer = 1;
  for (let i = 1; i <= n; i++) answer *= i;
  const question = `${n}! (팩토리얼)의 값은?`;
  return { question, answer };
}

function generateClockProblem(rng?: {
  randomInt: (min: number, max: number) => number;
}): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const hour = getInt(13, 23); // 13시 ~ 23시
  return {
    question: `${hour}시는 12시간제에서 오후 몇 시입니까? (숫자만 입력)`,
    answer: hour - 12,
  };
}

function generateLogicMix1(
  difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const randomLevel = getInt(1, 9);
  return generateLogicProblem(randomLevel, difficulty, rng);
}

function generateModAdvancedProblem(
  _difficulty: Difficulty,
  rng?: { randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const a = getInt(30, 80);
  const b = getInt(4, 9);
  return {
    question: `${a}을(를) ${b}(으)로 나눈 나머지는?`,
    answer: a % b,
  };
}

function generateFactorialAdvancedProblem(
  _difficulty: Difficulty,
  rng?: { randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const type = getInt(1, 2);
  if (type === 1) {
    const n = getInt(3, 6);
    return {
      question: `${n}! ÷ ${n - 1}! 의 값은?`,
      answer: n,
    };
  } else {
    const n = getInt(2, 4);
    let fact = 1;
    for (let i = 1; i <= n; i++) fact *= i;
    const mult = getInt(2, 3);
    return {
      question: `${n}! × ${mult} 의 값은?`,
      answer: fact * mult,
    };
  }
}

function generateLogicMix2(
  difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): LogicProblem {
  const getInt = (min: number, max: number) =>
    rng ? rng.randomInt(min, max + 1) : getRandomInt(min, max);
  const randomLevel = getInt(11, 14);
  return generateLogicProblem(randomLevel, difficulty, rng);
}
