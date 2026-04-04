import { describe, it, expect, beforeEach } from 'vitest';
import { useFeatureFlagStore } from '../useFeatureFlagStore';

describe('useFeatureFlagStore', () => {
  beforeEach(() => {
    useFeatureFlagStore.getState().resetFlags();
  });

  it('should have initial flags correctly set', () => {
    const { flags } = useFeatureFlagStore.getState();
    expect(flags.ENABLE_MATH_MOUNTAIN).toBe(true);
    expect(flags.ENABLE_LANGUAGE_MOUNTAIN).toBe(false);
    expect(flags.ENABLE_LOGIC_MOUNTAIN).toBe(true);
    expect(flags.ENABLE_GENERAL_MOUNTAIN).toBe(true);
    expect(flags.ENABLE_BETA_FEEDBACK).toBe(true);
  });

  it('should set a flag value correctly', () => {
    useFeatureFlagStore.getState().setFlag('ENABLE_LANGUAGE_MOUNTAIN', true);
    expect(useFeatureFlagStore.getState().flags.ENABLE_LANGUAGE_MOUNTAIN).toBe(true);

    useFeatureFlagStore.getState().setFlag('ENABLE_MATH_MOUNTAIN', false);
    expect(useFeatureFlagStore.getState().flags.ENABLE_MATH_MOUNTAIN).toBe(false);
  });

  it('should reset flags to default values', () => {
    useFeatureFlagStore.getState().setFlag('ENABLE_LANGUAGE_MOUNTAIN', true);
    useFeatureFlagStore.getState().setFlag('ENABLE_MATH_MOUNTAIN', false);

    useFeatureFlagStore.getState().resetFlags();

    const { flags } = useFeatureFlagStore.getState();
    expect(flags.ENABLE_MATH_MOUNTAIN).toBe(true);
    expect(flags.ENABLE_LANGUAGE_MOUNTAIN).toBe(false);
  });
});
