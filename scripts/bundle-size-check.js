/**
 * Bundle Size Guardian
 * 메인 번들 크기가 임계치를 초과하는지 체크합니다.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MAX_BUNDLE_SIZE_KB = 400; // 400KB 제한
const DIST_DIR = path.resolve('dist/assets');

console.log('🚀 Checking bundle size...');

try {
    // 빌드 수행 (빌드가 안 되어 있을 경우 대비)
    if (!fs.existsSync(DIST_DIR)) {
        console.log('📦 Dist not found. Running build...');
        execSync('npm run build', { stdio: 'inherit' });
    }

    const files = fs.readdirSync(DIST_DIR);
    const mainJsFile = files.find(f => f.endsWith('.js') && !f.includes('vendor'));

    if (!mainJsFile) {
        console.error('❌ Main JS file not found!');
        process.exit(1);
    }

    const stats = fs.statSync(path.join(DIST_DIR, mainJsFile));
    const fileSizeKb = stats.size / 1024;

    console.log(`📊 Main Bundle Size: ${fileSizeKb.toFixed(2)} KB`);

    if (fileSizeKb > MAX_BUNDLE_SIZE_KB) {
        console.error(`❌ Bundle size exceeded limit (${MAX_BUNDLE_SIZE_KB} KB)`);
        process.exit(1);
    }

    console.log('✅ Bundle size is within limits.');
} catch (error) {
    console.error('❌ Bundle size check failed:', error);
    process.exit(1);
}
