import { describe, it, expect } from 'vitest';
import { urls, type QuizParams } from '../navigation';
import { APP_CONFIG } from '../../config/app';

describe('navigation urls', () => {
  it('should return correct home URL', () => {
    expect(urls.home()).toBe(APP_CONFIG.ROUTES.HOME);
  });

  it('should return correct categorySelect URL', () => {
    const params = { mountain: 'math' };
    expect(urls.categorySelect(params)).toBe(`${APP_CONFIG.ROUTES.CATEGORY_SELECT}?mountain=math`);
  });

  it('should return correct levelSelect URL', () => {
    const params = { mountain: 'math', world: 'World1', category: '기초' };
    expect(urls.levelSelect(params)).toBe(
      `${APP_CONFIG.ROUTES.LEVEL_SELECT}?mountain=math&world=World1&category=기초`
    );
  });

  describe('quiz URL', () => {
    it('should build basic quiz URL', () => {
      const params: QuizParams = {
        mountain: 'math',
        world: 'World1',
        category: '기초',
        level: 1,
        mode: 'time-attack',
      };
      const url = urls.quiz(params);
      expect(url).toContain(APP_CONFIG.ROUTES.GAME);
      expect(url).toContain('mountain=math');
      expect(url).toContain('world=World1');
      expect(url).toContain('category=%EA%B8%B0%EC%B4%88'); // URI encoded
      expect(url).toContain('level=1');
      expect(url).toContain('mode=time-attack');
    });

    it('should include preview parameter when true', () => {
      const params: QuizParams = {
        mountain: 'math',
        world: 'World1',
        category: '기초',
        level: 1,
        mode: 'time-attack',
        preview: true,
      };
      expect(urls.quiz(params)).toContain('preview=true');
    });

    it('should include challenge parameter when provided', () => {
      const params: QuizParams = {
        mountain: 'math',
        world: 'World1',
        category: '기초',
        level: 1,
        mode: 'time-attack',
        challenge: 'daily_001',
      };
      expect(urls.quiz(params)).toContain('challenge=daily_001');
    });

    it('should include tier parameter if not normal', () => {
      const params: QuizParams = {
        mountain: 'math',
        world: 'World1',
        category: '기초',
        level: 1,
        mode: 'time-attack',
        tier: 'hard',
      };
      expect(urls.quiz(params)).toContain('tier=hard');
    });

    it('should NOT include tier parameter if normal', () => {
      const params: QuizParams = {
        mountain: 'math',
        world: 'World1',
        category: '기초',
        level: 1,
        mode: 'time-attack',
        tier: 'normal',
      };
      expect(urls.quiz(params)).not.toContain('tier=normal');
    });
  });

  it('should return correct result URL', () => {
    const searchParams = new URLSearchParams({ score: '100' });
    expect(urls.result(searchParams)).toBe(`${APP_CONFIG.ROUTES.RESULT}?score=100`);
    expect(urls.result('score=100')).toBe(`${APP_CONFIG.ROUTES.RESULT}?score=100`);
  });

  describe('myPage URL', () => {
    it('should return basic myPage URL', () => {
      expect(urls.myPage()).toBe(APP_CONFIG.ROUTES.MY_PAGE);
    });

    it('should include showProfileForm parameter when true', () => {
      expect(urls.myPage({ showProfileForm: true })).toBe(
        `${APP_CONFIG.ROUTES.MY_PAGE}?showProfileForm=true`
      );
    });
  });

  it('should return correct challenge URL', () => {
    expect(urls.challenge({ id: '123' })).toBe('/challenge?id=123');
  });

  it('should return correct shop URL', () => {
    expect(urls.shop()).toBe('/shop');
  });

  describe('ranking URL', () => {
    it('should return basic ranking URL', () => {
      expect(urls.ranking()).toBe(APP_CONFIG.ROUTES.RANKING);
    });

    it('should include specific parameters', () => {
      const url = urls.ranking({ world: 'World1', category: '기초', mode: 'normal' });
      expect(url).toContain(APP_CONFIG.ROUTES.RANKING);
      expect(url).toContain('world=World1');
      expect(url).toContain('category=%EA%B8%B0%EC%B4%88');
      expect(url).toContain('mode=normal');
    });

    it('should return base URL if empty params provided', () => {
      expect(urls.ranking({})).toBe(APP_CONFIG.ROUTES.RANKING);
    });
  });

  it('should return correct notifications URL', () => {
    expect(urls.notifications()).toBe(APP_CONFIG.ROUTES.NOTIFICATIONS);
  });

  it('should return correct debug URL', () => {
    expect(urls.debug()).toBe('/debug');
  });

  it('should return correct login URL', () => {
    expect(urls.login()).toBe(APP_CONFIG.ROUTES.LOGIN);
  });

  it('should return correct history URL', () => {
    expect(urls.history()).toBe(`${APP_CONFIG.ROUTES.HISTORY}?tab=history`);
  });

  it('should return correct privacyPolicy URL', () => {
    expect(urls.privacyPolicy()).toBe('/privacy-policy');
  });
});
