import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeMacro, builtInMacros, DebugMacro } from '../debugMacros';

describe('debugMacros', () => {
  const mockNavigate = vi.fn();
  const mockSetStamina = vi.fn().mockResolvedValue(undefined);
  const mockSetMinerals = vi.fn().mockResolvedValue(undefined);
  const mockOnProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute a macro with multiple steps successfully', async () => {
    const macro: DebugMacro = {
      id: 'test-macro',
      name: 'Test Macro',
      description: 'Test Description',
      icon: '🧪',
      steps: [
        { type: 'navigate', path: '/test' },
        { type: 'wait', ms: 10 },
        { type: 'setResource', resource: 'stamina', value: 100 },
        { type: 'setResource', resource: 'minerals', value: 200 },
        { type: 'log', message: 'Step completed' },
      ],
    };

    const result = await executeMacro(
      macro,
      mockNavigate,
      mockSetStamina,
      mockSetMinerals,
      mockOnProgress
    );

    expect(result.success).toBe(true);
    expect(result.completedSteps).toBe(5);
    expect(mockNavigate).toHaveBeenCalledWith('/test');
    expect(mockSetStamina).toHaveBeenCalledWith(100);
    expect(mockSetMinerals).toHaveBeenCalledWith(200);
    expect(mockOnProgress).toHaveBeenCalledTimes(5);
  });

  it('should handle macro steps with missing data gracefully', async () => {
    const macro: DebugMacro = {
      id: 'empty-steps',
      name: 'Empty Steps',
      description: '...',
      icon: '',
      steps: [
        { type: 'navigate' }, // missing path
        { type: 'setResource' }, // missing resource/value
        { type: 'wait' }, // missing ms
        { type: 'log' }, // missing message
      ],
    };

    const result = await executeMacro(macro, mockNavigate, mockSetStamina, mockSetMinerals);

    expect(result.success).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockSetStamina).not.toHaveBeenCalled();
  });

  it('should catch errors during step execution', async () => {
    const macro: DebugMacro = {
      id: 'error-macro',
      name: 'Error Macro',
      description: '...',
      icon: '',
      steps: [{ type: 'setResource', resource: 'stamina', value: 10 }],
    };

    mockSetStamina.mockRejectedValueOnce(new Error('Failed to set stamina'));

    const result = await executeMacro(macro, mockNavigate, mockSetStamina, mockSetMinerals);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to set stamina');
    expect(result.completedSteps).toBe(0);
  });

  it('should handle applyPreset step (currently unimplemented but logs)', async () => {
    const macro: DebugMacro = {
      id: 'preset-macro',
      name: 'Preset Macro',
      description: '...',
      icon: '',
      steps: [{ type: 'applyPreset', presetId: '123' }],
    };

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await executeMacro(macro, mockNavigate, mockSetStamina, mockSetMinerals);

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Preset 123 적용'));
    consoleSpy.mockRestore();
  });

  it('should work with built-in macros', () => {
    expect(builtInMacros.length).toBeGreaterThan(0);
    expect(builtInMacros[0].steps.length).toBeGreaterThan(0);
  });
});
