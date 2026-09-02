#!/usr/bin/env node
/**
 * @file watchdog-task-monitor.cjs
 * @description 콘솔 프로세스 및 백그라운드 작업 와치도그(Watchdog) 모니터.
 * 무응답 정체 시 프로세스를 종료하지 않고 안전하게 유지하며 5분 주기 AI/사용자 점검 알림을 발생시킵니다.
 *
 * 사용법:
 *   node scripts/watchdog-task-monitor.cjs --cmd "<실행할 명령어>" [--interval 300] [--auto-kill]
 *   node scripts/watchdog-task-monitor.cjs --log "<감시할 로그파일>" [--interval 300]
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');

// 파라미터 파싱
const args = process.argv.slice(2);
let commandStr = '';
let logFilePath = '';
let alertIntervalSec = 300; // 기본 5분 (300초) 주기 알림
let checkIntervalMs = 5000; // 5초 주기 정밀 검사
let heartbeatIntervalMs = 60000; // 1분 주기 진행 하트비트
let autoKill = false; // 기본값: 프로세스를 강제 종료하지 않고 AI 호출/알림만 수행

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--cmd' && args[i + 1]) {
    commandStr = args[i + 1];
    i++;
  } else if (args[i] === '--log' && args[i + 1]) {
    logFilePath = args[i + 1];
    i++;
  } else if (args[i] === '--interval' || args[i] === '--timeout') {
    alertIntervalSec = parseInt(args[i + 1], 10) || 300;
    i++;
  } else if (args[i] === '--auto-kill') {
    autoKill = true;
  }
}

if (!commandStr && !logFilePath) {
  console.log(`
🚨 [Watchdog Monitor] 사용법:
  node scripts/watchdog-task-monitor.cjs --cmd "<실행할 명령어>" [--interval <초단위>] [--auto-kill]
  node scripts/watchdog-task-monitor.cjs --log "<감시할 로그파일 경로>" [--interval <초단위>]

옵션:
  --interval <초>   무응답 경고 및 AI 호출 주기 (기본: 300초 / 5분)
  --auto-kill       5분 무응답 시 강제 종료 (기본값: false - 프로세스 유지 및 알림만 발생)

예시:
  node scripts/watchdog-task-monitor.cjs --cmd "npm run check:fast" --interval 300
  node scripts/watchdog-task-monitor.cjs --cmd "git push origin main" --interval 300
`);
  process.exit(1);
}

const alertIntervalMs = alertIntervalSec * 1000;
let lastActiveTime = Date.now();
let lastHeartbeatTime = Date.now();
let lastAlertTriggerTime = Date.now();
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
    } catch (_err) {
      // ignore
    }
  }
}

console.log(`🐕 [Watchdog 활성화] 5분 무응답 시 AI 호출/알림 모드 (Auto-Kill: ${autoKill ? 'ON' : 'OFF - 프로세스 보존'})`);

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
    lastAlertTriggerTime = Date.now();
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    lastActiveTime = Date.now();
    lastAlertTriggerTime = Date.now();
    process.stderr.write(data);
  });

  const timer = setInterval(() => {
    const now = Date.now();
    const elapsedSinceLastOutput = now - lastActiveTime;
    const elapsedSinceLastAlert = now - lastAlertTriggerTime;

    // 1분 주기 진행 상태 확인 (Heartbeat Check)
    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      elapsedMinutes += 1;
      lastHeartbeatTime = now;
      console.log(`\n⏳ [Watchdog Check] ${elapsedMinutes}분 경과 — 프로세스(PID: ${child.pid}) 실행 상태 정상 감시 중...`);
    }

    // 5분(alertIntervalSec) 이상 무응답 시 -> AI 및 사용자 호출 알림
    if (elapsedSinceLastOutput >= alertIntervalMs && elapsedSinceLastAlert >= alertIntervalMs) {
      lastAlertTriggerTime = now;
      const quietMinutes = Math.floor(elapsedSinceLastOutput / 60000);
      
      console.log(`\n🚨 [Watchdog Alert] 지난 ${quietMinutes}분 동안 새로운 콘솔 출력이 없습니다.`);
      console.log(`📌 [프로세스 상태] PID ${child.pid} 는 종료되지 않고 백그라운드에서 정상 실행 중입니다.`);
      console.log(`🔔 [AI 에이전트 & 사용자 점검 요청] 작업이 오래 걸리는 정상 동작인지, 인증 대기/정체인지 상태 확인이 필요합니다.`);

      if (autoKill) {
        console.error(`🛑 [--auto-kill 활성화됨] 프로세스(PID: ${child.pid})를 강제 종료합니다.`);
        clearInterval(timer);
        killProcessTree(child.pid);
        process.exit(124);
      }
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
  } catch (_) {
    // ignore
  }

  const timer = setInterval(() => {
    const now = Date.now();
    try {
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size !== lastSize) {
          lastSize = stats.size;
          lastActiveTime = stats.mtimeMs || now;
          lastAlertTriggerTime = now;
        }
      }
    } catch (_) {
      // ignore
    }

    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      elapsedMinutes += 1;
      lastHeartbeatTime = now;
      console.log(`\n⏳ [Watchdog Check] ${elapsedMinutes}분 경과 — 로그 파일 감시 중...`);
    }

    const elapsedSinceLastOutput = now - lastActiveTime;
    const elapsedSinceLastAlert = now - lastAlertTriggerTime;

    if (elapsedSinceLastOutput >= alertIntervalMs && elapsedSinceLastAlert >= alertIntervalMs) {
      lastAlertTriggerTime = now;
      const quietMinutes = Math.floor(elapsedSinceLastOutput / 60000);
      console.log(`\n🚨 [Watchdog Alert] 지난 ${quietMinutes}분 동안 로그 갱신이 없습니다. (감시 대상: ${logFilePath})`);
      console.log(`🔔 [AI 에이전트 & 사용자 점검 요청] 상태 확인이 필요합니다.`);
    }
  }, checkIntervalMs);
}
