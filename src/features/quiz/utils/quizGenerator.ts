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
  const category = getNormalizedCategory(topicId);

  if (mountainId === 'math') {
    return handleMathMountain(worldId, category, level, difficulty, tier, rng);
  }

  if (mountainId === 'logic') {
    return handleLogicMountain(category, level, difficulty, rng);
  }

  if (mountainId === 'general') {
    return handleGeneralMountain(worldId, category, level, difficulty, rng);
  }

  // Default fallback (Language or others not yet implemented)
  return handleGenericMountain(category, level, difficulty, tier, rng);
}

function getNormalizedCategory(topicId: Topic): Category {
  if (topicId.includes('-')) {
    return topicId.split('-')[1] as Category;
  }
  return topicId as Category;
}

function handleMathMountain(
  worldId: World,
  category: Category,
  level: number,
  difficulty: Difficulty,
  tier: Tier,
  rng?: any
): QuizQuestion {
  if (worldId === 'World1') {
    return handleWorld1(category, level, difficulty, tier, rng);
  }

  if (worldId === 'World2') {
    const geoProb = generateGeometryProblem(level, difficulty, rng);
    return { question: geoProb.question, answer: geoProb.answer, level, category };
  }

  if (worldId === 'World3') {
    const statsProb = generateStatsProblem(level, difficulty, rng);
    return { question: statsProb.question, answer: statsProb.answer, level, category };
  }

  if (worldId === 'World4') {
    const csProb = generateCSProblem(level, difficulty, rng);
    return { question: csProb.question, answer: csProb.answer, level, category };
  }

  // Fallback for unexpected math worlds
  const fallbackMath = generateProblem(level, difficulty, tier, rng);
  return {
    question: fallbackMath.expression,
    answer: fallbackMath.answer,
    level,
    category,
  };
}

function handleWorld1(
  category: Category,
  level: number,
  difficulty: Difficulty,
  tier: Tier,
  rng?: any
): QuizQuestion {
  if (category === '논리') {
    const logicProb = generateLogicProblem(level, difficulty, rng);
    return { question: logicProb.question, answer: logicProb.answer, level, category };
  }

  if (category === '대수') {
    const eqProb = generateEquation(level, difficulty, rng);
    return {
      question: eqProb.question,
      answer: eqProb.x,
      hintType: eqProb.transposition ? 'transposition' : undefined,
      hintData: eqProb.transposition,
      level,
      category,
    };
  }

  if (category === '심화') {
    const calcProb = generateCalculusProblem(level, difficulty, rng);
    return { question: calcProb.question, answer: calcProb.answer, level, category };
  }

  // Default to Basic (기초)
  const mathProb = generateProblem(level, difficulty, tier, rng);
  return {
    question: mathProb.expression,
    answer: mathProb.answer,
    inputType: mathProb.inputType,
    level,
    category,
  };
}

function handleLogicMountain(
  category: Category,
  level: number,
  difficulty: Difficulty,
  rng?: any
): QuizQuestion {
  const logicProb = generateLogicProblem(level, difficulty, rng);
  return {
    question: logicProb.question,
    answer: logicProb.answer,
    level,
    category,
  };
}

function handleGeneralMountain(
  worldId: World,
  category: Category,
  level: number,
  difficulty: Difficulty,
  rng?: any
): QuizQuestion {
  if (worldId === 'World1') {
    const csProb = generateCSProblem(level, difficulty, rng);
    return { question: csProb.question, answer: csProb.answer, level, category };
  }

  if (worldId === 'World2') {
    const calcProb = generateCalculusProblem(level, difficulty, rng);
    return { question: calcProb.question, answer: calcProb.answer, level, category };
  }

  const fallbackLogic = generateLogicProblem(level, difficulty, rng);
  return {
    question: fallbackLogic.question,
    answer: fallbackLogic.answer,
    level,
    category,
  };
}

function handleGenericMountain(
  category: Category,
  level: number,
  difficulty: Difficulty,
  tier: Tier,
  rng?: any
): QuizQuestion {
  const genericProb = generateProblem(level, difficulty, tier, rng);
  return {
    question: genericProb.expression,
    answer: genericProb.answer,
    level,
    category,
  };
}
