import { useSearchParams } from 'react-router-dom';
import { QuizProvider } from '@/contexts/QuizContext';
import { QuizLayout } from '@/components/quiz/QuizLayout';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
} from '@/utils/urlParams';

/**
 * QuizPage - 퀴즈 페이지의 메인 쉘 컴포넌트
 * - URL 파라미터 유효성 검사 및 초기화 담당
 * - QuizProvider를 통해 하위 컴포넌트에 상태 제공
 */
export function QuizPage() {
  const [searchParams] = useSearchParams();

  // URL 파라미터 추출 및 유효성 검사
  const worldParam = validateWorldParam(searchParams.get('world'));
  const categoryParam = validateCategoryInWorldParam(worldParam, searchParams.get('category'));
  const levelParam = validateLevelParam(searchParams.get('level'), 20);
  const modeParam = validateModeParam(searchParams.get('mode'));
  const isPreview = searchParams.get('preview') === 'true';
  const mountainParam = searchParams.get('mountain');

  const params = {
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    isPreview,
    mountainParam,
    searchParams,
  };

  return (
    <QuizProvider params={params}>
      <QuizLayout />
    </QuizProvider>
  );
}
