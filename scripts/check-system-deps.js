#!/usr/bin/env node
/**
 * 필수 시스템 의존성(binary) 유무 및 버전 확인 스크립트
 */

import { execSync } from 'child_process';

const DEPS = [
  { name: 'Node.js', command: 'node -v', required: true },
  { name: 'npm', command: 'npm -v', required: true },
  { name: 'git', command: 'git --version', required: true },
  {
    name: 'Docker',
    command: 'docker -v',
    required: false,
    hint: 'Linux CI 환경 검증(run-ci-linux)을 위해 필요합니다.',
  },
  {
    name: 'Supabase CLI',
    command: 'npx supabase -v',
    required: true,
    hint: 'DB 마이그레이션 및 린트 검증을 위해 필요합니다.',
  },
];

function check() {
  console.log('🔍 시스템 의존성 확인 중...\n');
  let hasError = false;

  for (const dep of DEPS) {
    try {
      const version = execSync(dep.command, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
      console.log(`✅ ${dep.name.padEnd(15)}: ${version}`);
    } catch (e) {
      if (dep.required) {
        console.log(`❌ ${dep.name.padEnd(15)}: 설치되지 않음 (필수)`);
        if (dep.hint) console.log(`   💡 힌트: ${dep.hint}`);
        hasError = true;
      } else {
        console.log(`⚠️  ${dep.name.padEnd(15)}: 설치되지 않음 (선택)`);
        if (dep.hint) console.log(`   💡 힌트: ${dep.hint}`);
      }
    }
  }

  console.log('');
  if (hasError) {
    console.error('🚫 필수 의존성이 누락되었습니다. 위 도구들을 설치한 후 다시 시도해주세요.');
    process.exit(1);
  }
}

check();
