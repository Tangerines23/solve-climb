import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports', 'logs');

// 수집 대상에서 제외할 파일 (루트에 고정되어야 함)
const IGNORE_FILES = [
  '00todo.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'eslint.config.js',
  'README.md',
  '.env',
  '.gitignore',
  'LICENSE',
];

// 수집 대상 확장자
const TARGET_EXTS = ['.log', '.txt', '.xml', '.json'];

// 예외적인 JSON 파일 (필수 설정 등)
const IGNORE_JSON = [
  'deno.json',
  'deno.jsonc',
  '.e2e-result.json', // E2E 결과 파일은 별도 관리되기도 함
  'cspell.json',
  'components.json',
];

console.log('🔍 로그 수집 장치 가동 중...');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

try {
  const files = fs.readdirSync(ROOT);

  let movedCount = 0;
  files.forEach((file) => {
    const fullPath = path.join(ROOT, file);
    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
      const ext = path.extname(file).toLowerCase();

      // 1. 제외 파일 체크
      if (IGNORE_FILES.includes(file)) return;
      if (ext === '.json' && IGNORE_JSON.includes(file)) return;
      if (file.startsWith('.')) return; // 히든 파일 패스

      // 2. 확장자 체크
      const EXT_TARGETS = ['.log', '.txt', '.xml', '.json', '.sql'];
      if (EXT_TARGETS.includes(ext)) {
        // 특정 로그 패턴 체크 (파일명에 log, test, result, output, coverage, dump, schema 등이 포함되거나 확장자가 .log/ .txt 인 경우)
        const lowerFile = file.toLowerCase();
        const isLogPattern =
          ext === '.log' ||
          lowerFile.includes('log') ||
          lowerFile.includes('output') ||
          lowerFile.includes('test') ||
          lowerFile.includes('result') ||
          lowerFile.includes('coverage') ||
          lowerFile.includes('dump') ||
          lowerFile.includes('schema') ||
          lowerFile.includes('fix') ||
          lowerFile.includes('lint') ||
          lowerFile.includes('status') ||
          lowerFile.includes('job') ||
          lowerFile.includes('diff') ||
          file === '.txt'; // 루트의 이상한 .txt 파일 포함

        if (isLogPattern) {
          const targetPath = path.join(REPORT_DIR, file);

          // 이미 존재하면 덮어쓰기 위해 삭제
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }

          fs.renameSync(fullPath, targetPath);
          console.log(`✅ 이동 완료: ${file} -> reports/logs/`);
          movedCount++;
        }
      }
    }
  });

  if (movedCount === 0) {
    console.log('✅ 정리할 로그 파일이 없습니다. 루트가 깨끗합니다!');
  } else {
    console.log(`🎉 총 ${movedCount}개의 로그 파일을 reports/logs/로 분류했습니다.`);
  }
} catch (error) {
  console.error('❌ 로그 수집 중 오류 발생:', error.message);
  process.exit(1);
}
