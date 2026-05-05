import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { urls } from '@/utils/navigation';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '@/utils/urlParams';

/**
 * Bridge hook for QuizPage.
 * Encapsulates URL parameter validation and navigation logic.
 */
export function useQuizPageBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL 파라미터 추출 및 유효성 검사
  const worldParam = validateWorldParam(searchParams.get('world'));
  const categoryParam = validateCategoryInWorldParam(worldParam, searchParams.get('category'));
  const levelParam = validateLevelParam(searchParams.get('level'), 20);
  const modeParam = validateModeParam(searchParams.get('mode'));
  const isPreview = searchParams.get('preview') === 'true';
  const mountainParam = searchParams.get('mountain');

  // 필수 파라미터가 없으면 홈으로 리다이렉트 (프리뷰 모드 제외)
  useEffect(() => {
    if (!isPreview && (!worldParam || !categoryParam || !mountainParam)) {
      console.warn('Missing mandatory quiz parameters. Redirecting to home.');
      navigate(urls.home(), { replace: true });
    }
  }, [isPreview, worldParam, categoryParam, mountainParam, navigate]);

  const params = {
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    isPreview,
    mountainParam,
    searchParams,
  };

  return {
    params,
  };
}
