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
  if (rng) return rng.randomInt(min, max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateStatsProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): StatsProblem {
  if (level > 15) {
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
      return generateMeanExtended(rng);
    case 3:
      return generateMedianBasic(rng);
    case 4:
      return generateModeBasic(rng);
    case 5:
      return generateProbCoin(rng);
    case 6:
      return generateProbRPS(rng);
    case 7:
      return generateProbDice(rng);
    case 8:
      return generateCombinationsBasic(rng);
    case 9:
      return generatePermutationsBasic(rng);
    case 10:
      return generateProbBasic(rng);
    case 11:
      return generateProbAdvanced(rng);
    case 12:
      return generateProbUnionIntersection(rng);
    case 13:
      return generateStatsRange(rng);
    case 14:
      return generateNoReplaceCount(rng);
    case 15:
      return generateNoReplaceProb(rng);
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
  let other1 = getRandomInt(1, 10, rng);
  while (other1 === base) {
    other1 = getRandomInt(1, 10, rng);
  }
  let other2 = getRandomInt(1, 10, rng);
  while (other2 === base || other2 === other1) {
    other2 = getRandomInt(1, 10, rng);
  }

  // base가 2번, other1과 other2가 각 1번씩 포함되어 base가 유일한 최빈값이 됨
  const nums = [base, base, other1, other2].sort((a, b) => a - b);

  return {
    question: `${nums.join(', ')} 중 최빈값(Mode)은?`,
    answer: base,
  };
}

function generateProbCoin(rng?: { randomInt: (min: number, max: number) => number }): StatsProblem {
  const coins = getRandomInt(1, 3, rng);
  return {
    question: `동전 ${coins}개를 동시에 던질 때, 나올 수 있는 모든 경우의 수는?`,
    answer: Math.pow(2, coins),
  };
}

function generateProbDice(rng?: { randomInt: (min: number, max: number) => number }): StatsProblem {
  const s = getRandomInt(2, 12, rng);
  const ans = 6 - Math.abs(s - 7);
  return {
    question: `주사위 2개를 동시에 던질 때, 두 눈의 합이 ${s}가 되는 경우의 수는?`,
    answer: ans,
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
  const totals = [2, 4, 5, 10];
  const total = totals[getRandomInt(0, totals.length - 1, rng)];
  const red = getRandomInt(1, total - 1, rng);
  const percentageOfNotRed = ((total - red) / total) * 100;
  return {
    question: `전체 제품 ${total}개 중 불량품이 ${red}개 있다. 이 중 임의로 1개를 고를 때, 정상 제품일 확률은? (%)`,
    answer: percentageOfNotRed,
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

function generateMeanExtended(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n1 = getRandomInt(1, 20, rng);
  const n2 = getRandomInt(1, 20, rng);
  const n3 = getRandomInt(1, 20, rng);
  const n4 = getRandomInt(1, 20, rng);
  const avg = (n1 + n2 + n3 + n4) / 4;
  if (!Number.isInteger(avg)) return generateMeanExtended(rng);
  return {
    question: `${n1}, ${n2}, ${n3}, ${n4}의 평균은?`,
    answer: avg,
  };
}

function generateProbRPS(rng?: { randomInt: (min: number, max: number) => number }): StatsProblem {
  const people = getRandomInt(1, 3, rng);
  return {
    question: `${people}명이 가위바위보를 할 때, 나올 수 있는 모든 경우의 수는?`,
    answer: Math.pow(3, people),
  };
}

function generatePermutationsBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const isFactorial = getRandomInt(0, 1, rng) === 1;
  if (isFactorial) {
    const n = getRandomInt(3, 4, rng);
    let ans = 1;
    for (let i = 1; i <= n; i++) ans *= i;
    return {
      question: `${n}명의 학생을 한 줄로 세우는 모든 경우의 수는?`,
      answer: ans,
    };
  } else {
    const n = getRandomInt(4, 6, rng);
    const ans = n * (n - 1);
    return {
      question: `학생 ${n}명 중 반장 1명, 부반장 1명을 뽑아 세우는 경우의 수는?`,
      answer: ans,
    };
  }
}

function generateProbBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const totals = [2, 4, 5, 10];
  const total = totals[getRandomInt(0, totals.length - 1, rng)];
  const target = getRandomInt(1, total - 1, rng);
  const percentage = (target / total) * 100;
  return {
    question: `바구니에 공이 총 ${total}개 들어있다. 이 중 당첨 공이 ${target}개일 때, 임의로 1개를 뽑아 당첨 공이 나올 확률은? (%)`,
    answer: percentage,
  };
}

function generateProbUnionIntersection(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const isAnd = getRandomInt(0, 1, rng) === 1;
  if (isAnd) {
    const select = getRandomInt(1, 2, rng);
    if (select === 1) {
      return {
        question: `동전 1개와 주사위 1개를 동시에 던질 때, 동전은 앞면이 나오고 주사위는 홀수 눈이 나올 확률은? (%)`,
        answer: 25,
      };
    } else {
      return {
        question: `동전 2개를 동시에 던질 때, 두 동전 모두 앞면이 나올 확률은? (%)`,
        answer: 25,
      };
    }
  } else {
    const select = getRandomInt(1, 2, rng);
    if (select === 1) {
      return {
        question: `1부터 10까지 적힌 카드 10장 중 임의로 1장을 뽑을 때, 2의 배수이거나 9가 적힌 카드를 뽑을 확률은? (%)`,
        answer: 60,
      };
    } else {
      return {
        question: `1부터 10까지 적힌 카드 10장 중 임의로 1장을 뽑을 때, 3의 배수이거나 10이 적힌 카드를 뽑을 확률은? (%)`,
        answer: 40,
      };
    }
  }
}

function generateNoReplaceCount(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const n = getRandomInt(3, 6, rng);
  const ans = n * (n - 1);
  return {
    question: `빨간 공 ${n}개가 들어있는 주머니에서 공을 꺼내고 다시 넣지 않는 방법으로 차례대로 공 2개를 꺼낼 때, 가능한 모든 경우의 수는?`,
    answer: ans,
  };
}

function generateNoReplaceProb(rng?: {
  randomInt: (min: number, max: number) => number;
}): StatsProblem {
  const select = getRandomInt(1, 3, rng);
  if (select === 1) {
    return {
      question: `주머니에 빨간 공 3개, 파란 공 2개가 들어있다. 꺼낸 공을 다시 넣지 않고 차례대로 공 2개를 꺼낼 때, 두 공 모두 빨간 공일 확률은? (%)`,
      answer: 30,
    };
  } else if (select === 2) {
    return {
      question: `주머니에 빨간 공 3개, 파란 공 3개가 들어있다. 꺼낸 공을 다시 넣지 않고 차례대로 공 2개를 꺼낼 때, 두 공 모두 빨간 공일 확률은? (%)`,
      answer: 20,
    };
  } else {
    return {
      question: `주머니에 빨간 공 4개, 파란 공 2개가 들어있다. 꺼낸 공을 다시 넣지 않고 차례대로 공 2개를 꺼낼 때, 두 공 모두 빨간 공일 확률은? (%)`,
      answer: 40,
    };
  }
}
