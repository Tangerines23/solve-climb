/**
 * 번들 사이즈 감사 스크립트 (Bundle Size Audit)
 * 빌드 결과물(dist/)의 용량을 체크하여 설정된 임계값을 넘으면 프로세스를 종료합니다.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BUNDLE_LIMIT_MB = 2.5; // 최대 허용 용량 (2.5MB)
const DIST_DIR = path.resolve(process.cwd(), 'dist');

function getDirSize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      size += stats.size;
    } else if (stats.isDirectory()) {
      size += getDirSize(filePath);
    }
  }
  return size;
}

console.log('📦 번들 사이즈 감사 시작...');

if (!fs.existsSync(DIST_DIR)) {
  console.log('⚠️ dist 폴더가 없습니다. 빌드를 먼저 수행합니다...');
  execSync('npm run build', { stdio: 'inherit' });
}

try {
  const totalSizeBytes = getDirSize(DIST_DIR);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  console.log(`-----------------------------------`);
  console.log(`📊 현재 빌드 사이즈: ${totalSizeMB} MB`);
  console.log(`🚩 제한 임계값: ${BUNDLE_LIMIT_MB} MB`);
  console.log(`-----------------------------------`);

  if (totalSizeMB > BUNDLE_LIMIT_MB) {
    console.error(
      `❌ 실패: 번들 사이즈가 임계값을 초과했습니다! (${totalSizeMB}MB > ${BUNDLE_LIMIT_MB}MB)`
    );
    console.error(`💡 불필요한 라이브러리를 제거하거나 코드 스플리팅을 점검하세요.`);
    process.exit(1);
  } else {
    console.log(`✅ 통과: 번들 사이즈가 안정권입니다.`);
    process.exit(0);
  }
} catch (error) {
  console.error('❌ 번들 사이즈 측정 중 오류 발생:', error);
  process.exit(1);
}
