import { SURVIVAL_CONFIG, CATEGORY_CONFIG } from '@/constants/game';
import { safeAccess } from '@/utils/validation';

interface DynamicTimeLimitParams {
  questionCategory: string;
  questionLevel: number;
  totalQuestionsAnswered: number;
}

/**
 * 서바이벌/무한 모드에서 문제 레벨과 진행도에 따라 동적 제한시간을 계산하는 순수 함수.
 *
 * 계산 로직:
 * 1. 카테고리별 maxLevel을 기준으로 문제 레벨을 1~10 스케일로 정규화
 * 2. 정규화된 레벨에 매핑된 기본 시간 조회
 * 3. 문제 수에 따른 압박 계수(pressure factor)를 적용하여 최종 시간 산출
 *
 * @returns 초 단위의 제한시간
 */
export function calculateDynamicTimeLimit({
  questionCategory,
  questionLevel,
  totalQuestionsAnswered,
}: DynamicTimeLimitParams): number {
  const { LEVEL_BASE_TIME, PRESSURE_FACTOR } = SURVIVAL_CONFIG.PRESSURE_CONFIG;

  const cat = questionCategory || '기초';
  const categoryMax =
    (safeAccess(CATEGORY_CONFIG, cat) as { maxLevel: number } | undefined)?.maxLevel ||
    CATEGORY_CONFIG.default.maxLevel;

  const normalizedLv = Math.max(1, Math.ceil((questionLevel / categoryMax) * 10));

  const baseTime =
    normalizedLv <= 10
      ? Object.entries(LEVEL_BASE_TIME).find(([k]) => Number(k) === normalizedLv)?.[1] || 10
      : 20 + (normalizedLv - 10) * 2;

  const currentPressure = Math.max(
    PRESSURE_FACTOR.MIN,
    PRESSURE_FACTOR.START - totalQuestionsAnswered * PRESSURE_FACTOR.DECAY
  );

  return baseTime * currentPressure;
}
