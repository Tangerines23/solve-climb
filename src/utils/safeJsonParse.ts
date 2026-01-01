/**
 * 안전한 JSON 파싱 유틸리티
 * 악의적 JSON 파싱을 방지하고 타입 안전성을 보장합니다.
 */

/**
 * 로컬 세션 타입 정의
 */
export interface LocalSession {
  userId: string;
  isAdmin: boolean;
  loginTime?: string;
  loginType?: string;
}

/**
 * 로컬 세션 타입 가드
 */
function isLocalSession(data: unknown): data is LocalSession {
  return (
    typeof data === 'object' &&
    data !== null &&
    'userId' in data &&
    'isAdmin' in data &&
    typeof (data as LocalSession).userId === 'string' &&
    typeof (data as LocalSession).isAdmin === 'boolean'
  );
}

/**
 * 안전한 JSON 파싱 함수
 * @param jsonString 파싱할 JSON 문자열
 * @param defaultValue 파싱 실패 시 반환할 기본값
 * @param validator 선택적 타입 검증 함수
 * @returns 파싱된 데이터 또는 기본값
 */
export function safeJsonParse<T>(
  jsonString: string | null,
  defaultValue: T,
  validator?: (data: unknown) => data is T
): T {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // 타입 검증 함수가 제공된 경우 검증
    if (validator && !validator(parsed)) {
      console.warn('JSON parsing validation failed, using default value');
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    console.warn('JSON parsing failed:', error);
    return defaultValue;
  }
}

/**
 * 로컬 세션을 안전하게 파싱하는 함수
 */
export function parseLocalSession(jsonString: string | null): LocalSession | null {
  return safeJsonParse<LocalSession | null>(
    jsonString,
    null,
    isLocalSession as (data: unknown) => data is LocalSession | null
  );
}
