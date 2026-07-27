/* cspell:disable */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('==================================================');
console.log('  E2E REWARD & STAMINA FULL VERIFICATION SCRIPT   ');
console.log('==================================================');
console.log(`Endpoint: ${SUPABASE_URL}`);

async function rpcCall(functionName, bodyData = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(bodyData),
  });
  return await response.json();
}

async function queryTable(pathWithQuery) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  return await response.json();
}

async function updateTable(tableName, id, updateData) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(updateData),
  });
  return await response.json();
}

async function runNativeE2EVerification() {
  try {
    const testUserId = `00000000-0000-4000-a000-${Date.now().toString().slice(-12)}`;
    console.log(`\n[Step 1] Initializing Test User ID: ${testUserId}`);

    // 1. 출석 보상 수락 (handle_daily_login RPC)
    console.log('\n[Step 2] 1. Requesting Daily Reward (handle_daily_login)...');
    const dailyRes = await rpcCall('handle_daily_login', { p_user_id: testUserId });
    console.log('✅ Daily Reward RPC Response:', dailyRes);

    if (!dailyRes || !dailyRes.success) {
      console.error('❌ Daily Reward Failed:', dailyRes);
      process.exit(1);
    }

    // 2. DB 직조회 (profiles 테이블 조회)
    console.log('\n[Step 3] 2. Querying DB profiles table directly...');
    const profiles = await queryTable(`profiles?id=eq.${testUserId}&select=*`);
    console.log('✅ DB Profile Record After Daily Reward:', profiles[0]);

    if (!profiles || profiles.length === 0 || profiles[0].minerals < 100) {
      console.error('❌ DB Verification Failed: Minerals did not increase to 100+');
      process.exit(1);
    }

    // 3. 미네랄 광고 수락 (mineral_recharge)
    console.log('\n[Step 4] 3. Requesting Mineral Ad Reward (secure_reward_ad_view)...');
    const initialMinerals = profiles[0].minerals;
    const mineralAdRes = await rpcCall('secure_reward_ad_view', {
      p_ad_type: 'mineral_recharge',
      p_user_id: testUserId,
    });
    console.log('✅ Mineral Ad RPC Response:', mineralAdRes);

    if (!mineralAdRes || !mineralAdRes.success) {
      console.error('❌ Mineral Ad Reward Failed:', mineralAdRes);
      process.exit(1);
    }

    // 4. 스태미나 소비 시뮬레이션 (스태미나 = 1로 낮춤)
    console.log('\n[Step 5] Simulating Stamina Consumption (setting stamina = 1)...');
    await updateTable('profiles', testUserId, { stamina: 1 });

    const consumedProfiles = await queryTable(`profiles?id=eq.${testUserId}&select=stamina`);
    console.log(`Stamina before Ad: ${consumedProfiles[0]?.stamina}`);

    // 5. 스태미나 광고 수락 (stamina_recharge -> 풀피 5개 충전!)
    console.log('\n[Step 6] Requesting Stamina Recharge Ad (secure_reward_ad_view)...');
    const staminaAdRes = await rpcCall('secure_reward_ad_view', {
      p_ad_type: 'stamina_recharge',
      p_user_id: testUserId,
    });
    console.log('✅ Stamina Ad RPC Response:', staminaAdRes);

    if (!staminaAdRes || !staminaAdRes.success) {
      console.error('❌ Stamina Ad Reward Failed:', staminaAdRes);
      process.exit(1);
    }

    // 6. DB 직조회로 최종 리워드 및 풀피(5) 검증!
    console.log('\n[Step 7] Final DB Direct Verification...');
    const finalProfiles = await queryTable(`profiles?id=eq.${testUserId}&select=*`);
    const finalProfile = finalProfiles[0];

    console.log('\n==================================================');
    console.log('🎉 FINAL DB PROFILE RECORD VERIFIED SUCCESSFUL:');
    console.log(`   - User ID      : ${finalProfile.id}`);
    console.log(`   - Minerals     : ${finalProfile.minerals} (Increased from ${initialMinerals} to ${finalProfile.minerals})`);
    console.log(`   - Stamina      : ${finalProfile.stamina} / 5 FULL (Expected = 5)`);
    console.log(`   - Login Streak : ${finalProfile.login_streak} Day`);
    console.log('==================================================\n');

    if (finalProfile.stamina === 5 && finalProfile.minerals > initialMinerals) {
      console.log('✨ SUCCESS: 1. 리워드 수락 2. DB 확인 3. 실제 리워드/풀피 지급 검증 완료! ✨\n');
      process.exit(0);
    } else {
      console.error('❌ VERIFICATION FAILED: Stamina or Minerals not matching expected values.');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Unexpected Script Exception:', e);
    process.exit(1);
  }
}

runNativeE2EVerification();
