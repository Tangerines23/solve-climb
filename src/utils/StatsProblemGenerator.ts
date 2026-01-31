import { Difficulty } from '../types/quiz';

export interface StatsProblem {
  question: string;
  answer: number | string;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateStatsProblem(level: number, _difficulty: Difficulty): StatsProblem {
  switch (level) {
    case 1:
      return generateMeanBasic();
    case 2:
      return generateMedianBasic();
    case 3:
      return generateModeBasic();
    case 4:
      return generateProbCoin();
    case 5:
      return generateProbDice();
    case 6:
      return generateProbMarbles();
    case 7:
      return generateStatsRange();
    case 8:
      return generateCombinationsBasic();
    case 9:
      return generateProbAdvanced();
    case 10:
      return generateStatsMaster();
    default:
      return generateMeanBasic();
  }
}

function generateMeanBasic(): StatsProblem {
  const n1 = getRandomInt(1, 10);
  const n2 = getRandomInt(1, 10);
  const n3 = getRandomInt(1, 10);
  const avg = (n1 + n2 + n3) / 3;

  if (!Number.isInteger(avg)) return generateMeanBasic();

  return {
    question: `${n1}, ${n2}, ${n3}의 평균은?`,
    answer: avg,
  };
}

function generateMedianBasic(): StatsProblem {
  const nums = [getRandomInt(1, 20), getRandomInt(1, 20), getRandomInt(1, 20)].sort(
    (a, b) => a - b
  );
  return {
    question: `${nums[0]}, ${nums[1]}, ${nums[2]} 세 수 중 중앙값(Median)은?`,
    answer: nums[1],
  };
}

function generateModeBasic(): StatsProblem {
  const base = getRandomInt(1, 10);
  const nums = [base, base, getRandomInt(1, 10), getRandomInt(1, 10)].sort();
  // Ensure mode is unique
  const counts = new Map<number, number>();
  nums.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
  const mode = Array.from(counts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a));

  return {
    question: `${nums.join(', ')} 중 최빈값(Mode)은?`,
    answer: Number(mode[0]),
  };
}

function generateProbCoin(): StatsProblem {
  const coins = getRandomInt(1, 3);
  return {
    question: `동전 ${coins}개를 동시에 던질 때, 나올 수 있는 모든 경우의 수는?`,
    answer: Math.pow(2, coins),
  };
}

function generateProbDice(): StatsProblem {
  const type = Math.random() > 0.5 ? 'sum' : 'count';
  if (type === 'sum') {
    return { question: '주사위 2개를 던질 때, 합이 7이 되는 경우의 수는?', answer: 6 };
  } else {
    return { question: '주사위 1개를 던질 때, 3의 배수가 나올 경우의 수는?', answer: 2 };
  }
}

function generateProbMarbles(): StatsProblem {
  const red = getRandomInt(2, 5);
  const blue = getRandomInt(2, 5);
  return {
    question: `빨간 공 ${red}개, 파란 공 ${blue}개가 든 주머니에서 공 1개를 뽑을 때, 빨간 공이 나올 경우의 수?`,
    answer: red,
  };
}

function generateStatsRange(): StatsProblem {
  const nums = Array.from({ length: 4 }, () => getRandomInt(1, 50));
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  return {
    question: `${nums.join(', ')} 중 최댓값과 최솟값의 차이(범위)는?`,
    answer: max - min,
  };
}

function generateCombinationsBasic(): StatsProblem {
  const n = getRandomInt(3, 5);
  // nC2 = n * (n-1) / 2
  const ans = (n * (n - 1)) / 2;
  return {
    question: `${n}명 중 대표 2명을 뽑는 경우의 수는?`,
    answer: ans,
  };
}

function generateProbAdvanced(): StatsProblem {
  return {
    question: '주사위 1개를 던질 때, 7 이상의 눈이 나올 확률(%)은?',
    answer: 0,
  };
}

function generateStatsMaster(): StatsProblem {
  return {
    question: '데이터 2, 4, 6, 8, 10의 평균은?',
    answer: 6,
  };
}
