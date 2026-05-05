import { Difficulty } from '../types/quiz';

export interface StatsProblem {
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

export function generateStatsProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): StatsProblem {
  if (level > 10) {
    const randomVal = rng ? rng.randomInt(1, 4) : Math.floor(Math.random() * 4) + 1;
    switch (randomVal) {
      case 1:
        return generatePermutations(rng);
      case 2:
        return generateConditionalProbability(rng);
      case 3:
        return generateVariance(rng);
      case 4:
        return generateCombinationsAdvanced(rng);
      default:
        return generatePermutations(rng);
    }
  }

  switch (level) {
    case 1:
      return generateMeanBasic(rng);
    case 2:
      return generateMedianBasic(rng);
    case 3:
      return generateModeBasic(rng);
    case 4:
      return generateProbCoin(rng);
    case 5:
      return generateProbDice(rng);
    case 6:
      return generateProbMarbles(rng);
    case 7:
      return generateStatsRange(rng);
    case 8:
      return generateCombinationsBasic(rng);
    case 9:
      return generateProbAdvanced(rng);
    case 10:
      return generateStatsMaster(rng);
    default:
      return generateMeanBasic(rng);
  }
}

function generateMeanBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n1 = getRandomInt(1, 10, rng);
  const n2 = getRandomInt(1, 10, rng);
  const n3 = getRandomInt(1, 10, rng);
  const avg = (n1 + n2 + n3) / 3;

  if (!Number.isInteger(avg)) return generateMeanBasic(rng);

  return {
    question: `${n1}, ${n2}, ${n3}의 평균은?`,
    answer: avg,
  };
}

function generateMedianBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const nums = [getRandomInt(1, 20, rng), getRandomInt(1, 20, rng), getRandomInt(1, 20, rng)].sort(
    (a, b) => a - b
  );
  return {
    question: `${nums[0]}, ${nums[1]}, ${nums[2]} 세 수 중 중앙값(Median)은?`,
    answer: nums[1],
  };
}

function generateModeBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const base = getRandomInt(1, 10, rng);
  const nums = [base, base, getRandomInt(1, 10, rng), getRandomInt(1, 10, rng)].sort();
  // Ensure mode is unique
  const counts = new Map<number, number>();
  nums.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
  const mode = Array.from(counts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a));

  return {
    question: `${nums.join(', ')} 중 최빈값(Mode)은?`,
    answer: Number(mode[0]),
  };
}

function generateProbCoin(rng?: { randomInt: (min: number, max: number) => number }): StatsProblem {
  const coins = getRandomInt(1, 3, rng);
  return {
    question: `동전 ${coins}개를 동시에 던질 때, 나올 수 있는 모든 경우의 수는?`,
    answer: Math.pow(2, coins),
  };
}

function generateProbDice(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const randomVal = rng ? rng.random() : Math.random();
  const type = randomVal > 0.5 ? 'sum' : 'count';
  if (type === 'sum') {
    return { question: '주사위 2개를 던질 때, 합이 7이 되는 경우의 수는?', answer: 6 };
  } else {
    return { question: '주사위 1개를 던질 때, 3의 배수가 나올 경우의 수는?', answer: 2 };
  }
}

function generateProbMarbles(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const red = getRandomInt(2, 5, rng);
  const blue = getRandomInt(2, 5, rng);
  return {
    question: `빨간 공 ${red}개, 파란 공 ${blue}개가 든 주머니에서 공 1개를 뽑을 때, 빨간 공이 나올 경우의 수?`,
    answer: red,
  };
}

function generateStatsRange(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const nums = Array.from({ length: 4 }, () => getRandomInt(1, 50, rng));
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  return {
    question: `${nums.join(', ')} 중 최댓값과 최솟값의 차이(범위)는?`,
    answer: max - min,
  };
}

function generateCombinationsBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n = getRandomInt(3, 5, rng);
  // nC2 = n * (n-1) / 2
  const ans = (n * (n - 1)) / 2;
  return {
    question: `${n}명 중 대표 2명을 뽑는 경우의 수는?`,
    answer: ans,
  };
}

function generateProbAdvanced(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const type = getRandomInt(1, 2, rng);
  if (type === 1) {
    const total = getRandomInt(10, 20, rng);
    const target = getRandomInt(1, total - 1, rng);
    return {
      question: `공이 ${total}개 들어있는 주머니에서 빨간 공이 ${target}개일 때, 공 1개를 뽑아 빨간 공이 아닐 확률(%)은?`,
      answer: Math.round(((total - target) / total) * 100),
    };
  } else {
    return {
      question:
        '주사위 1개를 던질 때, 2의 배수이면서 3의 배수인 눈이 나올 확률(%)은? (소수점 버림)',
      answer: Math.floor((1 / 6) * 100),
    };
  }
}

function generateStatsMaster(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const base = getRandomInt(5, 15, rng);
  const diff = getRandomInt(1, 4, rng);
  const data = [base - 2 * diff, base - diff, base, base + diff, base + 2 * diff].sort(
    (a, b) => a - b
  );
  return {
    question: `데이터 [${data.join(', ')}]의 중앙값과 평균의 합은?`,
    answer: base + base,
  };
}

function generatePermutations(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n = getRandomInt(4, 7, rng);
  const r = 2; // P(n, 2)
  const ans = n * (n - 1);
  return {
    question: `${n}P${r} (서로 다른 ${n}개 중 ${r}개를 선택해 나열하는 경우의 수) 의 값은?`,
    answer: ans,
  };
}

function generateCombinationsAdvanced(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n = getRandomInt(4, 7, rng);
  const r = 3; // C(n, 3)
  const ans = (n * (n - 1) * (n - 2)) / 6;
  return {
    question: `${n}C${r} (서로 다른 ${n}개 중 순서없이 ${r}개를 선택하는 경우의 수) 의 값은?`,
    answer: ans,
  };
}

function generateConditionalProbability(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const a = getRandomInt(2, 5, rng);
  const b = getRandomInt(2, 5, rng);
  return {
    question: `빨간 공 ${a}개, 파란 공 ${b}개가 있다. 두 번 연속 빨간 공을 뽑을 경우의 수(비복원)는?`,
    answer: a * (a - 1),
  };
}

function generateVariance(rng?: { randomInt: (min: number, max: number) => number }): StatsProblem {
  const d = getRandomInt(1, 4, rng);
  const m = getRandomInt(10, 20, rng);
  const arr = [m - 2 * d, m - d, m, m + d, m + 2 * d];
  const variance = 2 * d * d;

  return {
    question: `데이터 ${arr.join(', ')} 의 분산(Variance)은?`,
    answer: variance,
  };
}
