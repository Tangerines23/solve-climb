import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 검색할 디렉토리 목록
const SEARCH_DIRS = [
  path.resolve(__dirname, '../src'),
  path.resolve(__dirname, '../scripts'),
  path.resolve(__dirname, '..'), // Root (for config files)
];

// ROOT_IGNORE is defined later with more exclusions

// 위험한 패턴 정의 (실제 키 값 탐지 위주)
const SECRET_PATTERNS = [
  {
    name: 'Supabase Service Role Key',
    regex: /service_role_key['"]?\s*[:=]\s*['"]eyJh[a-zA-Z0-9-_]{50,}/i,
  },
  { name: 'Supabase Admin Key', regex: /sbp_[a-zA-Z0-9]{20,}/ },
  { name: 'Stripe/Payment Secret', regex: /sk_live_[a-zA-Z0-9]{20,}/ },
  {
    name: 'Hardcoded JWT',
    regex: /['"]eyJh[a-zA-Z0-9-_]{20,}\.[a-zA-Z0-9-_]{20,}\.[a-zA-Z0-9-_]{20,}['"]/,
  },
  { name: 'Private Key Block', regex: /-----BEGIN PRIVATE KEY-----/ },
];

// 예외 파일 및 폴더
const IGNORE_FILES = [
  'vite-env.d.ts',
  '.test.ts',
  'check-secrets.js',
  '.env',
  '.env.example',
  '.env.local',
  '.env.test',
];

const ROOT_IGNORE = ['node_modules', 'dist', '.git', '.cache', 'reports', 'android', 'ios'];

let hasError = false;

function scanDirectory(dir) {
  if (ROOT_IGNORE.some((ignored) => dir.endsWith(ignored))) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      if (!file.match(/\.(ts|tsx|js|jsx|env|ps1|sh)$/)) continue;
      if (IGNORE_FILES.some((f) => file.endsWith(f))) continue;

      const content = fs.readFileSync(fullPath, 'utf8');

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(
            `❌ [Security Alert] Potential ${pattern.name} found in: ${path.relative(process.cwd(), fullPath)}`
          );
          hasError = true;
        }
      }
    }
  }
}

console.log('🕵️  [Security Shield] Scanning for hardcoded secrets...');
SEARCH_DIRS.forEach((dir) => scanDirectory(dir));

if (hasError) {
  console.error('\n🚫 검사 실패! 소스 코드에 비밀키가 포함되어 있을 수 있습니다.');
  console.error('환경 변수(.env)로 이동하고 코드를 수정해주세요.');
  process.exit(1);
} else {
  console.log('✅ 검사 통과: 발견된 비밀키가 없습니다.');
}
