import { createClient } from '@supabase/supabase-js';
import { ENV, logEnvInfo } from './env';

// 개발 환경에서 환경 변수 정보 출력
logEnvInfo();

// 환경 변수 검증은 env.ts에서 자동으로 수행됨
export const supabase = createClient(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY
);
