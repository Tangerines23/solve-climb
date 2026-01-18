/**
 * Solve-Climb 중앙 집중형 로깅 시스템
 * 개발 환경(DEV)에서는 상세 로그를 출력하고, 프로덕션(PROD)에서는 보안을 위해 숨깁니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = import.meta.env.DEV;

class DebugLogger {
  private prefix = '[SolveClimb]';

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
    return `${this.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    // 경고는 프로덕션에서도 최소한으로 출력할 수 있도록 설정 가능
    if (IS_DEV) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]) {
    // 에러는 프로덕션에서도 추적을 위해 출력 (또는 외부 Sentry 등으로 전송 가능)
    console.error(this.formatMessage('error', message), error, ...args);
  }

  /**
   * 가시적 진단 로그 (기존 main.tsx의 log 함수 호환용)
   */
  log(message: string, color?: string) {
    if (IS_DEV) {
      const styles = color ? `color: ${color}; font-weight: bold;` : '';
      console.log(`%c${this.formatMessage('info', message)}`, styles);
    }
  }
}

export const logger = new DebugLogger();
