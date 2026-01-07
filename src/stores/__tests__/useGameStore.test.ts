import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.resetGame();
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGameStore());

    expect(result.current.score).toBe(0);
    expect(result.current.combo).toBe(0);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.isExhausted).toBe(false);
    expect(result.current.showSpeedLines).toBe(false);
    expect(result.current.showVignette).toBe(false);
    expect(result.current.activeItems).toEqual([]);
    expect(result.current.isStaminaConsumed).toBe(false);
  });

  it('should set score', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setScore(100);
    });

    expect(result.current.score).toBe(100);
  });

  it('should increment combo', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.incrementCombo();
    });

    expect(result.current.combo).toBe(1);
  });

  it('should set fever level to 1 when combo reaches 5', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.incrementCombo();
      }
    });

    expect(result.current.combo).toBe(5);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should set fever level to 2 when combo reaches 20', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.incrementCombo();
      }
    });

    expect(result.current.combo).toBe(20);
    expect(result.current.feverLevel).toBe(2);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should reset combo', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.incrementCombo();
      result.current.incrementCombo();
      result.current.resetCombo();
    });

    expect(result.current.combo).toBe(0);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);
  });

  it('should set combo directly', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setCombo(10);
    });

    expect(result.current.combo).toBe(10);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should set exhausted state', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setExhausted(true);
    });

    expect(result.current.isExhausted).toBe(true);
    expect(result.current.showVignette).toBe(true);

    act(() => {
      result.current.setExhausted(false);
    });

    expect(result.current.isExhausted).toBe(false);
    expect(result.current.showVignette).toBe(false);
  });

  it('should set stamina consumed state', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setStaminaConsumed(true);
    });

    expect(result.current.isStaminaConsumed).toBe(true);

    act(() => {
      result.current.setStaminaConsumed(false);
    });

    expect(result.current.isStaminaConsumed).toBe(false);
  });

  it('should set active items', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setActiveItems(['safety_rope', 'last_spurt']);
    });

    expect(result.current.activeItems).toEqual(['safety_rope', 'last_spurt']);
  });

  it('should consume active item', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setActiveItems(['safety_rope', 'last_spurt', 'flare']);
      result.current.consumeActiveItem('safety_rope');
    });

    expect(result.current.activeItems).not.toContain('safety_rope');
    expect(result.current.activeItems).toContain('last_spurt');
    expect(result.current.activeItems).toContain('flare');
  });

  it('should reset game to initial state', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setScore(100);
      result.current.setCombo(10);
      result.current.setExhausted(true);
      result.current.setActiveItems(['safety_rope']);
      result.current.setStaminaConsumed(true);
    });

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.score).toBe(0);
    expect(result.current.combo).toBe(0);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.isExhausted).toBe(false);
    expect(result.current.showSpeedLines).toBe(false);
    expect(result.current.showVignette).toBe(false);
    expect(result.current.activeItems).toEqual([]);
    expect(result.current.isStaminaConsumed).toBe(false);
  });

  it('should handle setCombo with boundary values', () => {
    const { result } = renderHook(() => useGameStore());

    // Combo 4 (below threshold)
    act(() => {
      result.current.setCombo(4);
    });
    expect(result.current.combo).toBe(4);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);

    // Combo 5 (threshold for level 1)
    act(() => {
      result.current.setCombo(5);
    });
    expect(result.current.combo).toBe(5);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Combo 19 (below threshold for level 2)
    act(() => {
      result.current.setCombo(19);
    });
    expect(result.current.combo).toBe(19);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Combo 20 (threshold for level 2)
    act(() => {
      result.current.setCombo(20);
    });
    expect(result.current.combo).toBe(20);
    expect(result.current.feverLevel).toBe(2);
    expect(result.current.showSpeedLines).toBe(true);

    // Combo 0
    act(() => {
      result.current.setCombo(0);
    });
    expect(result.current.combo).toBe(0);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);
  });

  it('should handle incrementCombo boundary transitions', () => {
    const { result } = renderHook(() => useGameStore());

    // Increment to 4 (still level 0)
    act(() => {
      for (let i = 0; i < 4; i++) {
        result.current.incrementCombo();
      }
    });
    expect(result.current.combo).toBe(4);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);

    // Increment to 5 (transition to level 1)
    act(() => {
      result.current.incrementCombo();
    });
    expect(result.current.combo).toBe(5);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Increment to 19 (still level 1)
    act(() => {
      for (let i = 0; i < 14; i++) {
        result.current.incrementCombo();
      }
    });
    expect(result.current.combo).toBe(19);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Increment to 20 (transition to level 2)
    act(() => {
      result.current.incrementCombo();
    });
    expect(result.current.combo).toBe(20);
    expect(result.current.feverLevel).toBe(2);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should handle consumeActiveItem with non-existent item', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setActiveItems(['safety_rope', 'last_spurt']);
      result.current.consumeActiveItem('non_existent');
    });

    // Should not throw error and items should remain unchanged
    expect(result.current.activeItems).toEqual(['safety_rope', 'last_spurt']);
  });

  it('should handle consumeActiveItem with empty array', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setActiveItems([]);
      result.current.consumeActiveItem('safety_rope');
    });

    expect(result.current.activeItems).toEqual([]);
  });

  it('should handle setCombo with very large values', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setCombo(100);
    });

    expect(result.current.combo).toBe(100);
    expect(result.current.feverLevel).toBe(2);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should handle multiple active items consumption', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setActiveItems(['safety_rope', 'last_spurt', 'flare', 'compass']);
      result.current.consumeActiveItem('safety_rope');
      result.current.consumeActiveItem('flare');
    });

    expect(result.current.activeItems).toEqual(['last_spurt', 'compass']);
    expect(result.current.activeItems).not.toContain('safety_rope');
    expect(result.current.activeItems).not.toContain('flare');
  });
});

