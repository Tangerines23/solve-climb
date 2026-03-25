import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { storageService, STORAGE_KEYS } from '@/services';
import { World, Category } from '@/types/quiz';
import { APP_CONFIG } from '@/config/app';

/**
 * 페이지 간 공통으로 사용되는 내비게이션 컨텍스트(파라미터)를 관리하는 훅
 * - URL 파라미터 추출 및 유효성 검증
 * - 최신 방문 정보 자동 저장
 * - 결손 파라미터 복구 로직 제공
 */
export function useNavigationContext() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mountain = searchParams.get('mountain');
  const world = searchParams.get('world') as World | null;
  const category = searchParams.get('category') as Category | null;

  const mountainName = useMemo(() => {
    if (!mountain) return null;
    return APP_CONFIG.MOUNTAIN_MAP[mountain as keyof typeof APP_CONFIG.MOUNTAIN_MAP] || null;
  }, [mountain]);

  const isValid = !!(mountain && mountainName);

  // 방문 기록 자동 저장
  useEffect(() => {
    if (mountain) {
      storageService.set(STORAGE_KEYS.LAST_VISITED_MOUNTAIN, mountain);
    }
    if (world) {
      storageService.set(STORAGE_KEYS.LAST_VISITED_WORLD, world);
    }
    if (category) {
      storageService.set(STORAGE_KEYS.LAST_VISITED_CATEGORY, category);
    }
  }, [mountain, world, category]);

  /**
   * 필수 파라미터가 누락되었을 때 저장된 기록으로부터 복구를 시도하고 리다이렉트합니다.
   * @param requiredParams 복구가 필요한 파라미터 목록 ('mountain' | 'world' | 'category')
   */
  const tryRecover = (requiredParams: ('mountain' | 'world' | 'category')[]) => {
    const missing = requiredParams.filter((p) => !searchParams.get(p));

    if (missing.length > 0) {
      const recMountain =
        searchParams.get('mountain') ||
        storageService.get<string>(STORAGE_KEYS.LAST_VISITED_MOUNTAIN);
      const recWorld =
        searchParams.get('world') || storageService.get<string>(STORAGE_KEYS.LAST_VISITED_WORLD);
      const recCategory =
        searchParams.get('category') ||
        storageService.get<string>(STORAGE_KEYS.LAST_VISITED_CATEGORY);

      // 모든 필수 값이 존재하거나 복구 가능할 때만 리다이렉트
      const canRecoverAll = requiredParams.every((p) => {
        if (p === 'mountain') return !!recMountain;
        if (p === 'world') return !!recWorld;
        if (p === 'category') return !!recCategory;
        return false;
      });

      if (canRecoverAll) {
        const params = new URLSearchParams();
        if (recMountain) params.set('mountain', recMountain);
        if (recWorld) params.set('world', recWorld);
        if (recCategory) params.set('category', recCategory);

        navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
        return true;
      }
    }
    return false;
  };

  return {
    mountain,
    world,
    category,
    mountainName,
    isValid,
    tryRecover,
  };
}
