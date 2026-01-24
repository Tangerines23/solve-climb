/**
 * 공유 타입 정의
 * 프로젝트 전반에서 공통으로 사용되는 핵심 타입들을 관리합니다.
 * (중복되거나 사용되지 않는 레거시 타입은 제거되었습니다)
 */

export interface UserStats {
  totalHeight: number;
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
}

export {};
