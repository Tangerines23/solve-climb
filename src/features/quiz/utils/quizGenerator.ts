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
  // Category is often equivalent to topicId in current UI flow
  // but we should normalize it to Category type if it's in Topic format (WorldX-Category)
  let category: Category;
  if (topicId.includes('-')) {
    category = topicId.split('-')[1] as Category;
  } else {
    category = topicId as Category;
  }

  if (mountainId === 'math') {
    switch (worldId) {
      case 'World1': {
        // World 1 is partitioned by Category
        if (category === '논리') {
          const logicProb = generateLogicProblem(level, difficulty, rng);
          return {
            question: logicProb.question,
            answer: logicProb.answer,
            level,
            category,
          };
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
          return {
            question: calcProb.question,
            answer: calcProb.answer,
            level,
            category,
          };
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

      case 'World2': {
        // Geometry World
        const geoProb = generateGeometryProblem(level, difficulty, rng);
        return {
          question: geoProb.question,
          answer: geoProb.answer,
          level,
          category,
        };
      }

      case 'World3': {
        // Stats World
        const statsProb = generateStatsProblem(level, difficulty, rng);
        return {
          question: statsProb.question,
          answer: statsProb.answer,
          level,
          category,
        };
      }

      case 'World4': {
        // CS/Engineering World
        const csProb = generateCSProblem(level, difficulty, rng);
        return {
          question: csProb.question,
          answer: csProb.answer,
          level,
          category,
        };
      }

      default: {
        // Fallback for unexpected math worlds
        const fallbackMath = generateProblem(level, difficulty, tier, rng);
        return {
          question: fallbackMath.expression,
          answer: fallbackMath.answer,
          level,
          category,
        };
      }
    }
  } else if (mountainId === 'logic') {
    // Independent Logic Mountain (if ever used)
    const logicProb = generateLogicProblem(level, difficulty, rng);
    return {
      question: logicProb.question,
      answer: logicProb.answer,
      level,
      category,
    };
  } else if (mountainId === 'general') {
    // General Knowledge / Science Mountain
    if (worldId === 'World1') {
      const csProb = generateCSProblem(level, difficulty, rng);
      return {
        question: csProb.question,
        answer: csProb.answer,
        level,
        category,
      };
    } else if (worldId === 'World2') {
      const calcProb = generateCalculusProblem(level, difficulty, rng);
      return {
        question: calcProb.question,
        answer: calcProb.answer,
        level,
        category,
      };
    }
    const fallbackLogic = generateLogicProblem(level, difficulty, rng);
    return {
      question: fallbackLogic.question,
      answer: fallbackLogic.answer,
      level,
      category,
    };
  } else {
    // Default fallback (Language or others not yet implemented with specialized generators)
    const genericProb = generateProblem(level, difficulty, tier, rng);
    return {
      question: genericProb.expression,
      answer: genericProb.answer,
      level,
      category,
    };
  }
}
