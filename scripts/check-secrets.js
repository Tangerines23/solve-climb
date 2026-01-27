import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 검색할 디렉토리 (src 전체)
const SEARCH_DIR = path.resolve(__dirname, '../src');

// 위험한 패턴 정의
const SECRET_PATTERNS = [
  { name: 'Supabase Service Role', regex: /service_role/i },
  { name: 'Supabase Admin Key', regex: /sbp_/ },
  { name: 'Stripe/Payment Secret', regex: /sk_live_/ },
  { name: 'Possible JWT (Hardcoded)', regex: /eyJh[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/ },
  { name: 'Private Key Block', regex: /-----BEGIN PRIVATE KEY-----/ },
];

// 예외 파일 (안전하다고 판단된 파일)
const IGNORE_FILES = [
  'vite-env.d.ts',
  '.test.ts',
  'check-secrets.js', // 자기 자신
];

let hasError = false;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;
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
scanDirectory(SEARCH_DIR);

if (hasError) {
  console.error('\n🚫 검사 실패! 소스 코드에 비밀키가 포함되어 있을 수 있습니다.');
  console.error('환경 변수(.env)로 이동하고 코드를 수정해주세요.');
  process.exit(1);
} else {
  console.log('✅ 검사 통과: 발견된 비밀키가 없습니다.');
}
