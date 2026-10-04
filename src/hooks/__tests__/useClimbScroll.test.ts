import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClimbScroll } from '../useClimbScroll';
import type { ClimbLevelData } from '../../utils/climbPathUtils';

describe('useClimbScroll', () => {
  const mockLevelData: ClimbLevelData[] = [
    { id: 1, status: 'cleared', position: { x: 200, y: 500 } },
    { id: 2, status: 'current', position: { x: 220, y: 450 } },
    { id: 3, status: 'locked', position: { x: 180, y: 400 } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isScrollPositioned false and currentLevelRef assigned', () => {
    const { result } = renderHook(() =>
      useClimbScroll({
        levelData: mockLevelData,
        targetLevelId: 2,
        svgHeight: 650,
        clipOffset: 0,
        scrollOffset: 50,
        svgWidth: 400,
        mountain: 'mt_fuji',
        world: 'World1',
        category: 'math_add',
        totalLevels: 3,
        isReady: true,
      })
    );

    expect(result.current.isScrollPositioned).toBe(false);
    expect(result.current.currentLevelRef).toBeDefined();
    expect(typeof result.current.scrollToCurrentLevel).toBe('function');
  });

  it('should handle unmounted node gracefully after retries', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useClimbScroll({
        levelData: mockLevelData,
        targetLevelId: 2,
        svgHeight: 650,
        clipOffset: 0,
        scrollOffset: 50,
        svgWidth: 400,
        mountain: 'mt_fuji',
        world: 'World1',
        category: 'math_add',
        totalLevels: 3,
        isReady: true,
      })
    );

    // Call scrollToCurrentLevel when ref is null
    act(() => {
      result.current.scrollToCurrentLevel('auto');
    });

    vi.useRealTimers();
    expect(result.current.currentLevelRef.current).toBeNull();
  });
});
