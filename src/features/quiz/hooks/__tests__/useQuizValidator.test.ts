import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuizValidator } from '../useQuizValidator';
import { QuizQuestion } from '../../types/quiz';

describe('useQuizValidator - Multi-Type Precision Evaluation', () => {
  const { result } = renderHook(() => useQuizValidator());
  const { validateAnswer } = result.current;

  it('should validate decimal questions accurately', () => {
    const q: QuizQuestion = {
      question: '0.5 + 0.6',
      answer: 1.1,
      inputType: 'decimal',
    };

    expect(validateAnswer('1.1', q, 'math', 'decimal')).toBe(true);
    expect(validateAnswer('1.10', q, 'math', 'decimal')).toBe(true);
    expect(validateAnswer('1.2', q, 'math', 'decimal')).toBe(false);
  });

  it('should validate fraction questions with equivalence', () => {
    const q: QuizQuestion = {
      question: '1/4 + 1/4',
      answer: '2/4',
      inputType: 'fraction',
    };

    expect(validateAnswer('2/4', q, 'math', 'fraction')).toBe(true);
    expect(validateAnswer('1/2', q, 'math', 'fraction')).toBe(true);
    expect(validateAnswer('0.5', q, 'math', 'fraction')).toBe(true);
    expect(validateAnswer('3/4', q, 'math', 'fraction')).toBe(false);
  });

  it('should validate coordinate questions with spacing and parenthesis flexibility', () => {
    const q: QuizQuestion = {
      question: '좌표 (2, 3)을 조준하세요!',
      answer: '2,3',
      inputType: 'coordinate',
    };

    expect(validateAnswer('2,3', q, 'math', 'calculus')).toBe(true);
    expect(validateAnswer('2, 3', q, 'math', 'calculus')).toBe(true);
    expect(validateAnswer('(2,3)', q, 'math', 'calculus')).toBe(true);
    expect(validateAnswer('(2, 3)', q, 'math', 'calculus')).toBe(true);
    expect(validateAnswer('3,2', q, 'math', 'calculus')).toBe(false);
    expect(validateAnswer('2', q, 'math', 'calculus')).toBeNull();
  });

  it('should validate CS binary string questions', () => {
    const q: QuizQuestion = {
      question: '2진수 덧셈 010 + 001',
      answer: '011',
    };

    expect(validateAnswer('011', q, 'cs', 'binary')).toBe(true);
  });

  it('should reject negative numbers for non-negative regular math quizzes', () => {
    const q: QuizQuestion = {
      question: '5 + 3',
      answer: 8,
    };

    expect(validateAnswer('-5', q, 'math', 'add')).toBeNull();
    expect(validateAnswer('8', q, 'math', 'add')).toBe(true);
  });

  it('should allow negative numbers for equation or calculus quizzes', () => {
    const q: QuizQuestion = {
      question: 'x + 5 = 2',
      answer: -3,
    };

    expect(validateAnswer('-3', q, 'math', 'equations')).toBe(true);
    expect(validateAnswer('-2', q, 'math', 'equations')).toBe(false);
  });

  it('should return null on invalid input format', () => {
    const q: QuizQuestion = {
      question: '3 + 3',
      answer: 6,
    };

    expect(validateAnswer('abc', q, 'math', 'add')).toBeNull();
    expect(validateAnswer('', q, 'math', 'add')).toBeNull();
  });
});
