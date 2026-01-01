/**
 * 입력 검증 유틸리티
 * XSS 공격 방지를 위한 입력 정제 및 검증 함수
 */

// 허용 문자: 한글, 영문, 숫자, 공백
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9\s]+$/;

/**
 * HTML 태그 제거
 */
const removeHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '');
};

/**
 * 공백 정규화 (앞뒤 공백 제거, 연속 공백 단일화)
 */
const normalizeWhitespace = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * 닉네임 정제 함수
 * - HTML 태그 제거
 * - 공백 정규화
 * - 앞뒤 공백 제거
 */
export const sanitizeNickname = (nickname: string): string => {
  let sanitized = nickname;

  // HTML 태그 제거
  sanitized = removeHtmlTags(sanitized);

  // 공백 정규화
  sanitized = normalizeWhitespace(sanitized);

  return sanitized;
};

/**
 * 닉네임 검증 함수
 * @param nickname 검증할 닉네임
 * @returns 검증 결과 및 에러 메시지
 */
export const validateNickname = (nickname: string): { valid: boolean; error?: string } => {
  // 빈 문자열 체크
  if (!nickname.trim()) {
    return { valid: false, error: '닉네임을 입력해주세요.' };
  }

  // 길이 체크
  if (nickname.length > 10) {
    return { valid: false, error: '닉네임은 10자 이하여야 합니다.' };
  }

  // 허용 문자 체크
  if (!NICKNAME_PATTERN.test(nickname)) {
    return { valid: false, error: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.' };
  }

  return { valid: true };
};
