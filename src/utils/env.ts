import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { logger } from './logger';

/**
 * [ t3-env 를 사용한 환경 변수 검증 ]
 * 서버/클라이언트 환경 변수를 구분하고, 런타임에 유효성을 엄격하게 체크합니다.
 * 앱 구동 시 필요한 변수가 누락되면 즉시 에러를 발생시켜 안전한 가동을 보장합니다.
 */
const isCI = typeof process !== 'undefined' && (!!process.env.CI || !!process.env.VITE_CI);
const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
const isTestOrCI = isCI || isTest;

export const ENV = createEnv({
  clientPrefix: 'VITE_',
  client: {
    // 1. Supabase 설정 (필수, 단 CI/Test에서는 기본값 제공)
    VITE_SUPABASE_URL: z
      .string()
      .url('Invalid Supabase URL')
      .min(1)
      .default(isTestOrCI ? 'http://localhost:54321' : (undefined as unknown as string)),
    VITE_SUPABASE_ANON_KEY: z
      .string()
      .min(1, 'Supabase Key is required')
      .default(isTestOrCI ? 'dummy-anon-key' : (undefined as unknown as string)),

    // 2. 광고 및 분석 설정 (기본값 제공)
    VITE_ADMOB_APP_ID: z.string().default('ca-app-pub-6410061165772335~9825031776'),
    VITE_ADMOB_REWARDED_ID: z.string().default('ca-app-pub-6410061165772335/6536523456'),
    VITE_SENTRY_DSN: z.string().optional(),

    // 3. 디버그 및 플랫폼 설정
    VITE_DEBUG_URL: z.string().optional().default(''),
    VITE_IS_VERCEL: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((v) => v === 'true' || v === true),
  },

  // Vite 환경에서는 import.meta.env를 runtimeEnv로 전달
  runtimeEnv: import.meta.env,

  // 개발 환경에서만 에러 대신 경고를 출력하고 싶을 때 true (선택 사항)
  // emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    // CI/Test 환경에서 누락된 변수가 있더라도 에러를 던지지 않고 경고만 출력
    console.error('❌ Environment Validation Failed!');
    console.error('--------------------------------------------------');
    issues.forEach((issue) => {
      console.error(`- [${issue.path?.join('.') || 'unknown'}] : ${issue.message}`);
    });
    console.error('--------------------------------------------------');
    console.warn('⚠️ Above issues are non-critical in CI/Test but will cause failures in PROD.');

    if (!isTestOrCI) {
      throw new Error(`Invalid environment variables: ${JSON.stringify(issues, null, 2)}`);
    }
    // Satisfy 'never' return type for t3-env
    throw new Error('Skip validation for CI/Test');
  },
});

/**
 * 앱 구동 시 환경 변수 상태를 로깅합니다 (개발 환경 전용)
 */
export function logEnvInfo(): void {
  if (!import.meta.env.DEV) return;

  logger.group('Env', '🚀 안전한 환경 변수 로드 완료 (t3-env)', () => {
    logger.info('Env', `모드: ${import.meta.env.MODE}`);
    logger.info(
      'Env',
      `Supabase URL: ${ENV.VITE_SUPABASE_URL ? '✅ 연결됨' : '❌ 연결 실패 (필수)'}`
    );
    logger.info('Env', `Sentry: ${ENV.VITE_SENTRY_DSN ? '✅ 활성화' : '⚠️ 미설정'}`);
    logger.info('Env', `AdMob App ID: ${ENV.VITE_ADMOB_APP_ID}`);
  });
}

// 기존 ENV 객체와 호환성을 맞추기 위한 별칭 (기존 코드 수정 최소화)
export const config = {
  SUPABASE_URL: ENV.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: ENV.VITE_SUPABASE_ANON_KEY,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  DEBUG_URL: ENV.VITE_DEBUG_URL,
  IS_VERCEL: !!ENV.VITE_IS_VERCEL,
  ADMOB_APP_ID: ENV.VITE_ADMOB_APP_ID,
  ADMOB_REWARDED_ID: ENV.VITE_ADMOB_REWARDED_ID,
  SENTRY_DSN: ENV.VITE_SENTRY_DSN || '',
} as const;
