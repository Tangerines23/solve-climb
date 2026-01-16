import { Category, Topic, QuizQuestion, Difficulty, World } from '../types/quiz';
import { generateRandomNumber } from './math';
import { generateLogicProblem } from './LogicProblemGenerator';
import { generateProblem } from './MathProblemGenerator';
import { generateEquation } from './EquationProblemGenerator';
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
        };
      } catch (e) {
        return generateMathQuestion('덧셈', difficulty);
      }
    case '대수':
      // 기존 EquationProblemGenerator 활용
      try {
        const equation = generateEquation(level);
        return {
          question: equation.question,
          answer: equation.x,
        };
      } catch (e) {
        return generateEquationQuestion(difficulty);
      }
    case '논리':
      // 기존 로직 유지 (Topic 기반 폴백 대응)
      return generateLogicQuestion(`World1-논리` as Topic, difficulty);
    case '심화':
      return generateCalculusQuestion(difficulty);
    default:
      return generateMathQuestion('덧셈', difficulty);
  }
}

/**
 * World 2: 도형과 공간
 */
function generateWorld2Question(
  category: Category,
  _level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      return generateGeometryBasicQuestion(difficulty);
    case '논리':
      return { question: '정사각형의 대칭축은 몇 개인가?', answer: 4 };
    default:
      return { question: '도형 문제 준비 중...', answer: 0 };
  }
}

/**
 * World 3: 확률과 통계
 */
function generateWorld3Question(
  category: Category,
  _level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      return generateStatsBasicQuestion(difficulty);
    default:
      return { question: '통계 문제 준비 중...', answer: 0 };
  }
}

/**
 * World 4: 공학 및 응용
 */
