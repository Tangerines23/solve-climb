import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      soundEnabled: true,
      bgmEnabled: true,
      hapticEnabled: true,
      keyboardType: 'custom',
      animationEnabled: true,
      staticMode: false,
    });
  });

  it('toggles bgmEnabled correctly', () => {
    expect(useSettingsStore.getState().bgmEnabled).toBe(true);

    useSettingsStore.getState().setBgmEnabled(false);
    expect(useSettingsStore.getState().bgmEnabled).toBe(false);

    useSettingsStore.getState().setBgmEnabled(true);
    expect(useSettingsStore.getState().bgmEnabled).toBe(true);
  });

  it('toggles soundEnabled correctly', () => {
    expect(useSettingsStore.getState().soundEnabled).toBe(true);

    useSettingsStore.getState().setSoundEnabled(false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
  });
});
