import { Category, Topic, QuizQuestion, Difficulty, World } from '../types/quiz';
import { generateRandomNumber } from './math';
import { generateLogicProblem } from './LogicProblemGenerator';
import { generateProblem } from './MathProblemGenerator';
import { generateEquation } from './EquationProblemGenerator';
import { generateGeometryProblem } from './GeometryProblemGenerator';
import { generateStatsProblem } from './StatsProblemGenerator';
import { generateCSProblem } from './CSProblemGenerator';
import { generateCalculusProblem } from './CalculusProblemGenerator';
import { NUMBER_RANGE_BY_DIFFICULTY } from '../constants/game';

/**
 * 카테고리와 월드, 레벨에 따라 문제를 생성합니다.
 */
export function generateQuestion(
  world: World,
  category: Category,
  level: number,
  difficulty: Difficulty
): QuizQuestion {
  const q = (() => {
    switch (world) {
      case 'World1':
        return generateWorld1Question(category, level, difficulty);
      case 'World2':
        return generateWorld2Question(category, level, difficulty);
      case 'World3':
        return generateWorld3Question(category, level, difficulty);
      case 'World4':
        return generateWorld4Question(category, level, difficulty);
      default:
        return generateWorld1Question(category, level, difficulty);
    }
  })();

  return {
    ...q,
    level,
    category,
  };
}

/**
 * World 1: 수와 대수
 */
function generateWorld1Question(
  category: Category,
  level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      // 기존 MathProblemGenerator 활용 (레벨 기반)
      try {
        const problem = generateProblem(level);
        return {
          question: problem.expression,
          answer: problem.answer,
          inputType: problem.inputType,
        };
      } catch {
        const fallback = generateProblem(1);
        return { question: fallback.expression, answer: fallback.answer, inputType: fallback.inputType };
      }
    case '대수':
      // 기존 EquationProblemGenerator 활용
      try {
        const equation = generateEquation(level);
        return {
          question: equation.question,
          answer: equation.x,
          hintType: equation.transposition ? 'transposition' : undefined,
          hintData: equation.transposition,
        };
      } catch {
        const fallback = generateEquation(1);
        return { question: fallback.question, answer: fallback.x };
      }
    case '논리':
      try {
        const logicProblem = generateLogicProblem(level, difficulty);
        return {
          question: logicProblem.question,
          answer: logicProblem.answer,
        };
      } catch {
        const fallback = generateLogicProblem(1, difficulty);
        return { question: fallback.question, answer: fallback.answer };
      }
    case '심화':
      // 심화(Advanced)는 CalculusProblemGenerator 활용
      try {
        const calculusProblem = generateCalculusProblem(level, difficulty);
        return {
          question: calculusProblem.question,
          answer: calculusProblem.answer,
        };
      } catch {
        return { question: '미적분 문제 준비 중...', answer: 0 };
      }
    default:
      return generateMathQuestion('덧셈', difficulty);
  }
}

/**
 * World 2: 도형과 공간
 */
function generateWorld2Question(
  category: Category,
  level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      try {
        const problem = generateGeometryProblem(level, difficulty);
        return {
          question: problem.question,
          answer: problem.answer,
        };
      } catch {
        return generateGeometryBasicQuestion(difficulty);
      }
    case '논리':
      // World 2 논리 레벨 (정사각형 대칭축 등)
      if (level === 9) return { question: '정사각형의 대칭축은 몇 개인가?', answer: 4 };
      if (level === 10) return { question: '정삼각형의 대칭축은 몇 개인가?', answer: 3 };
      return generateGeometryBasicQuestion(difficulty);
    default:
      return { question: '도형 문제 준비 중...', answer: 0 };
  }
}

/**
 * World 3: 확률과 통계
 */
function generateWorld3Question(
  category: Category,
  level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      try {
        const problem = generateStatsProblem(level, difficulty);
        return {
          question: problem.question,
          answer: problem.answer,
        };
      } catch {
        return generateStatsBasicQuestion(difficulty);
      }
    default:
      return { question: '통계 문제 준비 중...', answer: 0 };
  }
}

/**
 * World 4: 공학 및 응용
 */
function generateWorld4Question(
  category: Category,
  level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      try {
        const problem = generateCSProblem(level, difficulty);
        return {
          question: problem.question,
          answer: problem.answer,
        };
      } catch {
        return generateCSBasicQuestion(difficulty);
      }
    case '논리':
      return generateLogicGateQuestion(difficulty);
    default:
      return { question: '공학 문제 준비 중...', answer: 0 };
  }
}

/**
 * World 2: 도형 기초
 */
function generateGeometryBasicQuestion(_difficulty: Difficulty): QuizQuestion {
  const problems = [
    { q: '정삼각형의 한 내각의 크기는? (도)', a: 60 },
    { q: '정사각형의 네 내각의 합은? (도)', a: 360 },
    { q: '오각형의 변의 개수는?', a: 5 },
    { q: '원주율(π)의 근삿값은? (소수점 둘째)', a: 3.14 },
    { q: '반지름이 5인 원의 지름은?', a: 10 },
  ];
  const selected = problems[Math.floor(Math.random() * problems.length)];
  return { question: selected.q, answer: selected.a };
}

/**
 * World 3: 통계 기초
 */
