import { Topic, QuizQuestion, Difficulty, World, Mountain, Category, Tier } from '../types/quiz';
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
  tier: Tier = 'normal',
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): QuizQuestion {
  // dispatch based on mountain and world
  if (mountainId === 'math') {
    if (worldId === 'World1') {
      const mathProb = generateProblem(level, difficulty, tier, rng);
      return {
        question: mathProb.expression,
        answer: mathProb.answer,
        inputType: mathProb.inputType,
        level,
        category: topicId as unknown as Category,
      };
    } else if (worldId === 'World2') {
      const eqProb = generateEquation(level, difficulty, rng);
      return {
        question: eqProb.question,
        answer: eqProb.x,
        hintType: eqProb.transposition ? 'transposition' : undefined,
        hintData: eqProb.transposition,
        level,
        category: topicId as unknown as Category,
      };
    } else if (worldId === 'World3') {
      const geoProb = generateGeometryProblem(level, difficulty, rng);
      return {
        question: geoProb.question,
        answer: geoProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    } else if (worldId === 'World4') {
      const statsProb = generateStatsProblem(level, difficulty, rng);
      return {
        question: statsProb.question,
        answer: statsProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    } else {
      const mathProb = generateProblem(level, difficulty, tier, rng);
      return {
        question: mathProb.expression,
        answer: mathProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    }
  } else if (mountainId === 'logic') {
    const logicProb = generateLogicProblem(level, difficulty, rng);
    return {
      question: logicProb.question,
      answer: logicProb.answer,
      level,
      category: topicId as unknown as Category,
    };
  } else if (mountainId === 'general') {
    if (worldId === 'World1') {
      const csProb = generateCSProblem(level, difficulty, rng);
      return {
        question: csProb.question,
        answer: csProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    } else if (worldId === 'World2') {
      const calcProb = generateCalculusProblem(level, difficulty, rng);
      return {
        question: calcProb.question,
        answer: calcProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    } else {
      const logicProb = generateLogicProblem(level, difficulty, rng);
      return {
        question: logicProb.question,
        answer: logicProb.answer,
        level,
        category: topicId as unknown as Category,
      };
    }
  } else {
    // default/fallback
    const mathProb = generateProblem(level, difficulty, tier, rng);
    return {
      question: mathProb.expression,
      answer: mathProb.answer,
      level,
      category: topicId as unknown as Category,
    };
  }
}
