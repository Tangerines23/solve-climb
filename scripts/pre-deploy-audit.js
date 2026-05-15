#!/usr/bin/env node
/**
 * 배포 전 빌드 결과물(dist)의 무결성을 검증하는 감사 스크립트입니다.
 * - 민감한 파일(.env 등) 포함 여부 확인
 * - 소스 코드 내 디버그용 문자열(TODO, DEBUG) 검색
 * - 서비스 롤 키 등 보안 정보 유출 방지
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

const FORBIDDEN_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'supabase.key',
  'service-role.json',
];

const FORBIDDEN_STRINGS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'TODO:',
  'FIXME:',
  'DEBUG_MODE',
  'console.log', // 프로덕션에서는 console.log가 지워지는 것이 좋음 (선택사항)
];

function getAllFiles(dir, allFiles = []) {
  if (!existsSync(dir)) return allFiles;
  const files = readdirSync(dir);
  files.forEach((file) => {
    const name = join(dir, file);
    if (statSync(name).isDirectory()) {
      getAllFiles(name, allFiles);
    } else {
      allFiles.push(name);
    }
  });
  return allFiles;
}

async function runAudit() {
  console.log(`\n🛡️  ${colors.green}Starting Pre-deploy Audit...${colors.reset}`);
  console.log(`📂 Target: ${colors.dim}${DIST}${colors.reset}\n`);

  if (!existsSync(DIST)) {
    console.error(
      `${colors.red}❌ Error: dist directory not found. Run 'npm run build' first.${colors.reset}`
    );
    process.exit(1);
  }

  let issues = 0;
  const allFiles = getAllFiles(DIST);

  // 1. 금지된 파일 체크
  console.log('🔍 Checking for forbidden files...');
  allFiles.forEach((file) => {
    const base = file.replace(DIST, '');
    if (FORBIDDEN_FILES.some((f) => base.includes(f))) {
      console.error(`${colors.red}❗ FORBIDDEN FILE FOUND: ${base}${colors.reset}`);
      issues++;
    }
  });

  // 2. 파일 내용 체크 (JS, CSS, HTML)
  console.log('🔍 Scanning file contents for sensitive strings...');
  const targetExts = ['.js', '.css', '.html', '.map'];

  allFiles.forEach((file) => {
    if (!targetExts.includes(extname(file))) return;

    const content = readFileSync(file, 'utf8');
    const relativePath = file.replace(DIST, '');

    FORBIDDEN_STRINGS.forEach((str) => {
      if (content.includes(str)) {
        // console.log는 경고 정도로 처리 (Vite가 자동으로 지울 수도 있음)
        if (str === 'console.log') {
          console.warn(
            `${colors.yellow}⚠️  Potential debug string '${str}' in ${relativePath}${colors.reset}`
          );
        } else {
          console.error(
            `${colors.red}❗ SENSITIVE STRING '${str}' FOUND IN: ${relativePath}${colors.reset}`
          );
          issues++;
        }
      }
    });
  });

  // 3. 소스 맵 정책 체크
  const maps = allFiles.filter((f) => f.endsWith('.map'));
  if (maps.length > 0) {
    console.log(
      `${colors.yellow}ℹ️  Found ${maps.length} source map files. Ensure this is intentional for production.${colors.reset}`
    );
  }

  console.log('\n' + '='.repeat(50));
  if (issues === 0) {
    console.log(
      `${colors.green}✅ Audit passed! No critical security issues found in build output.${colors.reset}`
    );
    process.exit(0);
  } else {
    console.error(
      `${colors.red}❌ Audit failed! Found ${issues} critical security issue(s).${colors.reset}`
    );
    console.error(`${colors.red}Please fix these issues before deploying.${colors.reset}`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
