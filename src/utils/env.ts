/**
 * 환경 변수 관리 및 검증 유틸리티
 * 필수 환경 변수를 검증하고 타입 안전하게 관리합니다.
 */

import { logger } from './logger';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// #region agent log
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'env.ts:8-9',
    message: 'Environment flags',
    data: {
      isDev: isDevelopment,
      isProd: isProduction,
      envVars: {
        supabaseUrl: supabaseUrl || 'undefined',
        supabaseKey: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'undefined'
      }
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A,C,E'
  })
}).catch(() => {});
// #endregion

/**
 * 환경 변수 타입 정의
 */
export interface EnvConfig {
  /** Supabase 프로젝트 URL */
  SUPABASE_URL: string;
  /** Supabase Anon Key */
  SUPABASE_ANON_KEY: string;
  /** 개발 환경 여부 */
  IS_DEVELOPMENT: boolean;
  /** 프로덕션 환경 여부 */
  IS_PRODUCTION: boolean;
}

/**
 * 필수 환경 변수 목록
 */
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

/**
 * 환경 변수 검증 결과
 */
interface ValidationResult {
  isValid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * 환경 변수 검증 함수
 * @param strict 엄격 모드 (프로덕션에서는 true, 개발에서는 false)
 * @returns 검증 결과
 */
function validateEnv(strict: boolean = isProduction): ValidationResult {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'env.ts:72',
      message: 'validateEnv called',
      data: { strict, isProduction },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
  const missing: string[] = [];
  const errors: string[] = [];

  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = import.meta.env[varName];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'env.ts:79',
        message: 'Checking env var',
        data: { varName, hasValue: !!value, valueLength: value?.length || 0 },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B,D,E'
      })
    }).catch(() => {});
    // #endregion
    if (!value || value.trim() === '') {
      missing.push(varName);
      errors.push(`필수 환경 변수 "${varName}"가 설정되지 않았습니다.`);
    }
  });

  // Supabase URL 형식 검증
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL은 https://로 시작해야 합니다.');
  }

  const result = {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'env.ts:96',
      message: 'validateEnv result',
      data: result,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,B,D'
    })
  }).catch(() => {});
  // #endregion
  return result;
}

/**
 * 환경 변수 검증 및 에러 처리
 * @throws 환경 변수가 누락된 경우 (프로덕션) 또는 경고 (개발)
 */
function validateAndHandleEnv(): void {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'env.ts:111',
      message: 'validateAndHandleEnv entry',
      data: { isProduction },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
  const result = validateEnv();

  if (!result.isValid) {
    const errorMessage = [
      '환경 변수 검증 실패:',
      ...result.errors,
      '',
      '필수 환경 변수:',
      ...REQUIRED_ENV_VARS.map((v) => `  - ${v}`),
      '',
      '.env.example 파일을 참고하여 환경 변수를 설정해주세요.',
    ].join('\n');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'env.ts:128',
        message: 'Validation failed, checking production',
        data: { isProduction, willThrow: isProduction },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      })
    }).catch(() => {});
    // #endregion
    if (isProduction) {
      // 프로덕션에서는 에러 발생
      throw new Error(errorMessage);
    } else {
      // 개발 환경에서는 경고만 표시
      logger.warn('Env', errorMessage);
    }
  }
}

/**
 * 환경 변수 객체
 * 검증 후 안전하게 접근 가능한 환경 변수들
 */
export const ENV: EnvConfig = (() => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8e4324b5-9dc1-47d8-937c-afc744e1c2c9', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'env.ts:145',
      message: 'ENV module-level initialization',
      data: { isProduction, isDevelopment },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,E'
    })
  }).catch(() => {});
  // #endregion
  // 환경 변수 검증
  validateAndHandleEnv();

  return {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    IS_DEVELOPMENT: isDevelopment,
    IS_PRODUCTION: isProduction,
  };
})();

/**
 * 환경 변수 검증 함수 (외부에서 사용 가능)
 */
export function checkEnv(): ValidationResult {
  return validateEnv();
}

/**
 * 환경 변수 정보 출력 (개발 환경에서만)
 */
export function logEnvInfo(): void {
  if (!isDevelopment) {
    return;
  }

  logger.group('Env', '환경 변수 정보', () => {
    logger.info('Env', `개발 환경: ${isDevelopment}`);
    logger.info('Env', `프로덕션 환경: ${isProduction}`);
    logger.info('Env', `Supabase URL: ${ENV.SUPABASE_URL ? '설정됨' : '미설정'}`);
    logger.info('Env', `Supabase Anon Key: ${ENV.SUPABASE_ANON_KEY ? '설정됨' : '미설정'}`);
  });
}

