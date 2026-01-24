import { z } from 'zod';

/**
 * 환경 변수 스키마 정의
 */
const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().url('Supabase URL이 유효하지 않습니다.'),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase 키가 필요합니다.'),
    DEV: z.boolean().default(false),
    MODE: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * 환경 변수 검증 및 안전한 객체 반환
 */
export const getEnv = () => {
    try {
        const rawEnv = {
            VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
            DEV: import.meta.env.DEV,
            MODE: import.meta.env.MODE,
        };

        return envSchema.parse(rawEnv);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues
                .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
                .join('\n');
            console.error(`[Environment Error] 환경 변수 설정이 잘못되었습니다:\n${issues}`);
        }
        throw new Error('환경 변수 검증 실패');
    }
};

// 싱글톤 인스턴스
export const env = getEnv();
