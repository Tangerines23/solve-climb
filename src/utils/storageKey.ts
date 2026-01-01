/**
 * 안전한 localStorage 키 생성 유틸리티
 * URL 파라미터를 localStorage 키에 사용할 때 안전하게 처리
 */

/**
 * 안전한 localStorage 키 생성
 * 특수문자를 제거하고 검증된 값만 사용
 *
 * @param parts 키를 구성할 부분들
 * @returns 안전한 키 문자열
 */
export function createSafeStorageKey(...parts: (string | number | null | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part != null)
    .map((part) => {
      const str = String(part);
      // 특수문자 제거 (영문, 숫자, 언더스코어, 하이픈만 허용)
      // XSS 공격 방지를 위해 HTML 태그 및 스크립트 문자 제거
      return str
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .replace(/[^a-zA-Z0-9_-]/g, '') // 특수문자 제거
        .substring(0, 100); // 길이 제한 (100자)
    })
    .filter((part) => part.length > 0)
    .join('_');
}
