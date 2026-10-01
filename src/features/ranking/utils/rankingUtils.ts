import type { RankingPeriod, RankingType } from '../types';

/**
 * 랭킹 순위에 따른 메달 아이콘 또는 순위 숫자를 반환합니다.
 * (Zero Else, Depth 1 적용)
 */
export function formatMedalOrRank(rank: number): string | number {
  if (isNaN(rank) || rank <= 0) {
    return '-';
  }
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

/**
 * 명예의 전당 시즌 시작일(week_start_date)을 기반으로 시즌 주차 뱃지 문자열을 반환합니다.
 * 유효하지 않은 날짜나 누락 시 '시즌 정보 없음'을 안전하게 반환합니다.
 */
export function formatSeasonBadge(dateString?: string | null): string {
  if (!dateString) {
    return '시즌 정보 없음';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '시즌 정보 없음';
  }

  const month = date.getMonth() + 1;
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const week = Math.ceil((date.getDate() + firstDay.getDay()) / 7);

  return `${month}월 ${week}주차 시즌`;
}

/**
 * 랭킹 캐시 키를 안전하게 조합합니다.
 */
export function buildRankingKey(
  period: RankingPeriod,
  type: RankingType,
  world?: string | null,
  category?: string | null
): string {
  if (world && category) {
    return `${world}-${category}-${period}-${type}`;
  }
  return `${period}-${type}`;
}

/**
 * URL 쿼리 파라미터의 mode 값을 안전한 RankingType으로 검증 및 정규화합니다.
 */
export function resolveModeParam(param: string | null): RankingType {
  if (param === 'time-attack') return 'time-attack';
  if (param === 'survival') return 'survival';
  return 'total';
}
