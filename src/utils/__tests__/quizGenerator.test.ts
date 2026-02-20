import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuestion } from '../quizGenerator';
import * as MathProblemGenerator from '../MathProblemGenerator';
import * as EquationProblemGenerator from '../EquationProblemGenerator';
import * as LogicProblemGenerator from '../LogicProblemGenerator';
import * as GeometryProblemGenerator from '../GeometryProblemGenerator';
import * as StatsProblemGenerator from '../StatsProblemGenerator';
import * as CSProblemGenerator from '../CSProblemGenerator';
import * as CalculusProblemGenerator from '../CalculusProblemGenerator';

describe('quizGenerator Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  describe('generateQuestion', () => {
    it('should route to MathProblemGenerator for math World1 (Arithmetic)', () => {
      const q = generateQuestion('math', 'World1', 'World1-기초', 1, 'easy');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('answer');
    });

    it('should route to EquationProblemGenerator for math World2 (Algebra)', () => {
      const q = generateQuestion('math', 'World2', 'World2-대수', 1, 'easy');
      expect(q).toHaveProperty('question');
      expect(q.question).toContain('□');
    });

    it('should route to GeometryProblemGenerator for math World3 (Geometry)', () => {
      const q = generateQuestion('math', 'World3', 'World3-기하', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should route to StatsProblemGenerator for math World4 (Stats)', () => {
      const q = generateQuestion('math', 'World4', 'World4-통계', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should route to LogicProblemGenerator for logic mountain', () => {
      const q = generateQuestion('logic', 'World1', 'logic-기초', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should route to CSProblemGenerator for general World1 (CS)', () => {
      const q = generateQuestion('general', 'World1', 'general-CS', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should route to CalculusProblemGenerator for general World2 (Calculus)', () => {
      const q = generateQuestion('general', 'World2', 'general-Calculus', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should fallback to LogicProblemGenerator for general unknown world', () => {
      const q = generateQuestion('general', 'UnknownWorld' as any, 'general-unknown', 1, 'easy');
      expect(q).toHaveProperty('question');
    });

    it('should fallback to MathProblemGenerator for unknown mountain/world', () => {
      const q = generateQuestion(
        'unknown' as any,
        'UnknownWorld' as any,
        'unknown-topic',
        1,
        'easy'
      );
      expect(q).toHaveProperty('question');
    });
  });
});
