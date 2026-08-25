import { describe, it, expect } from 'vitest';
import { safeGet, isInstrumentPlaying } from '../tracks/helpers';

describe('Sound Tracks Helpers - isInstrumentPlaying & safeGet', () => {
  describe('safeGet', () => {
    it('배열 인덱스 접근 시 범위 내의 값을 정상 반환해야 함', () => {
      const arr = [10, 20, 30];
      expect(safeGet(arr, 1, 0)).toBe(20);
    });

    it('배열 인덱스 초과 시 fallback 값을 반환해야 함', () => {
      const arr = [10, 20];
      expect(safeGet(arr, 5, 99)).toBe(99);
    });

    it('객체 레코드 접근 시 키가 존재하면 해당 값을 반환해야 함', () => {
      const record = { 0: 'A', 1: 'B' };
      expect(safeGet(record, 1, 'Z')).toBe('B');
      expect(safeGet(record, 2, 'Z')).toBe('Z');
    });

    it('undefined 입력 시 fallback을 반환해야 함', () => {
      expect(safeGet(undefined, 0, 'default')).toBe('default');
    });
  });

  describe('isInstrumentPlaying', () => {
    it('음수 step일 경우 항상 false를 반환해야 함', () => {
      expect(isInstrumentPlaying('brain_age', '🎻 워킹 베이스', -1)).toBe(false);
    });

    it('베이스 악기는 4박(step % 4 === 0)마다 발음되어야 함', () => {
      expect(isInstrumentPlaying('brain_age', '🎻 워킹 콘트라베이스', 0)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🎻 워킹 콘트라베이스', 4)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🎻 워킹 콘트라베이스', 1)).toBe(false);
      expect(isInstrumentPlaying('brain_age', '🎻 워킹 콘트라베이스', 2)).toBe(false);
    });

    it('킥 드럼 및 4-on-Floor는 4박마다 발음되어야 함', () => {
      expect(isInstrumentPlaying('celeste', '🥁 4-on-Floor 킥 드럼', 0)).toBe(true);
      expect(isInstrumentPlaying('celeste', '🥁 4-on-Floor 킥 드럼', 4)).toBe(true);
      expect(isInstrumentPlaying('celeste', '🥁 4-on-Floor 킥 드럼', 8)).toBe(true);
      expect(isInstrumentPlaying('celeste', '🥁 4-on-Floor 킥 드럼', 2)).toBe(false);
    });

    it('스네어, 림샷, 우드블록은 2박/4박(step % 16 in [4, 12, 8, 14])에 발음되어야 함', () => {
      expect(isInstrumentPlaying('shop', '🪵 우드블록 림샷', 4)).toBe(true);
      expect(isInstrumentPlaying('shop', '🪵 우드블록 림샷', 12)).toBe(true);
      expect(isInstrumentPlaying('shop', '🪵 우드블록 림샷', 1)).toBe(false);
    });

    it('하이햇 / 16비트 퍼커션은 8분/16분 음표마다 발음되어야 함', () => {
      expect(isInstrumentPlaying('brain_age', '🥁 브러쉬 스네어 & 하이햇', 0)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🥁 브러쉬 스네어 & 하이햇', 2)).toBe(true);
      expect(isInstrumentPlaying('shop', '🪇 16비트 셰이커', 0)).toBe(true);
      expect(isInstrumentPlaying('shop', '🪇 16비트 셰이커', 2)).toBe(true);
    });

    it('피아노 및 로즈 건반 컴핑/오스티나토는 리듬에 맞춰 발음되어야 함', () => {
      expect(isInstrumentPlaying('celeste', '🎹 First Steps 피아노 아르페지오', 0)).toBe(true);
      expect(isInstrumentPlaying('celeste', '🎹 First Steps 피아노 아르페지오', 2)).toBe(true);
      expect(isInstrumentPlaying('chill', '🪵 엇박 아날로그 오스티나토', 0)).toBe(true);
      expect(isInstrumentPlaying('chill', '🪵 엇박 아날로그 오스티나토', 3)).toBe(true);
      expect(isInstrumentPlaying('chill', '🪵 엇박 아날로그 오스티나토', 6)).toBe(true);
      expect(isInstrumentPlaying('chill', '🪵 엇박 아날로그 오스티나토', 1)).toBe(false);
    });

    it('심장박동 / 맥박은 쿵-쾅 더블 비트에 맞춰 발음되어야 함', () => {
      expect(isInstrumentPlaying('crisis', '💓 쿵-쾅 더블 심장박동', 0)).toBe(true);
      expect(isInstrumentPlaying('crisis', '💓 쿵-쾅 더블 심장박동', 3)).toBe(true);
      expect(isInstrumentPlaying('crisis', '💓 쿵-쾅 더블 심장박동', 8)).toBe(true);
      expect(isInstrumentPlaying('crisis', '💓 쿵-쾅 더블 심장박동', 1)).toBe(false);
    });

    it('시계 초침은 째깍 8분 음표마다 발음되어야 함', () => {
      expect(isInstrumentPlaying('crisis', '⏱️ 16비트 시계 초침 째깍', 0)).toBe(true);
      expect(isInstrumentPlaying('crisis', '⏱️ 16비트 시계 초침 째깍', 2)).toBe(true);
      expect(isInstrumentPlaying('crisis', '⏱️ 16비트 시계 초침 째깍', 1)).toBe(false);
    });

    it('리드 멜로디 / 비브라폰 / 멜로디카 / 실로폰은 멜로디 스텝에 맞춰 발음되어야 함', () => {
      expect(isInstrumentPlaying('brain_age', '🔔 비브라폰 솔로', 0)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🔔 비브라폰 솔로', 2)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🔔 비브라폰 솔로', 4)).toBe(true);
      expect(isInstrumentPlaying('brain_age', '🔔 비브라폰 솔로', 1)).toBe(false);
    });
  });
});
