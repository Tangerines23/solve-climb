import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathNoteStore } from '../useDeathNoteStore';
import { QuizQuestion } from '../../types/quiz';

describe('useDeathNoteStore', () => {
  const mockQuizQuestion: QuizQuestion = {
    question: 'How much is 2+2?',
    answer: '4',
    options: ['3', '4', '5'],
    category: '기초',
  };

  beforeEach(() => {
    const store = useDeathNoteStore.getState();
    act(() => {
      store.clearDeathNote();
    });
  });

  it('should add a unique missed question to the store', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion(mockQuizQuestion, 'World1', '기초');
    });

    expect(result.current.missedQuestions.length).toBe(1);
    expect(result.current.missedQuestions[0].question).toBe(mockQuizQuestion.question);
    expect(result.current.missedQuestions[0].world).toBe('World1');
    expect(result.current.missedQuestions[0].id).toBeDefined();
    expect(result.current.missedQuestions[0].timestamp).toBeDefined();
  });

  it('should prevent adding duplicate questions (same text, world, and category)', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion(mockQuizQuestion, 'World1', '기초');
    });

    act(() => {
      // Adding it again with same params
      result.current.addMissedQuestion({ ...mockQuizQuestion }, 'World1', '기초');
    });

    expect(result.current.missedQuestions.length).toBe(1);
  });

  it('should allow adding the same question text in a different world/category', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion(mockQuizQuestion, 'World1', '기초');
      result.current.addMissedQuestion(mockQuizQuestion, 'World2', '기초');
    });

    expect(result.current.missedQuestions.length).toBe(2);
  });

  it('should remove a missed question by its generated UUID', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion(mockQuizQuestion, 'World1', '기초');
    });

    const idToRemove = result.current.missedQuestions[0].id;

    act(() => {
      result.current.removeMissedQuestion(idToRemove);
    });

    expect(result.current.missedQuestions.length).toBe(0);
  });

  it('should filter questions by world and category', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion({ ...mockQuizQuestion, question: 'Q1' }, 'World1', '기초');
      result.current.addMissedQuestion({ ...mockQuizQuestion, question: 'Q2' }, 'World2', '대수');
    });

    const filtered = result.current.getQuestionsByCategory('World1', '기초');
    expect(filtered.length).toBe(1);
    expect(filtered[0].question).toBe('Q1');
  });

  it('should limit the number of stored missed questions to 50 (LRU-like)', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      // Add 60 unique questions
      for (let i = 0; i < 60; i++) {
        const q = { ...mockQuizQuestion, question: `Unique Question ${i}` };
        result.current.addMissedQuestion(q, 'World1', '기초');
      }
    });

    expect(result.current.missedQuestions.length).toBe(50);
    // Should contain the MOST RECENT one added (Question 59)
    expect(result.current.missedQuestions[0].question).toBe('Unique Question 59');
  });

  it('should clear all questions from the death note', () => {
    const { result } = renderHook(() => useDeathNoteStore());

    act(() => {
      result.current.addMissedQuestion(mockQuizQuestion, 'World1', '기초');
      result.current.clearDeathNote();
    });

    expect(result.current.missedQuestions.length).toBe(0);
  });
});
