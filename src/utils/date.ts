// src/utils/date.ts

/**
 * 날짜 객체 또는 ISO 문자열을 받아 '몇 분 전', '몇 일 전' 등의 문자열로 변환합니다.
 */
export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(past.getTime())) return '방금 전';

  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return past.toLocaleDateString();
}
