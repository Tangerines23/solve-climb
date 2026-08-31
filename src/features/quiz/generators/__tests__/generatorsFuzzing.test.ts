import { describe, it, expect } from 'vitest';
import { generateQuestion } from '../quizGenerator';
import { generateProblem } from '../MathProblemGenerator';
import { generateLogicProblem } from '../LogicProblemGenerator';
import { generateCSProblem } from '../CSProblemGenerator';
import { generateGeometryProblem } from '../GeometryProblemGenerator';
import { generateCalculusProblem } from '../CalculusProblemGenerator';
import { generateStatsProblem } from '../StatsProblemGenerator';
import { generateEquation } from '../EquationProblemGenerator';
import { Category, World, Difficulty } from '@/types/quiz';

describe('Quiz Generators Fuzzing & Stress Invariant Test', () => {
  const CATEGORIES: Category[] = [
    '기초',
    '수학',
    'CS',
    '논리',
    '도형',
    '미적분',
    '확통',
    '고급대수',
  ];
  const WORLDS: World[] = ['World1', 'World2', 'World3', 'World4'];
  const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

  it('should generate 1,000 unified quiz questions without NaN, undefined, or missing answers', () => {
    for (let i = 0; i < 1000; i++) {
      const category = CATEGORIES[i % CATEGORIES.length];
      const world = WORLDS[i % WORLDS.length];
      const level = (i % 30) + 1;
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];

      const question = generateQuestion(
        'math',
        world,
        category as any,
        level,
        difficulty,
        'normal'
      );

      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(typeof question.question).toBe('string');
      expect(question.question.trim().length).toBeGreaterThan(0);
      expect(question.question).not.toContain('undefined');
      expect(question.question).not.toContain('NaN');

      // options 검증
      if (question.options && question.options.length > 0) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        for (const opt of question.options) {
          expect(opt).toBeDefined();
          expect(opt).not.toBeNull();
          expect(String(opt)).not.toContain('undefined');
          expect(String(opt)).not.toContain('NaN');
        }
        // 객관식인 경우 정답이 options에 포함되어 있는지 검증
        const strOptions = question.options.map(String);
        expect(strOptions).toContain(String(question.answer));
      }

      // answer 검증
      expect(question.answer).toBeDefined();
      expect(question.answer).not.toBeNull();
      expect(String(question.answer)).not.toContain('undefined');
      expect(String(question.answer)).not.toContain('NaN');
    }
  });

  it('should fuzz-test all specialized generators for 500 iterations each', () => {
    // 1. Math (Arithmetic)
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 20; i++) {
        const q = generateProblem(level, 'medium');
        expect(q.expression).toBeDefined();
        expect(q.expression).not.toContain('undefined');
        expect(q.expression).not.toContain('NaN');
        expect(q.answer).toBeDefined();
      }
    }

    // 2. Logic (PRNG 오프바이원 소수 검출 방어 검증)
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 20; i++) {
        const q = generateLogicProblem(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
        expect(q.answer).toBeDefined();
        expect(typeof q.answer).toBe('number');
      }
    }

    // 3. CS
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 15; i++) {
        const q = generateCSProblem(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
      }
    }

    // 4. Geometry
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 15; i++) {
        const q = generateGeometryProblem(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
      }
    }

    // 5. Calculus
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 15; i++) {
        const q = generateCalculusProblem(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
      }
    }

    // 6. Stats
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 15; i++) {
        const q = generateStatsProblem(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
      }
    }

    // 7. Equation
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 15; i++) {
        const q = generateEquation(level, 'medium');
        expect(q.question).not.toContain('undefined');
        expect(q.question).not.toContain('NaN');
      }
    }
  });
});
