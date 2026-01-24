import { z } from 'zod';
import { logger } from './logger';

/**
 * 환경 변수 스키마 정의
 * Zod를 사용하여 타입과 유효성을 동시에 정의합니다.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().startsWith('https://').default(''),
  VITE_SUPABASE_ANON_KEY: z.string().min(100).default(''),
  VITE_DEBUG_URL: z.string().optional().default(''),
  VITE_IS_VERCEL: z.string().optional().transform(v => v === 'true'),
  VITE_ADMOB_APP_ID: z.string().default('ca-app-pub-6410061165772335~9825031776'),
  VITE_ADMOB_REWARDED_ID: z.string().default('ca-app-pub-6410061165772335/6536523456'),
});

// meta.env 타입을 기반으로 파싱
const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const errorDetails = parsedEnv.error.format();
  const errorMessage = [
    '❌ [Env] 환경 변수 검증 실패:',
    JSON.stringify(errorDetails, null, 2),
    '\n.env.example 파일을 확인해주세요.',
  ].join('\n');

  if (import.meta.env.DEV) {
    logger.warn('Env', errorMessage);
  } else {
    console.warn(errorMessage);
  }
}

// 검증 결과 (실패 시에도 default 값 적용된 데이터 사용)
const data = parsedEnv.success ? parsedEnv.data : envSchema.parse({});

/**
 * 프로젝트 전용 환경 변수 객체 (Type-Safe)
 */
export const ENV = {
  SUPABASE_URL: data.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: data.VITE_SUPABASE_ANON_KEY,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  DEBUG_URL: data.VITE_DEBUG_URL,
  IS_VERCEL: data.VITE_IS_VERCEL,
  ADMOB_APP_ID: data.VITE_ADMOB_APP_ID,
  ADMOB_REWARDED_ID: data.VITE_ADMOB_REWARDED_ID,
} as const;

export type EnvConfig = typeof ENV;

/**
 * 환경 변수 정보 출력 (개발 환경 전용)
 */
export function logEnvInfo(): void {
  if (!import.meta.env.DEV) return;

  logger.group('Env', '🚀 환경 변수 로드 완료', () => {
    logger.info('Env', `모드: ${import.meta.env.MODE}`);
    logger.info('Env', `Supabase URL: ${ENV.SUPABASE_URL ? '✅ 연결됨' : '⚠️ 미설정'}`);
    logger.info('Env', `Vercel Host: ${ENV.IS_VERCEL ? '✅ Yes' : 'No'}`);
  });
}
