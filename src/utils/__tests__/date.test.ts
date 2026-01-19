import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTimeAgo } from '../date';

describe('getTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed "now"
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "방금 전" for times within 60 seconds', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    // 30 seconds ago
    const past = new Date(now.getTime() - 30 * 1000);
    expect(getTimeAgo(past)).toBe('방금 전');
    expect(getTimeAgo(past.toISOString())).toBe('방금 전');
  });

  it('should return "X분 전" for times within 60 minutes', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    // 5 minutes ago
    const past = new Date(now.getTime() - 5 * 60 * 1000);
    expect(getTimeAgo(past)).toBe('5분 전');
  });

  it('should return "X시간 전" for times within 24 hours', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    // 3 hours ago
    const past = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(getTimeAgo(past)).toBe('3시간 전');
  });

  it('should return "X일 전" for times within 7 days', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    // 2 days ago
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(getTimeAgo(past)).toBe('2일 전');
  });

  it('should return date string for times older than 7 days', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    // 10 days ago
    const past = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    // Locale date string format depends on environment.
    // getTimeAgo uses toLocaleDateString() without args.
    // We verify it returns a value that is NOT relative time format
    const result = getTimeAgo(past);
    expect(result).not.toContain('전');
    // It likely contains the year 2023
    expect(result).toContain('2023');
  });

  it('should handle invalid dates by returning "방금 전"', () => {
    expect(getTimeAgo('invalid-date-string')).toBe('방금 전');
  });
});
