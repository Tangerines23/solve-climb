#!/usr/bin/env node
/**
 * Supabase 연결 검증 스크립트
 * .env(로컬) 또는 CI Secrets에 있는 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY로
 * 실제 Supabase에 요청을 보내 연결·키 유효성을 확인합니다.
 *
 * 사용: npm run check:supabase:connection
 * - 로컬: .env를 읽어 사용 (없으면 에러)
 * - CI: 환경 변수(VITE_SUPABASE_*)가 이미 설정된 상태에서 실행
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

let supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Docker 내부에서 실행 중일 경우 localhost를 host.docker.internal로 전환 (로컬 시뮬레이션용)
// GitHub Actions 등 CI 환경에서는 기본적으로 localhost를 유지
if (process.env.IS_DOCKER && !process.env.GITHUB_ACTIONS && supabaseUrl?.includes('localhost')) {
  supabaseUrl = supabaseUrl.replace('localhost', 'host.docker.internal');
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 자격 증명이 없습니다.');
  console.error('   필요: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('   로컬: .env에 설정 후 다시 실행하세요.');
  console.error('   CI: Repository Secrets에 동일한 이름으로 설정하세요.');
  process.exit(1);
}

async function checkConnection() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 최소한의 요청으로 URL·키 유효성 확인 (profiles 한 건 조회 시도)
  const { data, error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
      console.error('❌ 연결 실패: Anon Key가 유효하지 않거나 만료되었습니다.');
      console.error('   Supabase 대시보드 → Settings → API에서 anon key를 확인하세요.');
    } else if (error.code === 'PGRST116' || error.message?.includes('relation')) {
      // 테이블 없음은 DB 설정 문제이지만, URL/키는 통과한 것
      console.log('✅ URL·키 연결 성공 (profiles 테이블 없음 — 마이그레이션 필요할 수 있음)');
      return 0;
    } else {
      console.error('❌ 연결 실패:', error.message || error.code);
    }
    process.exit(1);
  }

  console.log('✅ Supabase 연결 성공');
  console.log('   URL:', supabaseUrl.replace(/\/$/, ''));
  console.log('   Anon Key: 설정됨 (유효)');
  if (Array.isArray(data) && data.length > 0) {
    console.log('   profiles 샘플: 1건 조회됨');
  }
  return 0;
}

checkConnection().then((code) => process.exit(code));
