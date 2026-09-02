#!/usr/bin/env node
/**
 * @file watchdog-task-monitor.cjs
 * @description 와치도그(Watchdog) 콘솔 프로세스 및 로그 감시 스크립트.
 * 지정된 시간(기본 5분 / 300초) 동안 콘솔 출력이나 로그 갱신이 없으면
 * 프로세스를 안전하게 강제 종료(Kill)하고 타임아웃 경고를 출력합니다.
 *
 * 사용법:
 *   node scripts/watchdog-task-monitor.cjs --cmd "npm run test:all" --timeout 300
 *   node scripts/watchdog-task-monitor.cjs --log "path/to/logfile.log" --timeout 300
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 파라미터 파싱
const args = process.argv.slice(2);
let commandStr = '';
let logFilePath = '';
let timeoutSeconds = 300; // 기본 5분 (300초)
let checkIntervalMs = 5000; // 5초 주기 검사

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
  node scripts/watchdog-task-monitor.cjs --cmd "git push origin main" --timeout 180
`);
  process.exit(1);
}

const timeoutMs = timeoutSeconds * 1000;
let lastActiveTime = Date.now();

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch (e) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (_) {}
  }
}

console.log(`🐕 [Watchdog] 활성화됨: 타임아웃 = ${timeoutSeconds}초 (5분 무응답 시 자동 중단)`);

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
    const elapsedSinceLastOutput = Date.now() - lastActiveTime;
    
    if (elapsedSinceLastOutput >= timeoutMs) {
      console.error(`\n🚨 [Watchdog Timeout] 지난 ${timeoutSeconds}초 동안 콘솔 출력이 없어 명령어가 정체(Hang)된 것으로 감지되었습니다.`);
      console.error(`🛑 프로세스(PID: ${child.pid})를 강제 종료합니다.`);
      clearInterval(timer);
      killProcessTree(child.pid);
      process.exit(124); // 124: standard timeout exit code
    }
  }, checkIntervalMs);

  child.on('close', (code) => {
    clearInterval(timer);
    const totalSec = Math.round((Date.now() - lastActiveTime) / 1000);
    if (code === 0) {
      console.log(`\n✅ [Watchdog] 정상 종료 완료 (코드 0)`);
    } else {
      console.log(`\n⚠️ [Watchdog] 프로세스 종료 (종료 코드: ${code})`);
    }
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    clearInterval(timer);
    console.error(`❌ [Watchdog] 프로세스 에러 발생:`, err);
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
    try {
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size !== lastSize) {
          lastSize = stats.size;
          lastActiveTime = stats.mtimeMs || Date.now();
        }
      }
    } catch (_) {}

    const elapsed = Date.now() - lastActiveTime;
    if (elapsed >= timeoutMs) {
      console.error(`\n🚨 [Watchdog Timeout] 로그 파일이 ${timeoutSeconds}초 동안 갱신되지 않았습니다.`);
      clearInterval(timer);
      process.exit(124);
    }
  }, checkIntervalMs);
}
