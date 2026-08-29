import type { BgmTheme } from '../types';

export const safeGet = <T>(
  arr: Record<number, T> | T[] | undefined,
  index: number,
  fallback: T
): T => {
  if (!arr) return fallback;
  if (Array.isArray(arr)) {
    return arr.at(index) ?? fallback;
  }
  return Object.prototype.hasOwnProperty.call(arr, index)
    ? // eslint-disable-next-line security/detect-object-injection -- validated above
      arr[index]
    : fallback;
};

/**
 * 특정 BGM 트랙 및 스텝(step)에서 해당 악기가 실제 음을 발산(발음) 중인지 판정하는 순수 함수
 * 리듬 게임 / 사운드트랙 비주얼라이저의 다이내믹 하이라이트에 사용됨
 */
export function isInstrumentPlaying(
  trackId: BgmTheme,
  instrumentName: string,
  step: number
): boolean {
  if (step < 0) return false;
  const norm = instrumentName.toLowerCase();

  // 1. 심장박동 / 맥박 (Crisis Heartbeat)
  if (norm.includes('심장') || norm.includes('맥박') || norm.includes('쿵-쾅')) {
    const local = step % 16;
    return local === 0 || local === 3 || local === 8;
  }

  // 2. 시계 초침 (Clock Ticking)
  if (norm.includes('초침') || norm.includes('째깍')) {
    return step % 2 === 0;
  }

  // 3. 킥 드럼 / 파워 드럼 / 4-on-Floor
  if (norm.includes('킥') || norm.includes('4-on-floor')) {
    return step % 4 === 0;
  }

  // 4. 하이햇 / 셰이커 / 16비트 퍼커션 / 드럼 세트 / Noise 드럼
  if (
    norm.includes('하이햇') ||
    norm.includes('셰이커') ||
    norm.includes('퍼커션') ||
    norm.includes('noise') ||
    norm.includes('드럼')
  ) {
    return step % 2 === 0;
  }

  // 5. 단독 타악기 (스네어 / 림샷 / 우드블록 / 팀파니 / 마칭)
  if (
    norm.includes('스네어') ||
    norm.includes('림샷') ||
    norm.includes('우드블록') ||
    norm.includes('팀파니') ||
    norm.includes('마칭')
  ) {
    const local = step % 16;
    return local === 4 || local === 12 || local === 8 || local === 14 || step % 4 === 2;
  }

  // 6. 베이스 계열 (워킹 베이스, 신스베이스, 모듈러, Triangle, 서브 베이스, 보사노바)
  if (
    norm.includes('베이스') ||
    norm.includes('워킹') ||
    norm.includes('bass') ||
    norm.includes('triangle')
  ) {
    if (trackId === 'climb' || trackId === 'arcade') {
      return step % 2 === 0;
    }
    if (trackId === 'shop') {
      const local = step % 4;
      return local === 0 || local === 2 || local === 3;
    }
    return step % 4 === 0;
  }

  // 7. 건반 / 피아노 / 로즈 / 컴핑 / 스트럼 / 기타 / 오스티나토
  if (
    norm.includes('피아노') ||
    norm.includes('로즈') ||
    norm.includes('컴핑') ||
    norm.includes('스트럼') ||
    norm.includes('기타') ||
    norm.includes('오스티나토') ||
    norm.includes('하모니')
  ) {
    if (trackId === 'celeste') {
      return step % 2 === 0;
    }
    if (trackId === 'chill' || trackId === 'shop') {
      const local = step % 8;
      return local === 0 || local === 3 || local === 6;
    }
    if (trackId === 'brain_age') {
      const local = step % 16;
      return local === 0 || local === 6 || local === 10 || local === 14;
    }
    if (trackId === 'puzzle') {
      const local = step % 8;
      return local === 0 || local === 4;
    }
    return step % 4 === 0;
  }

  // 8. 하프 / 아르페지오
  if (norm.includes('하프') || norm.includes('아르페지오')) {
    return step % 2 === 0;
  }

  // 9. 멜로디 / 리드 / 비브라폰 / 멜로디카 / 실로폰 / 마림바 / 슈퍼쏘우 / 브라스 / 트럼펫 / 사이렌 / 펄스
  if (
    norm.includes('리드') ||
    norm.includes('솔로') ||
    norm.includes('비브라폰') ||
    norm.includes('멜로디카') ||
    norm.includes('실로폰') ||
    norm.includes('마림바') ||
    norm.includes('슈퍼쏘우') ||
    norm.includes('브라스') ||
    norm.includes('트럼펫') ||
    norm.includes('사이렌') ||
    norm.includes('pulse') ||
    norm.includes('하모닉스') ||
    norm.includes('오케스트라') ||
    norm.includes('피버') ||
    norm.includes('잼')
  ) {
    const local = step % 8;
    return local === 0 || local === 2 || local === 4 || local === 6;
  }

  // 10. 패드 / 신스 스웰
  if (norm.includes('패드') || norm.includes('서브 펄스')) {
    return step % 8 === 0;
  }

  // 기본 fallback: 4박마다 펄스
  return step % 4 === 0;
}
