import { Topic, QuizQuestion, Difficulty, World, Mountain, Category, Tier } from '../types/quiz';
import { generateProblem } from './MathProblemGenerator';
import { generateEquation } from './EquationProblemGenerator';
import { generateGeometryProblem } from './GeometryProblemGenerator';
import { generateStatsProblem } from './StatsProblemGenerator';
import { generateLogicProblem } from './LogicProblemGenerator';
import { generateCSProblem } from './CSProblemGenerator';
import { generateCalculusProblem } from './CalculusProblemGenerator';

/**
 * 토픽 문자열(WorldX-Category 또는 Category)에서 안전하게 Category를 정규화합니다.
 */
export function normalizeTopicCategory(topicId?: string | null): Category {
  if (!topicId || typeof topicId !== 'string') return '기초';
  if (topicId.includes('-')) return (topicId.split('-')[1] || '기초') as Category;
  return topicId as Category;
}

/**
 * 정답 형식에 따라 적절한 입력 UI 타입(fraction, decimal, number)을 추론합니다.
 */
export function inferInputType(answer: string | number): 'fraction' | 'decimal' | 'number' {
  const ansStr = String(answer ?? '');
  if (ansStr.includes('/')) return 'fraction';
  if (ansStr.includes('.')) return 'decimal';
  return 'number';
}

/**
 * 레벨 번호를 1 ~ 10 범위로 안전하게 클램핑합니다.
 */
export function clampLevel(level: number): number {
  if (typeof level !== 'number' || Number.isNaN(level)) return 1;
  return Math.max(1, Math.min(10, Math.floor(level)));
}

/**
 * 카테고리와 월드, 레벨에 따라 퀴즈 문제를 생성합니다.
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
  const category = normalizeTopicCategory(topicId);
  const safeLevel = clampLevel(level);

  if (mountainId === 'math') {
    switch (worldId) {
      case 'World1': {
        if (category === '논리') {
          const logicProb = generateLogicProblem(safeLevel, difficulty, rng);
          return {
            question: logicProb.question,
            answer: logicProb.answer,
            level: safeLevel,
            category,
          };
        }
        if (category === '대수') {
          const eqProb = generateEquation(safeLevel, difficulty, rng);
          return {
            question: eqProb.question,
            answer: eqProb.x,
            hintType: eqProb.transposition ? 'transposition' : undefined,
            hintData: eqProb.transposition,
            level: safeLevel,
            category,
          };
        }
        if (category === '심화') {
          const calcProb = generateCalculusProblem(safeLevel, difficulty, rng);
          return {
            question: calcProb.question,
            answer: calcProb.answer,
            level: safeLevel,
            category,
          };
        }
        const mathProb = generateProblem(safeLevel, difficulty, tier, rng);
        return {
          question: mathProb.expression,
          answer: mathProb.answer,
          inputType: mathProb.inputType,
          level: safeLevel,
          category,
        };
      }
      case 'World2': {
        const geoProb = generateGeometryProblem(safeLevel, difficulty, rng);
        return {
          question: geoProb.question,
          answer: geoProb.answer,
          inputType: geoProb.inputType || inferInputType(geoProb.answer),
          hintType: geoProb.hintType,
          hintData: geoProb.hintData,
          level: safeLevel,
          category,
        };
      }
      case 'World3': {
        const statsProb = generateStatsProblem(safeLevel, difficulty, rng);
        return {
          question: statsProb.question,
          answer: statsProb.answer,
          level: safeLevel,
          category,
        };
      }
      case 'World4': {
        const csProb = generateCSProblem(safeLevel, difficulty, rng);
        return {
          question: csProb.question,
          answer: csProb.answer,
          inputType: csProb.inputType || inferInputType(csProb.answer),
          level: safeLevel,
          category,
        };
      }
      default: {
        const fallbackMath = generateProblem(safeLevel, difficulty, tier, rng);
        return {
          question: fallbackMath.expression,
          answer: fallbackMath.answer,
          level: safeLevel,
          category,
        };
      }
    }
  }
  if (mountainId === 'logic') {
    const logicProb = generateLogicProblem(safeLevel, difficulty, rng);
    return { question: logicProb.question, answer: logicProb.answer, level: safeLevel, category };
  }
  if (mountainId === 'general') {
    if (worldId === 'World1') {
      const csProb = generateCSProblem(safeLevel, difficulty, rng);
      return { question: csProb.question, answer: csProb.answer, level: safeLevel, category };
    }
    if (worldId === 'World2') {
      const calcProb = generateCalculusProblem(safeLevel, difficulty, rng);
      return { question: calcProb.question, answer: calcProb.answer, level: safeLevel, category };
    }
    const fallbackLogic = generateLogicProblem(safeLevel, difficulty, rng);
    return {
      question: fallbackLogic.question,
      answer: fallbackLogic.answer,
      level: safeLevel,
      category,
    };
  }
  const genericProb = generateProblem(safeLevel, difficulty, tier, rng);
  return {
    question: genericProb.expression,
    answer: genericProb.answer,
    level: safeLevel,
    category,
  };
}