function generateStatsBasicQuestion(_difficulty: Difficulty): QuizQuestion {
  const n1 = generateRandomNumber('easy');
  const n2 = generateRandomNumber('easy');
  const n3 = generateRandomNumber('easy');
  const sum = n1 + n2 + n3;

  const modes = [
    { q: `${n1}, ${n2}, ${n3}의 평균은?`, a: Number((sum / 3).toFixed(0)) },
    { q: '동전 2개를 동시에 던질 때 나오는 경우의 수는?', a: 4 },
    { q: '주사위 1개를 던질 때 짝수가 나올 경우의 수는?', a: 3 },
  ];

  const selected = modes[Math.floor(Math.random() * modes.length)];
  return { question: selected.q, answer: selected.a };
}

/**
 * World 4: 공학 기초 (진법 변환)
 */
function generateCSBasicQuestion(_difficulty: Difficulty): QuizQuestion {
  const num = Math.floor(Math.random() * 15) + 1; // 1~15
  const modes = [
    { q: `10진수 ${num}을(를) 2진수로 바꾸면?`, a: num.toString(2) },
    { q: `2진수 ${num.toString(2)}을(를) 10진수로 바꾸면?`, a: num },
  ];
  const selected = modes[Math.floor(Math.random() * modes.length)];
  return { question: selected.q, answer: selected.a };
}

/**
 * World 4: 논리 게이트
 */
function generateLogicGateQuestion(_difficulty: Difficulty): QuizQuestion {
  const a = Math.random() > 0.5 ? 1 : 0;
  const b = Math.random() > 0.5 ? 1 : 0;
  const gates = [
    { q: `${a} AND ${b} 의 값은?`, a: a && b },
    { q: `${a} OR ${b} 의 값은?`, a: a || b },
    { q: `NOT ${a} 의 값은?`, a: a ? 0 : 1 },
  ];
  const selected = gates[Math.floor(Math.random() * gates.length)];
  return { question: selected.q, answer: selected.a };
}

/**
 * 수학 문제 생성
 */
function generateMathQuestion(
  topic: '덧셈' | '뺄셈' | '곱셈' | '나눗셈' | 'equations' | 'calculus' | Topic,
  difficulty: Difficulty
): QuizQuestion {
  // 방정식 문제 처리
  if (topic === 'equations') {
    const fallback = generateEquation(1);
    return { question: fallback.question, answer: fallback.x };
  }

  // 미적분 문제 처리
  if (topic === 'calculus') {
    return generateCalculusProblem(1, difficulty) as unknown as QuizQuestion;
  }

  // 기존 사칙연산 문제 (0이 나오지 않도록 처리)
  // 0이 나오지 않도록 랜덤 숫자 생성 (최소값 1)
  const generateNonZeroNumber = (difficulty: Difficulty): number => {
    const range = NUMBER_RANGE_BY_DIFFICULTY[difficulty] || NUMBER_RANGE_BY_DIFFICULTY['easy'];
    const { min, max } = range;
    // 최소값이 0이면 1로 변경, 아니면 그대로 사용
    const adjustedMin = min === 0 ? 1 : min;
    return Math.floor(Math.random() * (max - adjustedMin + 1)) + adjustedMin;
  };

  const x = generateNonZeroNumber(difficulty);
  const y = generateNonZeroNumber(difficulty);

  switch (topic) {
    case '덧셈': {
      const answer = x + y;
      return {
        question: `${x} + ${y} = ?`,
        answer,
      };
    }
    case '뺄셈': {
      // 뺄셈은 결과가 음수가 되지 않도록 큰 수에서 작은 수를 빼도록 함
      // 또한 결과가 0이 되지 않도록 함 (a > b가 되도록 보장)
      const [a, b] = x > y ? [x, y] : [y, x];
      // 만약 a === b이면 다시 생성 (0이 되지 않도록)
      if (a === b) {
        const newA = generateNonZeroNumber(difficulty);
        const newB = generateNonZeroNumber(difficulty);
        const [finalA, finalB] = newA > newB ? [newA, newB] : [newB, newA];
        if (finalA === finalB) {
          // 여전히 같으면 a를 1 증가
          const answer = finalA - finalB + 1;
          return {
            question: `${finalA + 1} - ${finalB} = ?`,
            answer,
          };
        }
        const answer = finalA - finalB;
        return {
          question: `${finalA} - ${finalB} = ?`,
          answer,
        };
      }
      const answer = a - b;
      return {
        question: `${a} - ${b} = ?`,
        answer,
      };
    }
    case '곱셈': {
      // 곱셈은 작은 수로 제한하여 너무 큰 수가 나오지 않도록 함
      const a = Math.floor(Math.random() * 12) + 1; // 1~12
      const b = generateNonZeroNumber(difficulty);
      const answer = a * b;
      return {
        question: `${a} × ${b} = ?`,
        answer,
      };
    }
    case '나눗셈': {
      // 나눗셈은 나머지가 0이 되도록 함
      // quotient가 0이 되지 않도록 보장
      const divisor = Math.floor(Math.random() * 12) + 1; // 1~12
      const quotient = generateNonZeroNumber(difficulty);
      const dividend = divisor * quotient;
      return {
        question: `${dividend} ÷ ${divisor} = ?`,
        answer: quotient,
      };
    }
    default:
      // 기본값: 덧셈 문제 반환
      return {
        question: `${x} + ${y} = ?`,
        answer: x + y,
      };
  }
}



