import { useMemo } from 'react';
import { SeededRandom } from '@/utils/seededRandom';

/**
 * 프로젝트 전체 아키텍처 규칙에 따라 Page에서 Utils를 직접 참조할 수 없으므로
 * 브릿지 역할을 하는 Hook을 통해 SeededRandom 인스턴스를 제공합니다.
 */
export function useSeededRandom(seed: string) {
  return useMemo(() => new SeededRandom(seed), [seed]);
}
