/**
 * 번들 사이즈 감사 스크립트 (Bundle Size Guardian)
 * 빌드 결과물의 상세 용량을 체크하고 자산별 리포트를 출력합니다.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BUNDLE_LIMIT_MB = 1.5; // 핵심 자산 제한 (WebView 최적화를 위해 1.5MB로 하향 조정)
const DIST_DIR = path.resolve(process.cwd(), 'dist');

function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getAssetsReport(dirPath, report = { js: 0, css: 0, assets: 0, total: 0 }) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      if (file.includes('debug-')) continue;
      report.total += stats.size;
      if (file.endsWith('.js')) {
        // ⚠️ 디버그 패널 관련 파일은 번들 사이즈 계산에서 제외 (사용자 다운로드 X)
        if (file.includes('debug-')) continue;
        report.js += stats.size;
      } else if (file.endsWith('.css')) {
        if (file.includes('debug-')) continue;
        report.css += stats.size;
      } else {
        report.assets += stats.size;
      }
    } else if (stats.isDirectory()) {
      getAssetsReport(filePath, report);
    }
  }
  return report;
}

console.log('🛡️  [Bundle Size Guardian] 분석 시작...');

if (!fs.existsSync(DIST_DIR)) {
  console.log('⚠️ dist 폴더가 없습니다. 빌드를 수행합니다...');
  execSync('npm run build', { stdio: 'inherit' });
}

try {
  const report = getAssetsReport(DIST_DIR);

  console.log('\n-----------------------------------');
  console.log(`📦 전체 빌드 사이즈: ${formatBytes(report.total)}`);
  console.log(`  - JavaScript: ${formatBytes(report.js)}`);
  console.log(`  - CSS: ${formatBytes(report.css)}`);
  console.log(`  - 기타 자산: ${formatBytes(report.assets)}`);
  console.log(`🚩 제한 임계값: ${BUNDLE_LIMIT_MB} MB`);
  console.log('-----------------------------------\n');

  if (report.total / (1024 * 1024) > BUNDLE_LIMIT_MB) {
    console.error('❌ 실패: 번들 사이즈가 임계값을 초과했습니다!');
    console.error(`👉 초과량: ${(report.total / (1024 * 1024) - BUNDLE_LIMIT_MB).toFixed(2)} MB`);
    console.error('💡 조치 방법:');
    console.error('  1. 불필요한 라이브러리 제거 (npm run diet)');
    console.error('  2. 대형 Asset 최적화');
    console.error('  3. Dynamic Import 도입을 통한 코드 스플리팅');
    process.exit(1);
  } else {
    console.log('✅ 통과: 번들 사이즈가 매우 안정적입니다.');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ 측정 중 시스템 오류 발생:', error);
  process.exit(1);
}
