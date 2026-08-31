/**
 * fast-pre-commit.js
 * 병렬 멀티코어 정적 검증 러너 (커밋 소요 시간을 2분 -> 5~10초로 단축)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTask(name, command, isOptional = false) {
  const startTime = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [${name}] 완료 (${duration}s)`);
    return { success: true, name, stdout, stderr };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    if (isOptional) {
      console.warn(`⚠️ [${name}] 경고 (${duration}s): ${error.message?.split('\n')[0]}`);
      return { success: true, name, isWarning: true };
    }
    console.error(`❌ [${name}] 실패 (${duration}s)`);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return { success: false, name, error };
  }
}

async function main() {
  console.log('⚡ 초고속 병렬 프리커밋 검증 시작...');
  const overallStart = Date.now();

  // Phase 1: 가벼운 사전 검사 & Staged 린트
  console.log('\n--- [Phase 1] 의존성 및 빠른 정밀 검사 (병렬 실행) ---');
  const phase1Tasks = [
    runTask('의존성 무결성', 'node scripts/check-dependency-integrity.js'),
    runTask('타입스크립트 타입 체크', 'npx tsc --noEmit'),
    runTask('순환 참조 검사', 'npm run check:circular'),
    runTask('보안 키(Secrets) 검사', 'npm run check:secrets'),
    runTask('코드 맵 무결성 검사', 'npm run check:code-map'),
    runTask('미사용 코드(Knip) 검사', 'npm run diet'),
    runTask('코드 무결성/매직스트링 검사', 'npm run check:integrity'),
    runTask('자산(Assets) 무결성 검사', 'npm run check:assets'),
  ];

  const phase1Results = await Promise.all(phase1Tasks);
  const failedPhase1 = phase1Results.filter((r) => !r.success);

  if (failedPhase1.length > 0) {
    console.error('\n❌ Phase 1 정적 검증에서 실패한 항목이 있습니다:');
    failedPhase1.forEach((f) => console.error(`  - ${f.name}`));
    process.exit(1);
  }

  // Phase 2: 핵심 불변식 및 퀴즈 생성기 Fuzzing 검증 (0.4초 소요)
  console.log('\n--- [Phase 2] 핵심 도메인 불변식 & 퍼징 무결성 검증 ---');
  const testResult = await runTask(
    '도메인 불변식/퍼징 테스트',
    'npx vitest run src/features/quiz/generators/__tests__/generatorsFuzzing.test.ts src/stores/__tests__/crossStoreInvariants.test.ts'
  );

  if (!testResult.success) {
    console.error('\n❌ 핵심 도메인 불변식 검증에 실패했습니다.');
    process.exit(1);
  }

  const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(1);
  console.log(`\n🎉 모든 사전 검증 통과! (총 소요 시간: ${totalDuration}s)\n`);
}

main().catch((err) => {
  console.error('Unexpected error in fast-pre-commit:', err);
  process.exit(1);
});
