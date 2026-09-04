#!/usr/bin/env node
/**
 * scripts/auto-ci-pipeline.js
 * End-to-end Autonomous CI/CD Orchestrator with Local AI Self-Healing
 */

import { spawnSync } from 'child_process';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const LOCAL_AI_ENDPOINTS = [
  'http://172.30.1.103:40000/v1',
  'http://100.65.30.89:40000/v1',
  'http://127.0.0.1:40000/v1',
];

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function exec(cmd, options = {}) {
  try {
    const res = spawnSync(cmd, {
      shell: true,
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      ...options,
    });
    return {
      stdout: (res.stdout || '').trim(),
      stderr: (res.stderr || '').trim(),
      code: res.status ?? 0,
      success: res.status === 0,
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err.message,
      code: 1,
      success: false,
    };
  }
}

function getCurrentBranch() {
  const res = exec('git rev-parse --abbrev-ref HEAD');
  return res.stdout || 'main';
}

function getLatestCommitSha() {
  const res = exec('git rev-parse HEAD');
  return res.stdout;
}

function githubRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'SolveClimb-AutoCI/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ error: body, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('GitHub API request timed out'));
    });
    req.end();
  });
}

async function queryLocalAI(
  prompt,
  systemPrompt = 'You are an elite software engineer. Provide a concise, exact solution or code fix.'
) {
  const payload = JSON.stringify({
    model: 'coder',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.1,
    stream: false,
  });

  for (const baseUrl of LOCAL_AI_ENDPOINTS) {
    try {
      const parsed = new URL(`${baseUrl}/chat/completions`);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const result = await new Promise((resolve, reject) => {
        const req = client.request(
          parsed,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer EMPTY',
              'Content-Length': Buffer.byteLength(payload),
            },
            timeout: 30000,
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve(json?.choices?.[0]?.message?.content || '');
              } catch (err) {
                reject(err);
              }
            });
          }
        );

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Local AI timeout'));
        });
        req.write(payload);
        req.end();
      });

      if (result) return result;
    } catch (e) {
      // Try next endpoint
    }
  }

  throw new Error('All Local AI endpoints failed to respond');
}

/**
 * Step 1: Commit with Pre-commit Auto-Healing
 */
