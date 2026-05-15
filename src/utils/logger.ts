// Removed direct store import to comply with boundary rules

/**
 * 로깅 유틸리티
 * 개발/프로덕션 환경 구분 및 일관된 로깅 형식 제공
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 로그 레벨 설정 (개발 환경에서만 적용)
 */
const LOG_LEVEL: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;

/**
 * 로그 스타일 설정
 */
const LOG_STYLES = {
  debug: 'color: #888; font-weight: normal;',
  info: 'color: #2196F3; font-weight: normal;',
  warn: 'color: #FF9800; font-weight: bold;',
  error: 'color: #F44336; font-weight: bold;',
} as const;

type LogHandler = (
  level: 'info' | 'warning' | 'error',
  message: string,
  stack?: string,
  context?: string
) => void;
const logHandlers: LogHandler[] = [];

/**
 * 로그 포맷터
 */
function formatMessage(context: string, message: string, ..._args: unknown[]): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${context}] ${message}`;
}

/**
 * 로그 출력 함수
 */
function log(level: LogLevel, context: string, message: string, ...args: unknown[]): void {
  // 프로덕션에서는 ERROR 레벨만 로깅
  if (isProduction && level < LogLevel.ERROR) {
    return;
  }

  // 로그 레벨 필터링
  if (level < LOG_LEVEL) {
    return;
  }

  const formattedMessage = formatMessage(context, message, ...args);
  const styles = Object.values(LOG_STYLES) as string[];
  const style = level >= 0 && level < styles.length ? (styles.at(level) ?? '') : '';

  // 외부 핸들러 실행 (예: 스토어 저장)
  if (logHandlers.length > 0) {
    const errorLevel: 'info' | 'warning' | 'error' =
      level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warning' : 'info';
    const err = args.find((a) => a instanceof Error) as Error | undefined;
    logHandlers.forEach((handler) => {
      try {
        handler(errorLevel, message, err?.stack, context);
      } catch (e) {
        console.warn('Log handler failed', e);
      }
    });
  }

  switch (level) {
    case LogLevel.DEBUG:
      if (isDevelopment) {
        console.debug(`%c${formattedMessage}`, style, ...args);
      }
      break;
    case LogLevel.INFO:
      if (isDevelopment) {
        console.info(`%c${formattedMessage}`, style, ...args);
      }
      break;
    case LogLevel.WARN:
      console.warn(`%c${formattedMessage}`, style, ...args);
      break;
    case LogLevel.ERROR:
      console.error(`%c${formattedMessage}`, style, ...args);
      break;
  }
}

/**
 * 로깅 유틸리티 객체
 */
export const logger = {
  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug(context: string, message: string, ...args: unknown[]): void {
    log(LogLevel.DEBUG, context, message, ...args);
  },

  /**
   * 정보 로그 (개발 환경에서만)
   */
  info(context: string, message: string, ...args: unknown[]): void {
    log(LogLevel.INFO, context, message, ...args);
  },

  /**
   * 경고 로그
   */
  warn(context: string, message: string, ...args: unknown[]): void {
    log(LogLevel.WARN, context, message, ...args);
  },

  /**
   * 에러 로그
   */
  error(context: string, message: string, error?: unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      log(LogLevel.ERROR, context, `${message}`, error, ...args);
      if (isDevelopment && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      log(LogLevel.ERROR, context, `${message}`, error, ...args);
    }
  },

  /**
   * 그룹 로그 (개발 환경에서만)
   */
  group(context: string, label: string, fn: () => void): void {
    if (!isDevelopment) {
      fn();
      return;
    }
    if (typeof console.group === 'function') {
      console.group(`[${context}] ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      console.log(`[${context}] ${label} (Group Start)`);
      try {
        fn();
      } finally {
        console.log(`[${context}] ${label} (Group End)`);
      }
    }
  },

  /**
   * 테이블 로그 (개발 환경에서만)
   */
  table(context: string, data: unknown): void {
    if (!isDevelopment) {
      return;
    }
    console.group(`[${context}] Table`);
    console.table(data);
    console.groupEnd();
  },

  /**
   * 진단용 로그 (메인 진입점 전용)
   */
  log(message: string, color?: string): void {
    if (!isDevelopment) return;
    const style = color ? `color: ${color}; font-weight: bold;` : LOG_STYLES.info;
    const timestamp = new Date().toISOString();
    console.log(`%c[${timestamp}] [SYSTEM] ${message}`, style);
  },

  /**
   * 로그 핸들러 등록
   */
  registerHandler(handler: LogHandler): () => void {
    logHandlers.push(handler);
    return () => {
      const index = logHandlers.indexOf(handler);
      if (index > -1) logHandlers.splice(index, 1);
    };
  },
};
