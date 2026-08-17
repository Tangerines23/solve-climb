import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalBgmManager } from '../GlobalBgmManager';
import { bgm } from '@/utils/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';

vi.mock('@/utils/sound', () => ({
  bgm: {
    play: vi.fn(),
    stop: vi.fn(),
    getCurrentTheme: vi.fn().mockReturnValue(null),
  },
}));

describe('GlobalBgmManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ bgmEnabled: true });
  });

  it('plays brain_age theme on root / home path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalBgmManager />
      </MemoryRouter>
    );

    expect(bgm.play).toHaveBeenCalledWith('brain_age');
  });

  it('plays shop theme on /shop path', () => {
    render(
      <MemoryRouter initialEntries={['/shop']}>
        <GlobalBgmManager />
      </MemoryRouter>
    );

    expect(bgm.play).toHaveBeenCalledWith('shop');
  });

  it('stops bgm if bgmEnabled is false', () => {
    useSettingsStore.setState({ bgmEnabled: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalBgmManager />
      </MemoryRouter>
    );

    expect(bgm.stop).toHaveBeenCalledWith(0.3);
  });
});
