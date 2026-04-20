const { execSync, spawn } = require('child_process');
const path = require('path');

/**
 * 로컬 Docker를 활용하여 Ubuntu Linux 환경에서 CI 검증을 자동 수행하는 스크립트
 */

const IMAGE_NAME = 'solve-climb-ci-env';
const WORKSPACE_DIR = '/workspaces/solve-climb';

// Check for --full argument
const isFullMode = process.argv.includes('--full');

async function run() {
  const modeText = isFullMode ? '[FULL 100% Mirror]' : '[STAGE 1 Fast-Guard]';
  console.log(`\n🐧 [Linux CI Guard] ${modeText} 리눅스 환경 검증을 시작합니다...`);

  // 1. Docker 실행 여부 확인
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (e) {
    console.error('\n⚠️  Docker가 실행 중이지 않습니다!');
    console.error('리눅스 환경 검증을 건너뛰고 로컬(Windows) 환경에서 기본 검사를 수행합니다.');
    console.log('------------------------------------------------------------');

    try {
      const script = isFullMode ? 'ci:local:all' : 'ci:local:stage1';
      execSync(`npm run ${script}`, { stdio: 'inherit' });
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  }

  // 2. CI용 도커 이미지 빌드 (없을 경우에만)
  console.log('📦 리눅스 검증 컨테이너 준비 중...');
  try {
    execSync(`docker build -t ${IMAGE_NAME} .devcontainer`, { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ 도커 빌드 실패');
    process.exit(1);
  }

  // 3. 컨테이너 내부에서 CI 실행
  console.log(`\n🚀 Ubuntu 컨테이너 내부에서 ${isFullMode ? '전체(100%)' : '핵심'} 검증을 실행합니다...`);

  const runCommand = isFullMode 
    ? 'npm install && bash scripts/ci-local-all.sh' 
    : 'npm install && npx playwright install chromium --with-deps && npm run ci:local:stage1';

  const dockerArgs = [
    'run',
    '--rm',
    '--network',
    'host',
    '-v',
    `${process.cwd()}:${WORKSPACE_DIR}`,
    '-w',
    WORKSPACE_DIR,
    '-v',
    `solve-climb-node-modules:${WORKSPACE_DIR}/node_modules`,
    '-v',
    'solve-climb-playwright-browsers:/ms-playwright',
    '-v',
    '/var/run/docker.sock:/var/run/docker.sock',
    '-e',
    'CI=true',
    '-e',
    'IS_DOCKER=true',
    '-e',
    'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
    // Pass essential environment variables if they exist
    ...[
      'VITE_SUPABASE_URL', 
      'VITE_SUPABASE_ANON_KEY', 
      'SUPABASE_DB_PASSWORD', 
      'SUPABASE_ACCESS_TOKEN'
    ].filter(key => process.env[key]).flatMap(key => ['-e', `${key}=${process.env[key]}`]),
    IMAGE_NAME,
    '/bin/bash',
    '-c',
    runCommand,
  ];

  const child = spawn('docker', dockerArgs, { stdio: 'inherit' });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ [Success] 리눅스 환경 (${isFullMode ? '100% Mirror' : 'Stage 1'}) 검증 통과!\n`);
      process.exit(0);
    } else {
      console.error('\n❌ [Failure] 리눅스 환경 검증 실패. 에러를 수정해 주세요.\n');
      process.exit(code);
    }
  });
}

run();
