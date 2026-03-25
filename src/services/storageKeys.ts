/**
 * Centralized keys for LocalStorage to avoid hardcoding and typos across the app.
 */
export const STORAGE_KEYS = {
  // Session & Auth
  LOCAL_SESSION: 'solve-climb-local-session',
  LOGIN_REDIRECT: 'login_redirect_path',
  AUTH_BYPASS: 'solve-climb-auth-bypass',

  // Navigation Persistence
  LAST_VISITED_MOUNTAIN: 'last_visited_mountain',
  LAST_VISITED_WORLD: 'last_visited_world',
  LAST_VISITED_CATEGORY: 'last_visited_category',
  LAST_PLAYED_WORLD: (mountainId: string) => `lastPlayedWorld_${mountainId}`,
  TODAY_CHALLENGE_DATE: 'solve-climb-today-challenge-date',
  TODAY_CHALLENGE: 'solve-climb-today-challenge',
  DEBUG_MODE: 'debug_mode',
  DEBUG_SNAPSHOT: 'debug_snapshot',

  // Game Progress
  HIGH_SCORE_PREFIX: 'solve-climb-highscore-',
  BYPASS_LEVEL_LOCK: 'solve-climb-bypass-level-lock',
  LOCAL_BADGES: 'solve-climb-local-badges',
  LOCAL_HISTORY: 'solve-climb-local-history',

  // Profile & Device
  DEVICE_ID: 'solve-climb-device-id',
  PROFILES: (deviceId: string) => `solve-climb-profiles-${deviceId}`,
  ACTIVE_PROFILE_ID: 'solve-climb-active-profile-id',
  ADMIN_MODE: 'solve-climb-admin-mode',
  PROGRESS: (profileId: string) => `solve-climb-progress-${profileId}`,

  // Debug & UI
  DEBUG_PRESETS: 'solve-climb-debug-presets',
  DEBUG_PRESET_HISTORY: 'debug_preset_history',
  DEBUG_CUSTOM_PRESETS: 'debug_custom_presets',
  THEME: 'solve-climb-theme',
  GAME_TIP: (category: string, sub: string, level?: string) =>
    level ? `gameTip_${category}_${sub}_${level}` : `gameTip_${category}_${sub}`,
} as const;
