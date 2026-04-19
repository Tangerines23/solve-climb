/**
 * [ 지능형 서비스 헬스체크 스크립트 ]
 * Supabase 로컬 서비스(DB, API)가 완전히 가동될 때까지 폴링하며 대기합니다.
 * 고정된 sleep 대신 사용되어 CI 속도와 안정성을 동시에 확보합니다.
 */

import http from 'http';
import { execSync } from 'child_process';

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;
const SUPABASE_API_URL = process.env.SUPABASE_API_URL || 'http://localhost:54321/rest/v1/';
const DOCKER_HOST =
  process.env.IS_DOCKER && !process.env.CI && !process.env.GITHUB_ACTIONS
    ? 'host.docker.internal'
    : 'localhost';

async function checkSupabaseHealth() {
  const url = SUPABASE_API_URL.replace('localhost', DOCKER_HOST);
  return new Promise((resolve) => {
    http
      .get(url, (res) => {
        // API가 응답하면 (인증 에러 401이어도 서비스는 살아있는 것)
        if (res.statusCode === 200 || res.statusCode === 401) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .on('error', () => {
        resolve(false);
      });
  });
}

function checkDockerStatus() {
  try {
    // 1. Try global supabase command first (faster)
    // 2. Fallback to npx supabase
    let output;
    try {
      output = execSync('supabase status --json', {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
    } catch {
      output = execSync('npx supabase status --json', {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
    }

    const status = JSON.parse(output);
    // Ensure essential URLs are present
    return status.DB_URL && status.API_URL && status.REST_URL;
  } catch (_e) {
    return false;
  }
}

async function wait() {
  console.log('🚀 Supabase 서비스 가용성 확인 시작...');
  console.log(`🔗 Target Host: ${DOCKER_HOST}`);

  for (let i = 1; i <= MAX_RETRIES; i++) {
    process.stdout.write(`⏳ 체크 중... (${i}/${MAX_RETRIES})\r`);

    const isDockerUp = checkDockerStatus();
    const isApiResponsive = await checkSupabaseHealth();

    if (isDockerUp && isApiResponsive) {
      console.log('\n✅ Supabase 모든 서비스가 정상적으로 가동되었습니다!');
      process.exit(0);
    }

    await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
  }

  console.error('\n❌ Supabase 서비스 가동 대기 시간이 초과되었습니다.');
  process.exit(1);
}

wait();
