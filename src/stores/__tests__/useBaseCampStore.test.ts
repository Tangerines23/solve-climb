import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBaseCampStore } from '../useBaseCampStore';

// Mock generateQuestion
vi.mock('../utils/quizGenerator', () => ({
  generateQuestion: vi.fn((type, world, category, id, difficulty) => ({
    id: id.toString(),
    question: `Question ${id}`,
    answer: '42',
    options: ['41', '42', '43', '44'],
    difficulty,
    category_id: category, // Matches Category type expectations
    type,
    world,
  })),
}));

describe('useBaseCampStore', () => {
  beforeEach(() => {
    // Manually clear state to ensure isolation
    const store = useBaseCampStore.getState();
    act(() => {
      store.resetBaseCamp();
      store.setCompleted(false);
    });
  });

  it('should start diagnostic and generate 10 diverse questions', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
    });

    expect(result.current.questions.length).toBe(10);
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.results.length).toBe(0);
  });

  it('should submit answers and track progress sequentially', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
    });

    act(() => {
      result.current.submitAnswer(true, 1500);
      result.current.submitAnswer(false, 2000);
    });

    expect(result.current.currentQuestionIndex).toBe(2);
    expect(result.current.results.length).toBe(2);
    expect(result.current.results[0]).toEqual({ isCorrect: true, time: 1500 });
    expect(result.current.results[1]).toEqual({ isCorrect: false, time: 2000 });
  });

  it('should recommend "심화" (Rock Climbing) for high accuracy and fast speed', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
      // 100% correct, FAST (under 3s)
      for (let i = 0; i < 10; i++) {
        result.current.submitAnswer(true, 1000);
      }
    });

    const recommendation = result.current.getRecommendation();
    expect(recommendation.accuracy).toBe(100);
    expect(recommendation.avgTime).toBe(1000);
    expect(recommendation.recommendation).toBe('심화');
  });

  it('should recommend "대수" (Steep) for 80% accuracy', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
      for (let i = 0; i < 8; i++) result.current.submitAnswer(true, 3000);
      for (let i = 0; i < 2; i++) result.current.submitAnswer(false, 3000);
    });

    const recommendation = result.current.getRecommendation();
    expect(recommendation.accuracy).toBe(80);
    expect(recommendation.recommendation).toBe('대수');
  });

  it('should recommend "논리" (Exploration) for 60% accuracy', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
      for (let i = 0; i < 6; i++) result.current.submitAnswer(true, 4000);
      for (let i = 0; i < 4; i++) result.current.submitAnswer(false, 4000);
    });

    const recommendation = result.current.getRecommendation();
    expect(recommendation.accuracy).toBe(60);
    expect(recommendation.recommendation).toBe('논리');
  });

  it('should recommend "기초" (General) for low accuracy', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
      for (let i = 0; i < 4; i++) result.current.submitAnswer(true, 5000);
      for (let i = 0; i < 6; i++) result.current.submitAnswer(false, 5000);
    });

    const recommendation = result.current.getRecommendation();
    expect(recommendation.accuracy).toBe(40);
    expect(recommendation.recommendation).toBe('기초');
  });

  it('should reset all state including questions and results', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.startDiagnostic();
      result.current.submitAnswer(true, 1000);
      result.current.resetBaseCamp();
    });

    expect(result.current.questions.length).toBe(0);
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.results.length).toBe(0);
  });

  it('should persist and update completion status', () => {
    const { result } = renderHook(() => useBaseCampStore());
    
    act(() => {
      result.current.setCompleted(true);
    });

    expect(result.current.isCompleted).toBe(true);
  });
});
