/**
 * 개발 환경 전용 디버깅 로거
 * 프로덕션 빌드에서는 자동으로 제거됩니다.
 */

const isDevelopment = import.meta.env.DEV;

/**
 * 디버깅 로그 전송 (개발 환경에서만)
 * @param location 코드 위치
 * @param message 메시지
 * @param data 추가 데이터
 */
export function sendDebugLog(
  location: string,
  message: string,
  data?: Record<string, unknown>
): void {
  // 프로덕션에서는 아무것도 하지 않음
  if (!isDevelopment) {
    return;
  }

  // 환경 변수에서 디버깅 URL 가져오기 (선택사항)
  const debugUrl = import.meta.env.VITE_DEBUG_URL;
  if (!debugUrl) {
    return; // 디버깅 URL이 설정되지 않으면 무시
  }

  // 비동기로 전송 (실패해도 앱에 영향 없음)
  fetch(debugUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    }),
  }).catch(() => {
    // 실패해도 무시
  });
}