function generateWorld4Question(
  category: Category,
  _level: number,
  difficulty: Difficulty
): QuizQuestion {
  switch (category) {
    case '기초':
      return generateCSBasicQuestion(difficulty);
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
    return generateEquationQuestion(difficulty);
  }

  // 미적분 문제 처리
  if (topic === 'calculus') {
    return generateCalculusQuestion(difficulty);
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

/**
    return {
      question: `${languageType} ${subTopic} 문제 (개발 중)`,
      answer: 0,
    };
  }

  // 기존 형식 (맞춤법, 어휘, 속담)
  return {
    question: `${topic} 문제 (개발 중)`,
    answer: 0,
  };
}

/**
 * 논리 문제 생성
 */
function generateLogicQuestion(topic: Topic, difficulty: Difficulty): QuizQuestion {
  const problem = generateLogicProblem(topic as string, difficulty);
  return {
    question: problem.question,
    answer: problem.answer,
  };
}

/**
 * 상식 문제 생성
 */

/**
 * 방정식 문제 생성
 */
function generateEquationQuestion(difficulty: Difficulty): QuizQuestion {
  const type = Math.floor(Math.random() * 4); // 0~3: 일차, 이차, 연립, 부등식

  switch (type) {
    case 0: // 일차 방정식: x + a = b 또는 ax + b = c
      return generateLinearEquation(difficulty);
    case 1: // 이차 방정식: x² = a 또는 x² + ax + b = 0
      return generateQuadraticEquation(difficulty);
    case 2: // 연립 방정식
      return generateSystemEquation(difficulty);
    case 3: // 부등식
      return generateInequality(difficulty);
    default:
      return generateLinearEquation(difficulty);
  }
}

/**
 * 일차 방정식 생성: x + a = b 또는 ax + b = c
 */
function generateLinearEquation(difficulty: Difficulty): QuizQuestion {
  const isSimple = Math.random() < 0.5; // 50% 확률로 간단한 형태

  if (isSimple) {
    // x + a = b 형태
    const a = generateRandomNumber(difficulty);
    const x = generateRandomNumber(difficulty);
    const b = x + a;

    return {
      question: `x + ${a} = ${b}`,
      answer: x,
    };
  } else {
    // ax + b = c 형태
    const coefficient = Math.floor(Math.random() * 9) + 2; // 2~10
    const x = generateRandomNumber(difficulty);
    const b = generateRandomNumber(difficulty);
    const c = coefficient * x + b;

    return {
      question: `${coefficient}x + ${b} = ${c}`,
      answer: x,
    };
  }
}

/**
 * 이차 방정식 생성: x² = a 또는 x² + ax + b = 0
 */
function generateQuadraticEquation(_difficulty: Difficulty): QuizQuestion {
  const isSimple = Math.random() < 0.5; // 50% 확률로 간단한 형태

  if (isSimple) {
    // x² = a 형태 (a는 완전제곱수)
    const x = Math.floor(Math.random() * 10) + 1; // 1~10
    const a = x * x;

    return {
      question: `x² = ${a}`,
      answer: x, // 양수 해만 반환
    };
  } else {
    // x² + ax + b = 0 형태 (인수분해 가능한 형태)
    const x1 = Math.floor(Math.random() * 10) - 5; // -5~5
    const x2 = Math.floor(Math.random() * 10) - 5; // -5~5
    const a = -(x1 + x2);
    const b = x1 * x2;

    // 더 작은 해를 답으로 사용 (정수 해만)
    const answer = Math.min(x1, x2);

    return {
      question: `x² + ${a}x + ${b} = 0`,
      answer: answer,
    };
  }
}

/**
 * 연립 방정식 생성: 두 개의 일차 방정식
 */
function generateSystemEquation(difficulty: Difficulty): QuizQuestion {
  // x + y = a, x - y = b 형태로 생성
  const x = generateRandomNumber(difficulty);
  const y = generateRandomNumber(difficulty);
  const a = x + y;
  const b = x - y;

  return {
    question: `x + y = ${a}, x - y = ${b}`,
    answer: x, // x 값을 답으로
  };
}

/**
 * 부등식 생성: x > a, x < a, x ≥ a, x ≤ a
 */
function generateInequality(difficulty: Difficulty): QuizQuestion {
  const types = ['>', '<', '≥', '≤'];
  const type = types[Math.floor(Math.random() * types.length)];
  const a = generateRandomNumber(difficulty);

  // 부등식을 만족하는 정수 해 중 하나를 답으로
  let answer: number;
  switch (type) {
    case '>':
      answer = a + 1;
      break;
    case '<':
      answer = a - 1;
      break;
    case '≥':
      answer = a;
      break;
    case '≤':
      answer = a;
      break;
    default:
      answer = a + 1;
  }

  return {
    question: `x ${type} ${a}`,
    answer: answer,
  };
}

/**
 * 미적분 문제 생성
 */
function generateCalculusQuestion(difficulty: Difficulty): QuizQuestion {
  // 난이도에 따라 문제 유형 결정
  // easy: 기본 미분, medium: 합/차/곱, hard: 삼각함수/지수함수
  const rand = Math.random();

  if (difficulty === 'easy') {
    // 기본 미분: x^n, ax^n
    if (rand < 0.5) {
      return generateBasicDerivative();
    } else {
      return generateConstantMultipleDerivative();
    }
  } else if (difficulty === 'medium') {
    // 합/차/곱의 미분
    const type = Math.floor(Math.random() * 4);
    if (type === 0) {
      return generateSumDerivative();
    } else if (type === 1) {
      return generateDifferenceDerivative();
    } else if (type === 2) {
      return generateProductDerivative();
    } else {
      return generateConstantMultipleDerivative();
    }
  } else {
    // hard: 삼각함수, 지수함수, 합성함수, 복합함수
    const type = Math.floor(Math.random() * 5);
    if (type === 0) {
      return generateTrigonometricDerivative();
    } else if (type === 1) {
      return generateExponentialDerivative();
    } else if (type === 2) {
      return generateCompositeDerivative();
    } else if (type === 3) {
      return generateMixedTrigonometricDerivative();
    } else {
      return generateProductDerivative();
    }
  }
}

/**
 * 기본 미분: d/dx(x^n) = nx^(n-1) (특정 x 값에서의 미분값)
 */
function generateBasicDerivative(): QuizQuestion {
  const n = Math.floor(Math.random() * 4) + 2; // 2~5
  const x = Math.floor(Math.random() * 5) + 1; // 1~5
  const answer = n * Math.pow(x, n - 1);

  return {
    question: `d/dx(x^${n}) = ? (x=${x}일 때)`,
    answer: answer,
  };
}

/**
 * 상수배 미분: d/dx(ax^n) = anx^(n-1) (x=1일 때 값)
 */
function generateConstantMultipleDerivative(): QuizQuestion {
  const a = Math.floor(Math.random() * 5) + 2; // 2~6
  const n = Math.floor(Math.random() * 4) + 2; // 2~5
  const answer = a * n;

  return {
    question: `d/dx(${a}x^${n}) = ? (x=1일 때)`,
    answer: answer,
  };
}

/**
 * 합의 미분: d/dx(x^n + x^m) = nx^(n-1) + mx^(m-1) (x=1일 때 값)
 */
function generateSumDerivative(): QuizQuestion {
  const n = Math.floor(Math.random() * 4) + 2; // 2~5
  const m = Math.floor(Math.random() * 4) + 2; // 2~5
  const answer = n + m;

  return {
    question: `d/dx(x^${n} + x^${m}) = ? (x=1일 때)`,
    answer: answer,
  };
}

/**
 * 곱의 미분: d/dx(x^n · x^m) = (n+m)x^(n+m-1) (x=1일 때 값)
 */
function generateProductDerivative(): QuizQuestion {
  const n = Math.floor(Math.random() * 3) + 2; // 2~4
  const m = Math.floor(Math.random() * 3) + 2; // 2~4
  const answer = n + m;

  return {
    question: `d/dx(x^${n} · x^${m}) = ? (x=1일 때)`,
    answer: answer,
  };
}

/**
 * 삼각함수 미분: d/dx(sin(x)) = cos(x), d/dx(cos(x)) = -sin(x)
 * 정수 답이 나오는 특정 값만 사용
 */
function generateTrigonometricDerivative(): QuizQuestion {
  const type = Math.random() < 0.5 ? 'sin' : 'cos';

  if (type === 'sin') {
    // d/dx(sin(x)) = cos(x)
    // x=0일 때: cos(0) = 1
    // x=π/2일 때: cos(π/2) = 0
    const useZero = Math.random() < 0.5;

    if (useZero) {
      return {
        question: `d/dx(sin(x)) = ? (x=0일 때)`,
        answer: 1,
      };
    } else {
      return {
        question: `d/dx(sin(x)) = ? (x=π/2일 때)`,
        answer: 0,
      };
    }
  } else {
    // d/dx(cos(x)) = -sin(x)
    // x=0일 때: -sin(0) = 0
    // x=π/2일 때: -sin(π/2) = -1
    const useZero = Math.random() < 0.5;

    if (useZero) {
      return {
        question: `d/dx(cos(x)) = ? (x=0일 때)`,
        answer: 0,
      };
    } else {
      return {
        question: `d/dx(cos(x)) = ? (x=π/2일 때)`,
        answer: -1,
      };
    }
  }
}

/**
 * 지수함수 미분: d/dx(e^x) = e^x, d/dx(ln(x)) = 1/x (x=1일 때 값)
 */
function generateExponentialDerivative(): QuizQuestion {
  const type = Math.random() < 0.5 ? 'exp' : 'ln';

  if (type === 'exp') {
    // d/dx(e^x) = e^x, x=0일 때 e^0 = 1
    return {
      question: `d/dx(e^x) = ? (x=0일 때)`,
      answer: 1,
    };
  } else {
    // d/dx(ln(x)) = 1/x, x=1일 때 1/1 = 1
    return {
      question: `d/dx(ln(x)) = ? (x=1일 때)`,
      answer: 1,
    };
  }
}

/**
 * 차의 미분: d/dx(x^n - x^m) = nx^(n-1) - mx^(m-1) (x=1일 때 값)
 */
function generateDifferenceDerivative(): QuizQuestion {
  const n = Math.floor(Math.random() * 4) + 3; // 3~6
  const m = Math.floor(Math.random() * 3) + 2; // 2~4
  const answer = n - m;

  return {
    question: `d/dx(x^${n} - x^${m}) = ? (x=1일 때)`,
    answer: answer,
  };
}

/**
 * 합성함수 미분: d/dx((x^n)^m) = nmx^(nm-1) (x=1일 때 값)
 */
function generateCompositeDerivative(): QuizQuestion {
  const n = Math.floor(Math.random() * 3) + 2; // 2~4
  const m = Math.floor(Math.random() * 2) + 2; // 2~3
  const answer = n * m;

  return {
    question: `d/dx((x^${n})^${m}) = ? (x=1일 때)`,
    answer: answer,
  };
}

/**
 * 삼각함수와 다항식 조합: d/dx(x^n · sin(x)) 또는 d/dx(x^n · cos(x)) (x=0일 때 값)
 */
function generateMixedTrigonometricDerivative(): QuizQuestion {
  const type = Math.random() < 0.5 ? 'sin' : 'cos';
  const n = Math.floor(Math.random() * 3) + 2; // 2~4

  if (type === 'sin') {
    // d/dx(x^n · sin(x)) = nx^(n-1)sin(x) + x^ncos(x)
    // x=0일 때: n·0^(n-1)·sin(0) + 0^n·cos(0) = 0 (n>1인 경우)
    // n=2일 때: 2x·sin(x) + x²·cos(x), x=0일 때 = 0
    return {
      question: `d/dx(x^${n} · sin(x)) = ? (x=0일 때)`,
      answer: 0,
    };
  } else {
    // d/dx(x^n · cos(x)) = nx^(n-1)cos(x) - x^nsin(x)
    // x=0일 때: n·0^(n-1)·cos(0) - 0^n·sin(0) = 0 (n>1인 경우)
    return {
      question: `d/dx(x^${n} · cos(x)) = ? (x=0일 때)`,
      answer: 0,
    };
  }
}
