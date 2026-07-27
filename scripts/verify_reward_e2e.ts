/* cspell:disable */
import { createClient } from '@supabase/supabase-js';
import { useUserStore } from '../src/stores/useUserStore';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('=== [E2E Reward Verification Script] Start ===');
console.log(`Target URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runE2EVerification() {
  try {
    // 0. 익명 사용자 세션 생성 / 로그인
    console.log('\n[Step 0] Auth Session Check & Anonymous SignIn...');
    let { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError || !authData.user) {
      console.log('Anonymously signin failed, fallback to test email login...');
      const email = `test_reward_${Date.now()}@example.com`;
      const signUpRes = await supabase.auth.signUp({
        email,
        password: 'password123!',
      });
      authData = signUpRes.data as any;
    }

    const userId = authData.user?.id;
    console.log(`✅ Auth Authenticated User ID: ${userId}`);

    if (!userId) {
      throw new Error('Failed to obtain valid auth user ID!');
    }

    // 1. 출석 보상 수락 (handle_daily_login RPC)
    console.log('\n[Step 1] Requesting Daily Reward (handle_daily_login)...');
    const dailyRpcRes = await supabase.rpc('handle_daily_login');
    console.log('RPC Response:', dailyRpcRes.data);

    if (dailyRpcRes.error) {
      console.error('❌ Daily Reward RPC Error:', dailyRpcRes.error);
    }

    // 2. DB 직조회 (Direct DB check)
    console.log('\n[Step 2] Querying profiles table directly from DB...');
    const { data: dbProfile, error: dbError } = await supabase
      .from('profiles')
      .select('id, minerals, stamina, login_streak, last_login_at')
      .eq('id', userId)
      .single();

    if (dbError) {
      console.error('❌ DB Query Error:', dbError);
    } else {
      console.log('✅ DB Profile Record:', dbProfile);
    }

    // 3. 인게임 스토어 실제 지급 확인 (In-game UserStore check)
    console.log('\n[Step 3] Syncing with UserStore (in-game state check)...');
    await useUserStore.getState().fetchUserData();
    const storeStateAfterDaily = useUserStore.getState();
    console.log(`✅ In-game Store Minerals: ${storeStateAfterDaily.minerals}`);
    console.log(`✅ In-game Store Stamina: ${storeStateAfterDaily.stamina}`);

    // 4. 광고 보상 수락 (secure_reward_ad_view - mineral_recharge & stamina_recharge)
    console.log('\n[Step 4] Requesting Ad Rewards (secure_reward_ad_view)...');

    // 미네랄 충전 광고
    const mineralAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'mineral_recharge',
    });
    console.log('Mineral Ad RPC Result:', mineralAdRes.data);

    // 스태미나 충전 광고 (스태미나 풀피 회복)
    const staminaAdRes = await supabase.rpc('secure_reward_ad_view', {
      p_ad_type: 'stamina_recharge',
    });
    console.log('Stamina Ad RPC Result:', staminaAdRes.data);

    // 5. DB 재조회 (Check DB after Ad Rewards)
    console.log('\n[Step 5] Direct DB Query after Ad Rewards...');
    const { data: dbProfileAfterAd } = await supabase
      .from('profiles')
      .select('minerals, stamina')
      .eq('id', userId)
      .single();
    console.log('✅ DB Profile Record After Ads:', dbProfileAfterAd);

    // 6. 인게임 최종 지급 확인
    console.log('\n[Step 6] Final In-game UserStore Check...');
    await useUserStore.getState().fetchUserData();
    const finalStoreState = useUserStore.getState();
    console.log(`🎉 Final In-game Minerals: ${finalStoreState.minerals}`);
    console.log(`🎉 Final In-game Stamina: ${finalStoreState.stamina}`);

    if (
      dbProfileAfterAd &&
      dbProfileAfterAd.minerals > 0 &&
      dbProfileAfterAd.stamina === 5 &&
      finalStoreState.stamina === 5
    ) {
      console.log('\n==================================================');
      console.log(' SUCCESS: All rewards successfully verified! ');
      console.log('==================================================\n');
    } else {
      console.error('\n❌ FAILURE: Reward verification failed!');
    }
  } catch (err) {
    console.error('❌ Unexpected Error during verification:', err);
  }
}

runE2EVerification();
