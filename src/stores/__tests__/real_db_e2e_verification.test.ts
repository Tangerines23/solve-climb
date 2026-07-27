/* cspell:disable */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('Real Supabase DB E2E Reward Verification', () => {
  it('1. 익명 로그인 -> 2. 출석 보상 수락 -> 3. DB 확인 -> 4. 인게임 확인 -> 5. 광고 보상 수락 -> 6. 풀피 및 리워드 검증', async () => {
    console.log('=== [Real DB E2E Verification Start] ===');
    console.log(`Supabase URL: ${SUPABASE_URL}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. 익명 회원가입/로그인
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    const userId = authData.user!.id;
    console.log(`[Step 1] Authenticated User ID: ${userId}`);

    // 2. 출석 보상 수락 (handle_daily_login RPC)
    console.log('[Step 2] Executing handle_daily_login RPC...');
    const dailyRes = await supabase.rpc('handle_daily_login');
    console.log('Daily RPC Result:', dailyRes.data);
    expect(dailyRes.error).toBeNull();
    expect(dailyRes.data.success).toBe(true);

    // 3. DB 직조회 (profiles 테이블 조회)
    console.log('[Step 3] Querying DB profiles table directly...');
    const { data: dbProfileAfterDaily, error: dbErr1 } = await supabase
      .from('profiles')
      .select('id, minerals, stamina, login_streak')
      .eq('id', userId)
      .single();

    expect(dbErr1).toBeNull();
    console.log('DB Profile Record After Daily:', dbProfileAfterDaily);
    expect(dbProfileAfterDaily.minerals).toBeGreaterThanOrEqual(100);

    // 4. 광고 미네랄 보상 수락 (secure_reward_ad_view - mineral_recharge)
    console.log('[Step 4] Requesting Mineral Ad Reward (secure_reward_ad_view)...');
    const mineralAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'mineral_recharge',
    });
    console.log('Mineral Ad RPC Result:', mineralAdRes.data);
    expect(mineralAdRes.error).toBeNull();
    expect(mineralAdRes.data.success).toBe(true);

    // 5. 광고 스태미나 풀피 회복 수락 (secure_reward_ad_view - stamina_recharge)
    console.log('[Step 5] Requesting Stamina Full Recharge Ad (secure_reward_ad_view)...');
    const staminaAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'stamina_recharge',
    });
    console.log('Stamina Ad RPC Result:', staminaAdRes.data);

    // 6. DB 직조회 (최종 DB 상태 확인)
    console.log('[Step 6] Direct DB Verification after Ads...');
    const { data: finalDbProfile, error: dbErr2 } = await supabase
      .from('profiles')
      .select('minerals, stamina')
      .eq('id', userId)
      .single();

    expect(dbErr2).toBeNull();
    console.log('Final DB Profile Record:', finalDbProfile);

    // 스태미나가 5개 풀피로 가득 찼는지 검증!
    expect(finalDbProfile.stamina).toBe(5);
    // 미네랄이 출석보상(100) + 광고보상(100) = 200 이상 들어왔는지 검증!
    expect(finalDbProfile.minerals).toBeGreaterThanOrEqual(200);

    console.log('=== [Real DB E2E Verification Complete: ALL PASS] ===');
  }, 30000);
});
