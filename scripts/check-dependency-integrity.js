import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * [의존성 체크 스크립트]
 * package.json에 정의된 패키지가 node_modules에 실제로 존재하는지 확인합니다.
 * 누락된 경우 에러를 발생시켜 커밋을 중단하고 npm install을 유도합니다.
 */

function checkDependencies() {
  console.log('📦 의존성 무결성 확인 중...');

  try {
    const rootDir = process.cwd();
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // 필수 의존성 목록 결합
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const missing = [];

    for (const dep of Object.keys(deps)) {
      const depPath = path.join(rootDir, 'node_modules', dep);
      if (!fs.existsSync(depPath)) {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      console.error('\n❌ [Error] 누락된 패키지가 발견되었습니다:');
      missing.forEach((m) => console.error(`   - ${m}`));
      console.error(
        '\n💡 로컬 환경과 CI 환경의 불일치를 방지하기 위해 다음 명령어를 실행해주세요:'
      );
      console.error('👉 npm install\n');
      process.exit(1);
    }

    console.log('✅ 모든 패키지가 정상적으로 설치되어 있습니다.');
    process.exit(0);
  } catch (error) {
    console.error('❌ 의존성 체크 도중 오류 발생:', error.message);
    process.exit(1);
  }
}

checkDependencies();
