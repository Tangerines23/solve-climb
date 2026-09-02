#!/usr/bin/env node
/**
 * @file watchdog-task-monitor.cjs
 * @description 콘솔 프로세스 및 백그라운드 작업 와치도그(Watchdog) 모니터.
 * 콘솔 출력이나 로그 갱신이 5분(300초) 이상 정체되면 프로세스를 강제 종료하고
 * 상태 확인(Check) 메시지를 출력하여 에이전트/사용자에게 즉시 알립니다.
 *
 * 사용법:
 *   node scripts/watchdog-task-monitor.cjs --cmd "<실행할 명령어>" [--timeout 300]
 *   node scripts/watchdog-task-monitor.cjs --log "<감시할 로그파일>" [--timeout 300]
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');

// 파라미터 파싱
const args = process.argv.slice(2);
let commandStr = '';
let logFilePath = '';
let timeoutSeconds = 300; // 기본 5분 (300초)
let checkIntervalMs = 5000; // 5초 주기 정밀 검사
let heartbeatIntervalMs = 60000; // 1분 주기 진행 상태 확인(Check) 출력

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cmd' && args[i + 1]) {
    commandStr = args[i + 1];
    i++;
  } else if (args[i] === '--log' && args[i + 1]) {
    logFilePath = args[i + 1];
    i++;
  } else if (args[i] === '--timeout' && args[i + 1]) {
    timeoutSeconds = parseInt(args[i + 1], 10) || 300;
    i++;
  }
}

if (!commandStr && !logFilePath) {
  console.log(`
🚨 [Watchdog Monitor] 사용법:
  node scripts/watchdog-task-monitor.cjs --cmd "<실행할 명령어>" [--timeout <초단위>]
  node scripts/watchdog-task-monitor.cjs --log "<감시할 로그파일 경로>" [--timeout <초단위>]

예시:
  node scripts/watchdog-task-monitor.cjs --cmd "npm run check:fast" --timeout 300
  node scripts/watchdog-task-monitor.cjs --cmd "git push origin main" --timeout 300
`);
  process.exit(1);
}

const timeoutMs = timeoutSeconds * 1000;
let lastActiveTime = Date.now();
let lastHeartbeatTime = Date.now();
let elapsedMinutes = 0;

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch (_) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (_) {}
  }
}

console.log(`🐕 [Watchdog 활성화] 타임아웃 한도: ${timeoutSeconds}초 (5분 무응답 시 자동 Kill 및 알림)`);

if (commandStr) {
  console.log(`▶️ [Watchdog 실행] "${commandStr}"`);

  const isWin = process.platform === 'win32';
  const child = spawn(commandStr, [], {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: !isWin,
  });

  child.stdout.on('data', (data) => {
    lastActiveTime = Date.now();
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    lastActiveTime = Date.now();
    process.stderr.write(data);
  });

  const timer = setInterval(() => {
    const now = Date.now();
    const elapsedSinceLastOutput = now - lastActiveTime;

    // 1분 주기 진행 상태 확인 (Heartbeat Check)
    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      elapsedMinutes += 1;
      lastHeartbeatTime = now;
      console.log(`\n⏳ [Watchdog Check] ${elapsedMinutes}분 경과 — 프로세스(PID: ${child.pid}) 실행 상태 정상 감시 중...`);
    }

    // 5분 타임아웃 감지
    if (elapsedSinceLastOutput >= timeoutMs) {
      console.error(`\n🚨 [Watchdog Timeout] 지난 ${timeoutSeconds}초(5분) 동안 새로운 출력이 없어 작업이 정체(Hang)된 것으로 감지되었습니다.`);
      console.error(`🛑 [상태 확인 및 조치] 정체된 프로세스(PID: ${child.pid})를 강제 종료합니다.`);
      clearInterval(timer);
      killProcessTree(child.pid);
      process.exit(124); // 타임아웃 표준 종료 코드
    }
  }, checkIntervalMs);

  child.on('close', (code) => {
    clearInterval(timer);
    if (code === 0) {
      console.log(`\n✅ [Watchdog] 작업 정상 완료 (코드 0)`);
    } else {
      console.log(`\n⚠️ [Watchdog] 작업 종료 (종료 코드: ${code})`);
    }
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    clearInterval(timer);
    console.error(`❌ [Watchdog 에러]`, err);
    process.exit(1);
  });
} else if (logFilePath) {
  console.log(`👁️ [Watchdog 로그 감시] "${logFilePath}"`);

  let lastSize = 0;
  try {
    if (fs.existsSync(logFilePath)) {
      lastSize = fs.statSync(logFilePath).size;
    }
  } catch (_) {}

  const timer = setInterval(() => {
    const now = Date.now();
    try {
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size !== lastSize) {
          lastSize = stats.size;
          lastActiveTime = stats.mtimeMs || now;
        }
      }
    } catch (_) {}

    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      elapsedMinutes += 1;
      lastHeartbeatTime = now;
      console.log(`\n⏳ [Watchdog Check] ${elapsedMinutes}분 경과 — 로그 파일 감시 중...`);
    }

    const elapsed = now - lastActiveTime;
    if (elapsed >= timeoutMs) {
      console.error(`\n🚨 [Watchdog Timeout] 지난 ${timeoutSeconds}초(5분) 동안 로그 갱신이 없습니다.`);
      clearInterval(timer);
      process.exit(124);
    }
  }, checkIntervalMs);
}
