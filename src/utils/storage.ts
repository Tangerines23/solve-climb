/**
 * localStorage 관리 유틸리티
 * 모든 localStorage 키를 중앙에서 관리하고 타입 안전한 API를 제공합니다.
 */

import { safeJsonParse } from './safeJsonParse';
import { logger } from './logger';

/**
 * localStorage 키 이름 상수
 * 모든 키는 여기서 중앙 관리됩니다.
 */
export const StorageKeys = {
  // 기기 관련
  DEVICE_ID: 'solve-climb-device-id',
  
  // 프로필 관련
  PROFILES: (deviceId: string) => `solve-climb-profiles-${deviceId}`,
  ACTIVE_PROFILE_ID: 'solve-climb-active-profile-id',
  ADMIN_MODE: 'solve-climb-admin-mode',
  PROGRESS: (profileId: string) => `solve-climb-progress-${profileId}`,
  
  // 세션 관련
  LOCAL_SESSION: 'solve-climb-local-session',
  
  // 게임 팁 관련
  GAME_TIP: (category: string, sub: string, level?: string) => 
    level ? `gameTip_${category}_${sub}_${level}` : `gameTip_${category}_${sub}`,
} as const;

/**
 * localStorage 접두사 목록
 * 데이터 초기화 시 사용됩니다.
 */
export const STORAGE_PREFIXES = [
  'solve-climb-',
  'gameCenterApi_',
] as const;

/**
 * 타입 안전한 localStorage 관리 유틸리티
 */
export const storage = {
  /**
   * localStorage에서 값을 가져옵니다.
   * @param key 저장소 키
   * @param defaultValue 기본값 (키가 없거나 파싱 실패 시 반환)
   * @param validator 선택적 타입 검증 함수
   * @returns 파싱된 데이터 또는 기본값
   */
  get<T>(
    key: string,
    defaultValue: T,
    validator?: (data: unknown) => data is T
  ): T {
    try {
      const item = localStorage.getItem(key);
      return safeJsonParse<T>(item, defaultValue, validator);
    } catch (error) {
      logger.warn('Storage', `Failed to get storage item "${key}"`, error);
      return defaultValue;
    }
  },

  /**
   * localStorage에 값을 저장합니다.
   * @param key 저장소 키
   * @param value 저장할 값 (자동으로 JSON 직렬화됨)
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      logger.error('Storage', `Failed to set storage item "${key}"`, error);
      // QuotaExceededError 등 저장 실패 시 에러 로깅만 수행
    }
  },

  /**
   * localStorage에서 값을 제거합니다.
   * @param key 저장소 키
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Storage', `Failed to remove storage item "${key}"`, error);
    }
  },

  /**
   * localStorage에 문자열 값을 저장합니다.
   * (JSON 직렬화 없이 직접 저장)
   * @param key 저장소 키
   * @param value 저장할 문자열 값
   */
  setString(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.error('Storage', `Failed to set string storage item "${key}"`, error);
    }
  },

  /**
   * localStorage에서 문자열 값을 가져옵니다.
   * (JSON 파싱 없이 직접 반환)
   * @param key 저장소 키
   * @param defaultValue 기본값 (키가 없을 때 반환)
   * @returns 저장된 문자열 값 또는 기본값
   */
  getString(key: string, defaultValue: string | null = null): string | null {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch (error) {
      logger.warn('Storage', `Failed to get string storage item "${key}"`, error);
      return defaultValue;
    }
  },

  /**
   * 특정 접두사로 시작하는 모든 키를 찾습니다.
   * @param prefix 검색할 접두사
   * @returns 해당 접두사로 시작하는 키 배열
   */
  getKeysByPrefix(prefix: string): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      logger.warn('Storage', `Failed to get keys by prefix "${prefix}"`, error);
    }
    return keys;
  },

  /**
   * 특정 접두사로 시작하는 모든 키를 제거합니다.
   * @param prefix 제거할 접두사
   */
  removeByPrefix(prefix: string): void {
    const keys = this.getKeysByPrefix(prefix);
    keys.forEach(key => this.remove(key));
  },

  /**
   * 앱 관련 모든 데이터를 제거합니다.
   * STORAGE_PREFIXES에 정의된 접두사로 시작하는 모든 키를 제거합니다.
   */
  clearAppData(): void {
    STORAGE_PREFIXES.forEach(prefix => {
      this.removeByPrefix(prefix);
    });
  },
};

