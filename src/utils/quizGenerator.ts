import { Category, Topic, QuizQuestion, Difficulty, World, Mountain } from '../types/quiz';
import { generateProblem } from './MathProblemGenerator';
import { generateEquation } from './EquationProblemGenerator';
import { generateGeometryProblem } from './GeometryProblemGenerator';
import { generateStatsProblem } from './StatsProblemGenerator';
import { generateLogicProblem } from './LogicProblemGenerator';
import { generateCSProblem } from './CSProblemGenerator';
import { generateCalculusProblem } from './CalculusProblemGenerator';

/**
 * 카테고리와 월드, 레벨에 따라 문제를 생성합니다.
 */
export function generateQuestion(
  mountainId: Mountain,
  worldId: World,
  topicId: Topic,
  level: number,
  difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): QuizQuestion {
  let problem: any;

  // dispatch based on mountain and world
  if (mountainId === 'math') {
    if (worldId === 'World1') {
      problem = generateProblem(level, difficulty, rng);
      return {
        question: problem.expression,
        answer: problem.answer,
        inputType: problem.inputType,
        level,
        category: topicId as any,
      };
    } else if (worldId === 'World2') {
      problem = generateEquation(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.x,
        hintType: problem.transposition ? 'transposition' : undefined,
        hintData: problem.transposition,
        level,
        category: topicId as any,
      };
    } else if (worldId === 'World3') {
      problem = generateGeometryProblem(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    } else if (worldId === 'World4') {
      problem = generateStatsProblem(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    } else {
      problem = generateProblem(level, difficulty, rng);
      return {
        question: problem.expression,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    }
  } else if (mountainId === 'logic') {
    problem = generateLogicProblem(level, difficulty, rng);
    return {
      question: problem.question,
      answer: problem.answer,
      level,
      category: topicId as any,
    };
  } else if (mountainId === 'general') {
    if (worldId === 'World1') {
      problem = generateCSProblem(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    } else if (worldId === 'World2') {
      problem = generateCalculusProblem(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    } else {
      problem = generateLogicProblem(level, difficulty, rng);
      return {
        question: problem.question,
        answer: problem.answer,
        level,
        category: topicId as any,
      };
    }
  } else {
    // default/fallback
    problem = generateProblem(level, difficulty, rng);
    return {
      question: problem.expression,
      answer: problem.answer,
      level,
      category: topicId as any,
    };
  }
}

// Legacy compatibility functions (could be moved or cleaned up later)
export function generateWorld1Question(c: Category, l: number, d: Difficulty) {
  return generateQuestion('math', 'World1', c as any, l, d);
}
export function generateWorld2Question(c: Category, l: number, d: Difficulty) {
  return generateQuestion('math', 'World3', c as any, l, d); // Geometry was World3 in new mapping
}
export function generateWorld3Question(c: Category, l: number, d: Difficulty) {
  return generateQuestion('math', 'World4', c as any, l, d); // Stats was World4
}
export function generateWorld4Question(c: Category, l: number, d: Difficulty) {
  return generateQuestion('general', 'World1', c as any, l, d); // CS was General World1
}
