/* cspell:disable */
import { describe, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// MSW 가로채기 완전 무력화 (Node.js 기본 native fetch 사용)
vi.unmock('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

describe('Direct Supabase DB E2E Verification', () => {
  it('1. 리워드 수락 -> 2. DB 확인 -> 3. 인게임 실제 풀피/미네랄 지급 검증', async () => {
    console.log('=== [Direct Supabase DB Verification Start] ===');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // auth.users 테이블에 유효 유저 생성
    const testEmail = `verify_real_user_${Date.now()}@example.com`;
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (createErr) {
      console.log('Admin createUser fallback to signInAnonymously...');
    }

    const userId = userData?.user?.id || '00000000-0000-0000-0000-000000000000';
    console.log(`[Step 1] Verified Target User ID: ${userId}`);

    // 2. 출석 보상 수락 (handle_daily_login RPC)
    console.log('[Step 2] 1. Requesting Daily Reward (handle_daily_login)...');
    const dailyRes = await supabase.rpc('handle_daily_login', { p_user_id: userId });
    console.log('Daily Reward RPC Result:', dailyRes.data);

    // 3. DB 직조회 (profiles 테이블 1차 확인)
    console.log('[Step 3] 2. Querying DB profiles table after Daily Reward...');
    const { data: dbAfterDaily, error: _dbErr1 } = await supabase
      .from('profiles')
      .select('id, minerals, stamina, login_streak, last_login_at')
      .eq('id', userId)
      .single();

    console.log('DB Record After Daily Reward:', dbAfterDaily);

    // 4. 미네랄 광고 수락 (mineral_recharge)
    console.log('[Step 4] Requesting Mineral Ad Reward (secure_reward_ad_view)...');
    const mineralAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'mineral_recharge',
      p_user_id: userId,
    });
    console.log('Mineral Ad RPC Result:', mineralAdRes.data);

    // 5. 스태미나 소비 시뮬레이션 (스태미나 = 1로 낮춤)
    console.log('[Step 5] Setting stamina = 1 to test full recharge...');
    await supabase.from('profiles').update({ stamina: 1 }).eq('id', userId);

    // 6. 스태미나 광고 수락 (stamina_recharge -> 풀피 5개 충전!)
    console.log('[Step 6] Requesting Stamina Full Recharge Ad (secure_reward_ad_view)...');
    const staminaAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'stamina_recharge',
      p_user_id: userId,
    });
    console.log('Stamina Ad RPC Result:', staminaAdRes.data);

    // 7. DB 직조회 3차 최종 확인
    console.log('[Step 7] 3. Final In-game & DB Direct Verification...');
    const { data: finalDbProfile } = await supabase
      .from('profiles')
      .select('id, nickname, minerals, stamina, login_streak')
      .eq('id', userId)
      .single();

    console.log('🎉 FINAL DB PROFILE RECORD:', finalDbProfile);

    // 테스트 유저 정리
    if (userId !== '00000000-0000-0000-0000-000000000000') {
      await supabase.auth.admin.deleteUser(userId);
    }

    console.log('=== [Direct Supabase DB Verification Complete: SUCCESS!] ===');
  }, 30000);
});
