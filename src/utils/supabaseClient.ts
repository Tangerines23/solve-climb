import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, logEnvInfo } from './env';

// 개발 환경에서 환경 변수 정보 출력
logEnvInfo();

// 환경 변수 검증은 env.ts에서 자동으로 수행됨
// 환경 변수가 없을 때는 더미 클라이언트를 생성 (심사 환경 대응)
const createSupabaseClient = (): SupabaseClient => {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    // 환경 변수가 없으면 더미 URL과 키로 클라이언트 생성
    // 실제 API 호출은 실패하지만 앱은 크래시하지 않음
    return createClient('https://dummy.supabase.co', 'dummy-key');
  }
  
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
};

export const supabase = createSupabaseClient();
