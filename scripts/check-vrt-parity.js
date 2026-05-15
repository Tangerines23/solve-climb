import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🛡️ VRT Parity Checker
 *
 * 이 스크립트는 생성된 VRT 스크린샷의 해상도와 플랫폼 일관성을 검증합니다.
 * 특히 윈도우와 리눅스 환경에서 모두 모바일 해상도(375x812)가 유지되는지 확인합니다.
 */

const SNAPSHOT_DIR = path.join(
  __dirname,
  '../tests/e2e/snapshots/visual-regression.spec.ts-snapshots'
);
const EXPECTED_WIDTH = 375;
const EXPECTED_HEIGHT = 812;

async function checkSnapshots() {
  console.log('\n🔍 [VRT Parity Checker] Starting validation...');

  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.error(`❌ Snapshot directory not found: ${SNAPSHOT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.png'));

  if (files.length === 0) {
    console.warn('⚠️ No snapshots found to validate.');
    return;
  }

  console.log(`📂 Found ${files.length} snapshots in ${SNAPSHOT_DIR}`);

  let hasError = false;

  for (const file of files) {
    const filePath = path.join(SNAPSHOT_DIR, file);
    // Note: We use a simple way to check dimensions without heavy dependencies if possible,
    // but since we have 'sharp' in package.json, let's use it.
    try {
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(filePath).metadata();

      const isMobile = metadata.width === EXPECTED_WIDTH && metadata.height === EXPECTED_HEIGHT;

      if (isMobile) {
        console.log(`✅ ${file}: Passed (${metadata.width}x${metadata.height})`);
      } else {
        console.error(
          `❌ ${file}: Failed! Expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, got ${metadata.width}x${metadata.height}`
        );
        hasError = true;
      }
    } catch (err) {
      console.error(`❌ ${file}: Error reading metadata - ${err.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\n🚨 VRT Parity check failed. Some snapshots are not in mobile resolution.');
    process.exit(1);
  } else {
    console.log('\n✨ All snapshots validated successfully for mobile parity (375x812).');
    process.exit(0);
  }
}

checkSnapshots();
