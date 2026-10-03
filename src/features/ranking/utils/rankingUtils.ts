import type { RankingPeriod, RankingType } from '../types';

/**
 * 랭킹 순위에 따른 메달 아이콘 또는 순위 숫자를 반환합니다.
 * (Zero Else, Depth 1 적용)
 * - NaN, 음수, 0, 비정수(float), non-number 방어
 */
export function formatMedalOrRank(rank: number): string | number {
  if (typeof rank !== 'number' || !Number.isFinite(rank) || rank <= 0) {
    return '-';
  }
  const intRank = Math.floor(rank);
  if (intRank === 1) return '🥇';
  if (intRank === 2) return '🥈';
  if (intRank === 3) return '🥉';
  return intRank;
}

/**
 * 명예의 전당 시즌 시작일(week_start_date)을 기반으로 시즌 주차 뱃지 문자열을 반환합니다.
 * 유효하지 않은 날짜나 누락 시 '시즌 정보 없음'을 안전하게 반환합니다.
 */
export function formatSeasonBadge(dateString?: string | null): string {
  if (!dateString || typeof dateString !== 'string') {
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
 * - world, category 문자열 trim 및 공백 방어
 * - 기본 period/type fallback 보장
 */
export function buildRankingKey(
  period: RankingPeriod = 'weekly',
  type: RankingType = 'total',
  world?: string | null,
  category?: string | null
): string {
  const safePeriod = period || 'weekly';
  const safeType = type || 'total';
  const cleanWorld = typeof world === 'string' ? world.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';

  if (cleanWorld && cleanCategory) {
    return `${cleanWorld}-${cleanCategory}-${safePeriod}-${safeType}`;
  }
  return `${safePeriod}-${safeType}`;
}

/**
 * URL 쿼리 파라미터의 mode 값을 안전한 RankingType으로 검증 및 정규화합니다.
 * - 대소문자 무시, 공백 trim, 유효하지 않은 값에 대한 'total' fallback
 */
export function resolveModeParam(param: string | null | undefined): RankingType {
  if (!param || typeof param !== 'string') return 'total';
  const normalized = param.trim().toLowerCase();
  if (normalized === 'time-attack') return 'time-attack';
  if (normalized === 'survival') return 'survival';
  if (normalized === 'infinite') return 'infinite';
  return 'total';
}
