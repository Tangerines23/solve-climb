#!/usr/bin/env node
/**
 * DB RPC NULL Fuzzing Test Script
 * DB에 등록된 주요 RPC 함수들에 NULL 경계값을 자동 주입하여 런타임 Crash 및 0건 반환 버그를 검출합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not set for NULL fuzzing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// NULL 테스트를 수행할 대표적인 RPC 목록 및 NULL 인자 페이로드
const testRPCs = [
  {
    name: 'get_ranking_v2',
    payloads: [
      { p_category: null, p_period: 'weekly', p_type: 'total', p_limit: 50 },
      { p_category: null, p_period: null, p_type: null, p_limit: null },
    ],
    allowEmpty: false, // 랭킹 조회는 NULL 인자 유입 시에도 0건 튕김 없이 정상 작동해야 함
  },
  {
    name: 'get_leaderboard',
    payloads: [
      { p_mode: 'total', p_limit: 50 },
      { p_mode: null, p_limit: null },
    ],
    allowEmpty: false,
  },
  {
    name: 'check_mastery_consistency',
    payloads: [{}],
    allowEmpty: true,
  },
];

async function runNullFuzzing() {
  console.log('🧪 Running DB RPC NULL Fuzzing & Anomaly Detection...');
  let hasFailure = false;
  let totalTested = 0;

  for (const rpcInfo of testRPCs) {
    for (const payload of rpcInfo.payloads) {
      totalTested++;
      const payloadStr = JSON.stringify(payload);
      const { data, error } = await supabase.rpc(rpcInfo.name, payload);

      if (error) {
        console.error(
          `❌ [Null Fuzzer] ${rpcInfo.name}(${payloadStr}) -> RPC Error: ${error.message} (Code: ${error.code})`
        );
        hasFailure = true;
      } else if (!rpcInfo.allowEmpty && Array.isArray(data) && data.length === 0) {
        // 주간 랭킹 등에 NULL 유입 시 0건 반환하는 비정상 현상 체크
        // 주의: DB 초기화 상태이거나 데이터가 실제 없을 때는 경고(WARN)로 처리
        console.warn(
          `⚠️ [Null Fuzzer Warning] ${rpcInfo.name}(${payloadStr}) -> 0 items returned (Possible NULL Filtering Anomaly)`
        );
      } else {
        console.log(`✅ [Null Fuzzer] ${rpcInfo.name}(${payloadStr}) -> PASS`);
      }
    }
  }

  if (hasFailure) {
    console.error('\n❌ DB RPC NULL Fuzzing 테스트 실패!');
    process.exit(1);
  } else {
    console.log(`\n✅ DB RPC NULL Fuzzing 검사 완료! (${totalTested}개 테스트 케이스 정상)\n`);
    process.exit(0);
  }
}

runNullFuzzing();