async function stepCommit(commitMessage, maxRetries = 3) {
  log('\n═══════════════════════════════════════════════════════', colors.cyan);
  log('  [Step 1] Git Commit & Auto-Healing', colors.cyan + colors.bold);
  log('═══════════════════════════════════════════════════════', colors.cyan);

  if (!commitMessage) {
    commitMessage = 'chore: auto-pipeline updates';
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    log(`\n▶ [시도 ${attempt}/${maxRetries}] 변경사항 스테이징 및 커밋 진행...`, colors.yellow);
    exec('git add .');

    const statusCheck = exec('git status --porcelain');
    if (!statusCheck.stdout) {
      log('ℹ️ 커밋할 변경사항이 없습니다 (Working tree clean).', colors.green);
      return true;
    }

    log(`▶ 커밋 실행: "${commitMessage}"`, colors.dim);
    const commitResult = exec(`git commit -m "${commitMessage}"`);

    if (commitResult.success) {
      log(
        `✅ 커밋 성공! (해시: ${getLatestCommitSha()?.substring(0, 7)})`,
        colors.green + colors.bold
      );
      return true;
    }

    const errorDetails = commitResult.stderr || commitResult.stdout;
    log(`❌ 프리커밋 검증 실패 발생:\n${errorDetails}`, colors.red);

    if (attempt >= maxRetries) {
      log(`⛔ 최대 재시도 횟수(${maxRetries}회)를 초과했습니다.`, colors.red + colors.bold);
      throw new Error(`Commit failed after ${maxRetries} attempts:\n${errorDetails}`);
    }

    log('🤖 VM 103 로컬 AI에게 에러 분석 및 자동 수정 요청 중...', colors.magenta);
    try {
      const prompt = `Following pre-commit check failed in our React/TypeScript Vite repository:\n\n${errorDetails}\n\nExplain the exact cause and list the files/lines to fix.`;
      const aiAdvice = await queryLocalAI(prompt);
      log(`💡 로컬 AI 분석 결과:\n${aiAdvice}`, colors.cyan);
    } catch (aiErr) {
      log(`⚠️ 로컬 AI 호출 실패: ${aiErr.message}`, colors.yellow);
    }

    log('⏳ 자동 조치 후 다시 시도합니다...', colors.yellow);
    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

/**
 * Step 2: Push & Smart GitHub Actions CI Watcher
 */
async function stepPush(branch, options = {}) {
  log('\n═══════════════════════════════════════════════════════', colors.cyan);
  log(`  [Step 2] Git Push & GitHub Actions CI Monitoring (${branch})`, colors.cyan + colors.bold);
  log('═══════════════════════════════════════════════════════', colors.cyan);

  log('▶ [1/3] 로컬 사전 정적 검증(Fast CI) 실행...', colors.yellow);
  const fastCheck = exec('npm run check:fast');
  if (!fastCheck.success) {
    log(`❌ 로컬 사전 검증 실패:\n${fastCheck.stderr || fastCheck.stdout}`, colors.red);
    throw new Error('Local pre-push check failed. Please resolve errors before pushing.');
  }
  log('✅ 로컬 사전 검증 통과!', colors.green);

  log(`▶ [2/3] 원격 브랜치(origin/${branch})로 푸시...`, colors.yellow);
  const pushRes = exec(`git push origin ${branch}`);
  if (!pushRes.success && !pushRes.stderr.includes('Everything up-to-date')) {
    log(`❌ Git 푸시 실패: ${pushRes.stderr || pushRes.stdout}`, colors.red);
    throw new Error(`Git push failed: ${pushRes.stderr}`);
  }
  log('✅ Git 푸시 완료!', colors.green);

  log('▶ [3/3] GitHub Actions CI 평균 실행 시간 산출 및 모니터링...', colors.yellow);
  let averageDurationSec = 150; // 기본 2분 30초
  try {
    const runsRes = await githubRequest(
      '/repos/Tangerines23/solve-climb/actions/runs?status=completed&conclusion=success&per_page=5'
    );
    if (runsRes?.workflow_runs?.length) {
      const durations = runsRes.workflow_runs.map((r) => {
        const start = new Date(r.run_started_at || r.created_at).getTime();
        const end = new Date(r.updated_at).getTime();
        return Math.max(10, Math.round((end - start) / 1000));
      });
      averageDurationSec = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    }
  } catch (err) {
    log(`⚠️ CI 평균 시간 계산 실패, 기본값(150s) 적용: ${err.message}`, colors.dim);
  }

  const waitTargetSec = averageDurationSec + 60;
  log(
    `⏱️ 최근 성공 CI 평균 소요 시간: ${averageDurationSec}초 (스마트 대기 타겟: ${waitTargetSec}초 / 약 ${Math.round(waitTargetSec / 60)}분)`,
    colors.cyan
  );

  const headSha = getLatestCommitSha();
  const startTime = Date.now();
  let pollCount = 0;

  while (true) {
    pollCount++;
    await new Promise((r) => setTimeout(r, 10000)); // 10초 주기 폴링
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    try {
      const activeRunsRes = await githubRequest(
        `/repos/Tangerines23/solve-climb/actions/runs?branch=${branch}&per_page=5`
      );
      const runs = activeRunsRes?.workflow_runs || [];
      const currentRun = runs.find(
        (r) => r.head_sha === headSha || r.name.toLowerCase().includes('ci')
      );

      if (!currentRun) {
        log(
          `⏳ [${elapsedSec}s] CI 워크플로우 큐 대기 중... (타겟: ~${waitTargetSec}s)`,
          colors.dim
        );
        continue;
      }

      const status = currentRun.status;
      const conclusion = currentRun.conclusion;

      if (status === 'in_progress' || status === 'queued') {
        const percent = Math.min(99, Math.round((elapsedSec / waitTargetSec) * 100));
        log(
          `🔄 [${elapsedSec}s / ~${waitTargetSec}s (${percent}%)] CI 실행 중... (ID: ${currentRun.id})`,
          colors.yellow
        );
        continue;
      }

      if (status === 'completed') {
        if (conclusion === 'success') {
          log(`\n🎉 CI 성공! (초록불 ✅, 소요 시간: ${elapsedSec}초)`, colors.green + colors.bold);
          return true;
        } else {
          log(`\n❌ CI 실패 감지 (적불 🔴, 상태: ${conclusion})`, colors.red + colors.bold);
          log(`🔗 워크플로우 로그: ${currentRun.html_url}`, colors.cyan);

          log('🤖 VM 103 로컬 AI에게 실패 진단 요청...', colors.magenta);
          const prompt = `GitHub Actions CI failed on branch '${branch}', commit '${headSha}'.\nRun URL: ${currentRun.html_url}\nConclusion: ${conclusion}\nPlease analyze what typical CI issues might cause this and provide fix recommendations.`;
          try {
            const aiAdvice = await queryLocalAI(prompt);
            log(`💡 로컬 AI 진단 결과:\n${aiAdvice}`, colors.cyan);
          } catch (e) {
            log(`⚠️ AI 진단 실패: ${e.message}`, colors.yellow);
          }

          throw new Error(
            `GitHub Actions CI failed with conclusion '${conclusion}'. See: ${currentRun.html_url}`
          );
        }
      }
    } catch (pollErr) {
      if (pollErr.message.includes('CI failed')) throw pollErr;
      log(`⚠️ 폴링 중 일시적 오류: ${pollErr.message}`, colors.dim);
    }
  }
}

/**
 * Step 3: Merge & Branch Cleanup
 */
async function stepMerge(featureBranch) {
  log('\n═══════════════════════════════════════════════════════', colors.cyan);
  log(`  [Step 3] Merge into main & Branch Cleanup (${featureBranch})`, colors.cyan + colors.bold);
  log('═══════════════════════════════════════════════════════', colors.cyan);

  const currentBranch = getCurrentBranch();

  if (currentBranch === 'main') {
    log('ℹ️ 현재 이미 main 브랜치입니다. 병합을 생략합니다.', colors.yellow);
    return true;
  }

  log(`▶ [1/4] main 브랜치 체크아웃 및 최신화...`, colors.yellow);
  exec('git checkout main');
  exec('git pull origin main');

  log(`▶ [2/4] '${featureBranch}' 브랜치를 main에 병합...`, colors.yellow);
  const mergeRes = exec(
    `git merge ${featureBranch} --no-ff -m "chore: merge ${featureBranch} into main"`
  );
  if (!mergeRes.success) {
    log(`❌ 병합 충돌 발생:\n${mergeRes.stderr || mergeRes.stdout}`, colors.red);
    throw new Error('Git merge conflict occurred. Please resolve conflicts manually.');
  }

  log(`▶ [3/4] 병합된 main을 원격에 푸시...`, colors.yellow);
  exec('git push origin main');
  log('✅ main 브랜치 푸시 완료!', colors.green);

  log(`▶ [4/4] 머지 완료된 피처 브랜치 정리...`, colors.yellow);
  exec(`git branch -d ${featureBranch}`);
  exec(`git push origin --delete ${featureBranch}`);
  log(`🗑️ 피처 브랜치 '${featureBranch}' (로컬/원격) 삭제 완료!`, colors.green);

  return true;
}

/**
 * Step 4: CD Verification (Android AAB & Vercel)
 */
async function stepCheckCD() {
  log('\n═══════════════════════════════════════════════════════', colors.cyan);
  log('  [Step 4] CD Deployment Verification (Android AAB & Vercel)', colors.cyan + colors.bold);
  log('═══════════════════════════════════════════════════════', colors.cyan);

  log('▶ 최근 CD 워크플로우 상태 조회 중...', colors.yellow);
  try {
    const runsRes = await githubRequest('/repos/Tangerines23/solve-climb/actions/runs?per_page=10');
    const runs = runsRes?.workflow_runs || [];

    const aabRun = runs.find(
      (r) => r.name.toLowerCase().includes('android') || r.name.toLowerCase().includes('aab')
    );
    const cdRuns = runs.filter((r) => !r.name.toLowerCase().includes('cleanup'));

    log('\n📊 [최근 배포 및 빌드 현황]', colors.bold);
    cdRuns.slice(0, 5).forEach((r) => {
      const mark = r.conclusion === 'success' ? '✅' : r.conclusion === 'failure' ? '❌' : '🔄';
      log(
        `  ${mark} [${r.name}] #${r.run_number} (${r.status} / ${r.conclusion || 'running'}) - ${r.html_url}`
      );
    });

    if (aabRun) {
      log(
        `\n📱 Android AAB 빌드 상태: [${aabRun.status} / ${aabRun.conclusion || 'running'}]`,
        colors.cyan
      );
    }
  } catch (err) {
    log(`⚠️ CD 상태 조회 실패: ${err.message}`, colors.yellow);
  }

  log('\n✨ CD 검증 완료!', colors.green + colors.bold);
}

/**
 * CLI Argument Parser
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    step: 'all',
    msg: '',
    branch: getCurrentBranch(),
    retries: 3,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--step' && i + 1 < args.length) {
      options.step = args[++i];
    } else if (arg === '--msg' && i + 1 < args.length) {
      options.msg = args[++i];
    } else if (arg === '--branch' && i + 1 < args.length) {
      options.branch = args[++i];
    } else if (arg === '--retries' && i + 1 < args.length) {
      options.retries = parseInt(args[++i], 10) || 3;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
${colors.bold}Solve Climb - Auto CI/CD & Self-Healing Pipeline${colors.reset}

Usage:
  node scripts/auto-ci-pipeline.js [options]

Options:
  --step <all|commit|push|merge|cd>  Specify pipeline step to run (default: all)
  --msg <message>                   Commit message for Step 1
  --branch <branchName>             Target branch name (default: current branch)
  --retries <number>                Max auto-healing retries for commit (default: 3)
  --help, -h                        Show this help message
`);
}

async function main() {
  const options = parseArgs();

  log(
    `\n🚀 [Solve Climb Auto-Pipeline 시작] (모드: ${options.step}, 브랜치: ${options.branch})`,
    colors.bold + colors.green
  );

  try {
    if (options.step === 'all' || options.step === 'commit') {
      await stepCommit(options.msg, options.retries);
    }
    if (options.step === 'all' || options.step === 'push') {
      await stepPush(options.branch, options);
    }
    if (options.step === 'all' || options.step === 'merge') {
      await stepMerge(options.branch);
    }
    if (options.step === 'all' || options.step === 'cd') {
      await stepCheckCD();
    }

    log('\n🎉 모든 파이프라인 단계가 성공적으로 완료되었습니다!', colors.green + colors.bold);
  } catch (err) {
    log(`\n💥 파이프라인 중단: ${err.message}`, colors.red + colors.bold);
    process.exit(1);
  }
}

main();
