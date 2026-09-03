#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url from 'url';
import os from 'os';
import { createInterface } from 'readline';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rl = createInterface({ input: process.stdin, output: process.stdout });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function exec(cmd, options = {}) {
  try {
    const { stdout, stderr, status } = spawnSync(cmd, { shell: true, ...options });
    return {
      stdout: stdout?.toString().trim(),
      stderr: stderr?.toString().trim(),
      code: status,
      success: status === 0,
    };
  } catch (error) {
    return {
      stdout: '',
      stderr: error.message,
      code: 1,
      success: false,
    };
  }
}

function getCurrentBranch() {
  return exec('git rev-parse --abbrev-ref HEAD').stdout;
}

function getLatestCommitSha() {
  return exec('git rev-parse HEAD').stdout;
}

function githubRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.github.com${endpoint}`,
      { headers: { 'User-Agent': 'Node.js' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function stepCommit(commitMessage, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    exec('git add .');
    const status = exec('git status --porcelain');
    if (!status.stdout) {
      console.log(colorize('No changes to commit.', 'yellow'));
      return;
    }
    const commitResult = exec(`git commit -m "${commitMessage}"`);
    if (commitResult.success) {
      console.log(colorize('Commit successful.', 'green'));
      return;
    } else {
      console.error(colorize(`Commit failed: ${commitResult.stderr}`, 'red'));
      const aiFixes = await invokeLocalAI(commitResult.stderr);
      applyFixes(aiFixes);
      retries++;
    }
  }
  throw new Error('Max retries exceeded for commit.');
}

function invokeLocalAI(errorOutput) {
  return new Promise((resolve, reject) => {
    const aiProcess = spawn('curl', [
      '-X',
      'POST',
      'http://localhost:40000',
      '-H',
      'Content-Type: application/json',
      '-d',
      JSON.stringify({ error: errorOutput }),
    ]);
    let data = '';
    aiProcess.stdout.on('data', (chunk) => (data += chunk));
    aiProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    aiProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('AI process failed.'));
      }
    });
  });
}

function applyFixes(fixes) {
  fixes.forEach((fix) => {
    fs.writeFileSync(fix.file, fix.content, 'utf8');
  });
}

async function stepPush(branch, options = {}) {
  const fastCheckResult = exec('npm run check:fast');
  if (!fastCheckResult.success) {
    console.error(colorize('Fast checks failed.', 'red'));
    throw new Error('Fast checks failed.');
  }
  const pushResult = exec(`git push -u origin ${branch}`);
  if (!pushResult.success) {
    console.error(colorize('Push failed.', 'red'));
    throw new Error('Push failed.');
  }
  const runs = await githubRequest(
    `/repos/Tangerines23/solve-climb/actions/runs?status=completed&conclusion=success&per_page=5`
  );
  const averageDuration = runs.workflow_runs.reduce((acc, run) => acc + run.run_duration_ms, 0) / runs.workflow_runs.length / 1000;
  const targetWaitTime = averageDuration + 60;
  const latestCommitSha = getLatestCommitSha();
  let startTime = Date.now();
  while (true) {
    const currentRuns = await githubRequest(
      `/repos/Tangerines23/solve-climb/actions/runs?head_sha=${latestCommitSha}&branch=${branch}`
    );
    const currentRun = currentRuns.workflow_runs[0];
    if (currentRun) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      console.log(
        colorize(
          `CI Status: ${currentRun.status} (${currentRun.conclusion}), Elapsed: ${elapsedTime.toFixed(2)}s`,
          currentRun.conclusion === 'success' ? 'green' : currentRun.conclusion === 'failure' ? 'red' : 'yellow'
        )
      );
      if (currentRun.conclusion === 'success') {
        return true;
      } else if (currentRun.conclusion === 'failure') {
        const failedJobs = await githubRequest(`/repos/Tangerines23/solve-climb/actions/runs/${currentRun.id}/jobs`);
        failedJobs.jobs.forEach((job) => {
          console.error(colorize(`Job ${job.name} failed: ${job.conclusion}`, 'red'));
        });
        const aiFixes = await invokeLocalAI(failedJobs.jobs.map((job) => job.conclusion).join('\n'));
        applyFixes(aiFixes);
        await stepCommit(options.commitMessage, options.maxRetries);
        await stepPush(branch, options);
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function stepMerge(featureBranch) {
  const currentBranch = getCurrentBranch();
  if (currentBranch !== 'main') {
    exec('git checkout main');
    exec('git pull origin main');
    const mergeResult = exec(`git merge ${featureBranch} --no-ff -m "chore: merge ${featureBranch} into main"`);
    if (mergeResult.success) {
      exec('git push origin main');
      exec(`git branch -d ${featureBranch}`);
      exec(`git push origin --delete ${featureBranch}`);
      console.log(colorize('Merge successful.', 'green'));
    } else {
      console.error(colorize('Merge failed.', 'red'));
      throw new Error('Merge failed.');
    }
  } else {
    console.log(colorize('Already on main branch, no merge needed.', 'yellow'));
  }
}

async function stepCheckCD() {
  const androidBuildRun = await githubRequest(
    `/repos/Tangerines23/solve-climb/actions/runs?event=push&workflow_name=Build%20&%20Release%20Android%20(AAB)&status=completed&conclusion=success&per_page=1`
  );
  const vercelDeployRun = await githubRequest(
    `/repos/Tangerines23/solve-climb/actions/runs?event=push&workflow_name=Vercel%20Deployment&status=completed&conclusion=success&per_page=1`
  );
  console.log(
    colorize(
      `Android Build: ${androidBuildRun.workflow_runs[0]?.conclusion || 'not found'} (${androidBuildRun.workflow_runs[0]?.run_duration_ms / 1000 || 'N/A'}s)`,
      androidBuildRun.workflow_runs[0]?.conclusion === 'success' ? 'green' : 'red'
    )
  );
  console.log(
    colorize(
      `Vercel Deployment: ${vercelDeployRun.workflow_runs[0]?.conclusion || 'not found'} (${vercelDeployRun.workflow_runs[0]?.run_duration_ms / 1000 || 'N/A'}s)`,
      vercelDeployRun.workflow_runs[0]?.conclusion === 'success' ? 'green' : 'red'
    )
  );
}

async function main() {
  const args = process.argv.slice(2);
  const step = args.includes('--step') ? args[args.indexOf('--step') + 1] : 'all';
  const msg = args.includes('--msg') ? args[args.indexOf('--msg') + 1] : 'Automated commit';
  const branch = args.includes('--branch') ? args[args.indexOf('--branch') + 1] : getCurrentBranch();
  const retries = args.includes('--retries') ? parseInt(args[args.indexOf('--retries') + 1], 10) : 3;

  try {
    if (step === 'all' || step === 'commit') {
      await stepCommit(msg, retries);
    }
    if (step === 'all' || step === 'push') {
      await stepPush(branch, { commitMessage: msg, maxRetries: retries });
    }
    if (step === 'all' || step === 'merge') {
      await stepMerge(branch);
    }
    if (step === 'all' || step === 'cd') {
      await stepCheckCD();
    }
  } catch (error) {
    console.error(colorize(`Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

main();