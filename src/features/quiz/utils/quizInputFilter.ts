/**
 * 퀴즈 입력 필터링 옵션 인터페이스
 */
export interface QuizInputFilterOptions {
  isJapaneseQuiz?: boolean;
  forceSystemKeyboard?: boolean;
  allowNegative?: boolean;
}

export const QUIZ_INPUT_LIMITS = {
  MAX_JAPANESE_LENGTH: 20,
  MAX_SYSTEM_TEXT_LENGTH: 10,
  MAX_NUMERIC_LENGTH: 6,
} as const;

/**
 * 퀴즈 입력 문자열 정제 및 길이 제한 순수 함수
 * - 일본어 퀴즈: 영문 알파벳만 허용 (최대 20자)
 * - 일반 시스템 텍스트 퀴즈: 최대 10자 허용
 * - 음수 허용 퀴즈: 숫자 및 선두 음수 부호만 허용 (최대 6자)
 * - 일반 숫자 퀴즈: 숫자만 허용 (최대 6자)
 *
 * Object Calisthenics 준수: 0 else
 */
export function sanitizeQuizInput(value: string, options: QuizInputFilterOptions = {}): string {
  const { isJapaneseQuiz = false, forceSystemKeyboard = false, allowNegative = false } = options;

  if (isJapaneseQuiz) {
    return value.replace(/[^a-zA-Z]/g, '').slice(0, QUIZ_INPUT_LIMITS.MAX_JAPANESE_LENGTH);
  }

  if (forceSystemKeyboard) {
    return value.slice(0, QUIZ_INPUT_LIMITS.MAX_SYSTEM_TEXT_LENGTH);
  }

  if (allowNegative) {
    let newValue = value.replace(/[^0-9-]/g, '');
    if (newValue.includes('-') && newValue.indexOf('-') !== 0) {
      newValue = '-' + newValue.replace(/-/g, '');
    }
    const minusCount = (newValue.match(/-/g) || []).length;
    if (minusCount > 1) {
      newValue = '-' + newValue.replace(/-/g, '');
    }
    return newValue.slice(0, QUIZ_INPUT_LIMITS.MAX_NUMERIC_LENGTH);
  }

  return value.replace(/[^0-9]/g, '').slice(0, QUIZ_INPUT_LIMITS.MAX_NUMERIC_LENGTH);
}
