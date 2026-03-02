/**
 * @file navigation.ts
 * @description Type-safe URL builders for application navigation.
 * This prevents "Invalid Access" errors by enforcing required parameters at compile time.
 */

import { APP_CONFIG } from '@/config/app';

/**
 * Interface for Quiz Page Parameters
 */
import type { GameMode, Tier } from '../types/quiz';

/**
 * Interface for Quiz Page Parameters
 */
export interface QuizParams {
  mountain: string;
  world: string;
  category: string;
  level: number | string;
  mode: GameMode;
  preview?: boolean;
  challenge?: string;
  tier?: Tier;
}

/**
 * Interface for Level Select Page Parameters
 */
export interface LevelSelectParams {
  mountain: string;
  world: string;
  category: string;
}

/**
 * Interface for Category Select Page Parameters
 */
export interface CategorySelectParams {
  mountain: string;
}

/**
 * Type-safe URL Builders
 */
export const urls = {
  /**
   * Home Page
   */
  home: () => APP_CONFIG.ROUTES.HOME,

  /**
   * Category Select Page
   */
  categorySelect: (params: CategorySelectParams) => {
    return `${APP_CONFIG.ROUTES.CATEGORY_SELECT}?mountain=${params.mountain}`;
  },

  /**
   * Level Select Page
   */
  levelSelect: (params: LevelSelectParams) => {
    return `${APP_CONFIG.ROUTES.LEVEL_SELECT}?mountain=${params.mountain}&world=${params.world}&category=${params.category}`;
  },

  /**
   * Quiz Page
   */
  quiz: (params: QuizParams) => {
    const baseUrl = APP_CONFIG.ROUTES.GAME;
    const query = new URLSearchParams({
      mountain: params.mountain,
      world: params.world,
      category: params.category,
      level: params.level.toString(),
      mode: params.mode,
    });
    if (params.preview) query.append('preview', 'true');
    if (params.challenge) query.append('challenge', params.challenge);
    if (params.tier && params.tier !== 'normal') query.append('tier', params.tier);
    return `${baseUrl}?${query.toString()}`;
  },

  /**
   * Result Page
   */
  result: (params: URLSearchParams | string) => {
    const query = typeof params === 'string' ? params : params.toString();
    return `${APP_CONFIG.ROUTES.RESULT}?${query}`;
  },

  /**
   * My Page
   */
  myPage: (params?: { showProfileForm?: boolean }) => {
    const baseUrl = APP_CONFIG.ROUTES.MY_PAGE;
    if (params?.showProfileForm) {
      return `${baseUrl}?showProfileForm=true`;
    }
    return baseUrl;
  },

  /**
   * Challenge Page
   */
  challenge: (params: { id: string }) => {
    return `/challenge?id=${params.id}`;
  },

  /**
   * Shop Page
   */
  shop: () => '/shop',

  /**
   * Ranking Page
   */
  ranking: (params?: { world?: string; category?: string; mode?: string }) => {
    const baseUrl = APP_CONFIG.ROUTES.RANKING;
    if (!params) return baseUrl;
    const query = new URLSearchParams();
    if (params.world) query.append('world', params.world);
    if (params.category) query.append('category', params.category);
    if (params.mode) query.append('mode', params.mode);
    const queryString = query.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  },

  /**
   * Notifications Page
   */
  notifications: () => APP_CONFIG.ROUTES.NOTIFICATIONS,

  /**
   * Debug Page
   */
  debug: () => '/debug',

  /**
   * Login Page
   */
  login: () => APP_CONFIG.ROUTES.LOGIN,

  /**
   * Privacy Policy Page
   */
  privacyPolicy: () => '/privacy-policy',
};
