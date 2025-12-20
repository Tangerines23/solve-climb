/**
 * 환경 변수 관리 및 검증 유틸리티
 * 필수 환경 변수를 검증하고 타입 안전하게 관리합니다.
 */

import { logger } from './logger';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

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
  /** 디버깅 URL (개발 환경에서만 사용) */
  DEBUG_URL: string;
  /** Vercel 환경 여부 */
  IS_VERCEL: boolean;
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
  const missing: string[] = [];
  const errors: string[] = [];

  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = import.meta.env[varName];
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

  // Supabase Anon Key 형식 검증
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseAnonKey && supabaseAnonKey.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY 형식이 올바르지 않습니다. (최소 100자 이상이어야 합니다)');
  }

  const result = {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
  return result;
}

/**
 * 환경 변수 검증 및 에러 처리
 * 심사 환경에서는 환경 변수가 없을 수 있으므로 에러를 던지지 않고 경고만 표시
 */
function validateAndHandleEnv(): void {
  const result = validateEnv(false); // 항상 non-strict 모드로 검증

  if (!result.isValid) {
    const errorMessage = [
      '환경 변수 검증 실패:',
      ...result.errors,
      '',
      '필수 환경 변수:',
      ...REQUIRED_ENV_VARS.map((v) => `  - ${v}`),
      '',
      '.env.example 파일을 참고하여 환경 변수를 설정해주세요.',
      '심사 환경에서는 환경 변수가 없어도 앱이 동작합니다 (Supabase 기능 제한).',
    ].join('\n');

    // 모든 환경에서 경고만 표시 (에러를 던지지 않음)
    if (isDevelopment) {
      logger.warn('Env', errorMessage);
    } else {
      // 프로덕션에서는 콘솔에만 출력 (logger가 없을 수 있음)
      console.warn('[Env]', errorMessage);
    }
  }
}

/**
 * 환경 변수 객체
 * 검증 후 안전하게 접근 가능한 환경 변수들
 */
export const ENV: EnvConfig = (() => {
  // 환경 변수 검증
  validateAndHandleEnv();

  return {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    IS_DEVELOPMENT: isDevelopment,
    IS_PRODUCTION: isProduction,
    DEBUG_URL: import.meta.env.VITE_DEBUG_URL || '',
    IS_VERCEL: !!import.meta.env.VITE_IS_VERCEL,
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

