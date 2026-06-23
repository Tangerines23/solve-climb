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

  it('should set fever level to 1 when combo reaches 3', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      for (let i = 0; i < 3; i++) {
        result.current.incrementCombo();
      }
    });

    expect(result.current.combo).toBe(3);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should set fever level to 2 when combo reaches 10', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.incrementCombo();
      }
    });

    expect(result.current.combo).toBe(10);
    expect(result.current.feverLevel).toBe(2);
    expect(result.current.showSpeedLines).toBe(true);
  });

  it('should step down combo and fever on resetCombo (without safety_rope)', () => {
    const { result } = renderHook(() => useGameStore());

    // 1. Fever Level 2 상태 도달 (10콤보)
    act(() => {
      result.current.setCombo(10);
    });
    expect(result.current.feverLevel).toBe(2);

    // 2. 오답 시 1단계 강등 (Fever Level 1, 콤보 3 보정)
    act(() => {
      result.current.resetCombo();
    });
    expect(result.current.combo).toBe(3);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // 3. 한번 더 오답 시 일반 상태 강등 (Fever Level 0, 콤보 0)
    act(() => {
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
    expect(result.current.feverLevel).toBe(2);
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

    // Combo 2 (below threshold)
    act(() => {
      result.current.setCombo(2);
    });
    expect(result.current.combo).toBe(2);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);

    // Combo 3 (threshold for level 1)
    act(() => {
      result.current.setCombo(3);
    });
    expect(result.current.combo).toBe(3);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Combo 9 (below threshold for level 2)
    act(() => {
      result.current.setCombo(9);
    });
    expect(result.current.combo).toBe(9);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Combo 10 (threshold for level 2)
    act(() => {
      result.current.setCombo(10);
    });
    expect(result.current.combo).toBe(10);
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

    // Increment to 2 (still level 0)
    act(() => {
      for (let i = 0; i < 2; i++) {
        result.current.incrementCombo();
      }
    });
    expect(result.current.combo).toBe(2);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);

    // Increment to 3 (transition to level 1)
    act(() => {
      result.current.incrementCombo();
    });
    expect(result.current.combo).toBe(3);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Increment to 9 (still level 1)
    act(() => {
      for (let i = 0; i < 6; i++) {
        result.current.incrementCombo();
      }
    });
    expect(result.current.combo).toBe(9);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);

    // Increment to 10 (transition to level 2)
    act(() => {
      result.current.incrementCombo();
    });
    expect(result.current.combo).toBe(10);
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

  it('should reset fever when incrementing combo while exhausted', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.setCombo(5); // Fever Level 1 (since 5 >= 3)
      result.current.setExhausted(true);
      result.current.incrementCombo();
    });

    // When exhausted, fever level is forced to 0
    expect(result.current.combo).toBe(6);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);
  });

  it('should consume a life', () => {
    const { result } = renderHook(() => useGameStore());

    const initialLives = result.current.lives;
    act(() => {
      result.current.consumeLife();
    });

    expect(result.current.lives).toBe(initialLives - 1);

    act(() => {
      // Consume all lives
      for (let i = 0; i < 10; i++) {
        result.current.consumeLife();
      }
    });

    expect(result.current.lives).toBe(0);
  });

  // --- 신규 시나리오 테스트 케이스 ---

  it('should apply combo weight based on level difficulty', () => {
    const { result } = renderHook(() => useGameStore());

    // 1. 초급 레벨 (Lv 1 ~ 10): +1 콤보
    act(() => {
      result.current.incrementCombo(5);
    });
    expect(result.current.combo).toBe(1);

    // 2. 중급 레벨 (Lv 11 ~ 20): +2 콤보 (누적 1 + 2 = 3)
    act(() => {
      result.current.incrementCombo(15);
    });
    expect(result.current.combo).toBe(3);
    expect(result.current.feverLevel).toBe(1); // 3콤보 도달로 Fever Level 1 활성화

    // 3. 고급 레벨 (Lv 21 ~ 30): +3 콤보 (누적 3 + 3 = 6)
    act(() => {
      result.current.incrementCombo(25);
    });
    expect(result.current.combo).toBe(6);
    expect(result.current.feverLevel).toBe(1);

    // 4. 레벨 미입력 시: 기본값 +1 콤보 (누적 6 + 1 = 7)
    act(() => {
      result.current.incrementCombo();
    });
    expect(result.current.combo).toBe(7);
  });

  it('should protect combo and fever level with safety_rope item', () => {
    const { result } = renderHook(() => useGameStore());

    // 1단계 피버 상태 및 안전 로프 아이템 설정
    act(() => {
      result.current.setCombo(6);
      result.current.setActiveItems(['safety_rope', 'compass']);
    });
    expect(result.current.feverLevel).toBe(1);

    // resetCombo 호출 시, 콤보와 피버가 유지되고 safety_rope 아이템만 소비되어야 함
    act(() => {
      result.current.resetCombo();
    });

    expect(result.current.combo).toBe(6);
    expect(result.current.feverLevel).toBe(1);
    expect(result.current.showSpeedLines).toBe(true);
    expect(result.current.activeItems).toEqual(['compass']);
    expect(result.current.usedItems).toEqual(['safety_rope']);

    // 로프가 소진된 후 다시 resetCombo 호출 시, 계단식 강등 적용 (6콤보는 피버1이므로 -> 0콤보 피버0으로 강등)
    act(() => {
      result.current.resetCombo();
    });

    expect(result.current.combo).toBe(0);
    expect(result.current.feverLevel).toBe(0);
    expect(result.current.showSpeedLines).toBe(false);
  });
});
