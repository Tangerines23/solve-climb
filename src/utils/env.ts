import { z } from 'zod';
import { logger } from './logger';

/**
 * 환경 변수 스키마 정의
 * Zod를 사용하여 타입과 유효성을 동시에 정의합니다.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Key must be at least 1 character').optional(),
  VITE_DEBUG_URL: z.string().optional().default(''),
  VITE_IS_VERCEL: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  VITE_ADMOB_APP_ID: z.string().default('ca-app-pub-6410061165772335~9825031776'),
  VITE_ADMOB_REWARDED_ID: z.string().default('ca-app-pub-6410061165772335/6536523456'),
  VITE_SENTRY_DSN: z.string().optional(),
});

// meta.env 타입을 기반으로 파싱
const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success && import.meta.env.DEV) {
  console.warn('⚠️ [Env] 일부 환경 변수 검증 실패, 기본값을 사용합니다.');
}

// 검증 결과 (실패 시에도 파싱 시도하여 가능한 값은 채움)
const data = parsedEnv.success ? parsedEnv.data : undefined;

/**
 * 프로젝트 전용 환경 변수 객체 (Type-Safe)
 * Zod 검증이 실패하더라도 import.meta.env에서 직접 값 추출 시도 (Resilience)
 */
export const ENV = {
  SUPABASE_URL: data?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: data?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  DEBUG_URL: data?.VITE_DEBUG_URL || import.meta.env.VITE_DEBUG_URL || '',
  IS_VERCEL: !!(data?.VITE_IS_VERCEL || import.meta.env.VITE_IS_VERCEL === 'true'),
  ADMOB_APP_ID:
    data?.VITE_ADMOB_APP_ID ||
    import.meta.env.VITE_ADMOB_APP_ID ||
    'ca-app-pub-6410061165772335~9825031776',
  ADMOB_REWARDED_ID:
    data?.VITE_ADMOB_REWARDED_ID ||
    import.meta.env.VITE_ADMOB_REWARDED_ID ||
    'ca-app-pub-6410061165772335/6536523456',
  SENTRY_DSN: data?.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN || '',
} as const;

export type EnvConfig = typeof ENV;

/**
 * 환경 변수 유효성 검사 (테스트용)
 */
export function checkEnv() {
  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.keys(formatted).filter((key) => key !== '_errors');
    return {
      isValid: false,
      missing,
      errors: formatted,
    };
  }
  return {
    isValid: true,
    missing: [],
    errors: {},
  };
}

/**
 * 환경 변수 정보 출력 (개발 환경 전용)
 */
export function logEnvInfo(): void {
  if (!import.meta.env.DEV) return;

  logger.group('Env', '🚀 환경 변수 로드 완료', () => {
    logger.info('Env', `모드: ${import.meta.env.MODE}`);
    logger.info(
      'Env',
      `Supabase URL: ${ENV.SUPABASE_URL ? '✅ 연결됨' : '⚠️ 미설정 (Fallback: localhost)'}`
    );
    logger.info('Env', `Sentry: ${ENV.SENTRY_DSN ? '✅ 활성화' : '⚠️ 미설정'}`);
    logger.info('Env', `Vercel Host: ${ENV.IS_VERCEL ? '✅ Yes' : 'No'}`);
  });
}
