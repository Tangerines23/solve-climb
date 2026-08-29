/**
 * @domain 데이터 서비스 및 저장소 (Data Services & Repositories)
 * @summary 의존성 주입(DI) 기반 로컬 스토리지, 사용자/진행도 레포지토리 및 분석 계층
 * @type service
 */

export type { IStorageService } from './IStorageService';
import { LocalStorageService, storageService } from './LocalStorageService';
export { LocalStorageService, storageService };
export { MockStorageService } from './MockStorageService';
export { ProgressRepository } from './ProgressRepository';
export { UserRepository } from './UserRepository';
export { AdService, type AdPlacement, type AdResult } from './adService';
export { analytics } from './analytics';
export { historyService } from './historyService';
export { STORAGE_KEYS } from './storageKeys';

/**
 * Zustand Persistence Adapter
 *
 * Zustand의 persist 미들웨어에서 storageService를 사용하도록 변환해주는 어댑터입니다.
 */
import { StateStorage } from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storageService.get<unknown>(name);
    if (value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  setItem: (name: string, value: string): void => {
    try {
      // 이미 JSON 문자열인 경우 객체로 파싱하여 저장 (storageService가 다시 stringify함)
      const parsed = JSON.parse(value);
      storageService.set(name, parsed);
    } catch {
      // 일반 문자열인 경우 그대로 저장
      storageService.set(name, value);
    }
  },
  removeItem: (name: string): void => {
    storageService.remove(name);
  },
};
