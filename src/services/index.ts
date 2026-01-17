/**
 * Services Module
 * 
 * 의존성 주입(DI)을 위한 서비스 계층
 */

export type { IStorageService } from './IStorageService';
export { LocalStorageService } from './LocalStorageService';
export { MockStorageService } from './MockStorageService';

// 프로덕션용 싱글톤 인스턴스
import { LocalStorageService } from './LocalStorageService';
export const storageService = new LocalStorageService();
