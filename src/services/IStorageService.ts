/**
 * Storage Service Interface
 *
 * 전역 localStorage 의존성을 제거하고 테스트 격리를 가능하게 하는 인터페이스
 */
export interface IStorageService {
  /**
   * 저장된 값을 가져옵니다
   * @param key 저장소 키
   * @returns 저장된 값 또는 null
   */
  get<T>(key: string): T | null;

  /**
   * 값을 저장합니다
   * @param key 저장소 키
   * @param value 저장할 값
   */
  set<T>(key: string, value: T): void;

  /**
   * 값을 제거합니다
   * @param key 저장소 키
   */
  remove(key: string): void;

  /**
   * 모든 값을 제거합니다
   */
  clear(): void;

  /**
   * 저장소의 모든 키를 반환합니다
   */
  keys(): string[];

  /**
   * 저장소의 항목 개수를 반환합니다
   */
  get length(): number;
}
