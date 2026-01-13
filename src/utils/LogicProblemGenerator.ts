import { Difficulty } from '../types/quiz';

export interface LogicProblem {
  question: string;
  answer: number;
}

type SequenceType = 'arithmetic' | 'geometric' | 'fibonacci' | 'incrementing_diff' | 'alternating';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSequenceProblem(difficulty: Difficulty): LogicProblem {
  const types: SequenceType[] = [];

  // 난이도별 문제 유형 정의
  if (difficulty === 'easy') {
    types.push('arithmetic', 'geometric');
  } else if (difficulty === 'medium') {
    types.push('arithmetic', 'geometric', 'fibonacci');
  } else {
    types.push('fibonacci', 'incrementing_diff', 'alternating');
  }

  const type = types[Math.floor(Math.random() * types.length)];
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

export function generateLogicProblem(_topic: string, difficulty: Difficulty): LogicProblem {
  // 현재는 '수열' 위주로 구현, 추후 '패턴' 등 확장 가능
  return generateSequenceProblem(difficulty);
}
