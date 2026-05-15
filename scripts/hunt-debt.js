#!/usr/bin/env node

/**
 * Architectural Debt Hunter
 * 코드 내 기술적 부채(TODO, FIXME, any 등)를 추적하고 점수화합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = ['src'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css'];

const debtReport = {
  timestamp: new Date().toISOString(),
  summary: {
    todos: 0,
    fixmes: 0,
    anys: 0,
    totalFiles: 0,
    totalLines: 0,
    debtScore: 0,
  },
  details: [],
};

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', '__tests__', 'coverage'].includes(file)) {
        walkDir(fullPath);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  });
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const ext = path.extname(filePath).toLowerCase();

  debtReport.summary.totalFiles++;
  debtReport.summary.totalLines += lines.length;

  let fileDebt = {
    file: path.relative(ROOT, filePath),
    todos: 0,
    fixmes: 0,
    anys: 0,
    lines: lines.length,
  };

  lines.forEach((line) => {
    // 1. TODO/FIXME (주석 내)
    if (line.includes('TODO')) {
      debtReport.summary.todos++;
      fileDebt.todos++;
    }
    if (line.includes('FIXME')) {
      debtReport.summary.fixmes++;
      fileDebt.fixmes++;
    }

    // 2. 'any' 타입 사용 (TS 파일만)
    if (ext === '.ts' || ext === '.tsx') {
      // ': any', '<any>', 'as any' 패턴 매칭 (단어 경계 체크)
      const anyPattern = /:\s*any\b|<\s*any\s*>|as\s*any\b/g;
      const matches = line.match(anyPattern);
      if (matches) {
        debtReport.summary.anys += matches.length;
        fileDebt.anys += matches.length;
      }
    }
  });

  if (fileDebt.todos > 0 || fileDebt.fixmes > 0 || fileDebt.anys > 0 || fileDebt.lines > 500) {
    debtReport.details.push(fileDebt);
  }
}

function calculateScore() {
  // 패널티 점수: TODO(1), FIXME(2), any(3), 긴 파일(500줄 이상: 5)
  let penalty = 0;
  penalty += debtReport.summary.todos * 0.5;
  penalty += debtReport.summary.fixmes * 1.5;
  penalty += debtReport.summary.anys * 2.5;

  // 긴 파일 패널티
  const longFiles = debtReport.details.filter((d) => d.lines > 500).length;
  penalty += longFiles * 5;

  // 100점 만점 기준 (패널티가 많을수록 감점)
  // 프로젝트 규모에 따라 스케일 조정 (여기서는 200점 패널티당 10% 감점 수준으로 설정)
  const score = Math.max(0, 100 - penalty / 2);
  debtReport.summary.debtScore = parseFloat(score.toFixed(1));
}

console.log('🏹 Architectural Debt Hunter is scanning the codebase...');
SCAN_DIRS.forEach((dir) => {
  const fullPath = path.join(ROOT, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath);
  }
});

calculateScore();

const reportDir = path.join(ROOT, 'reports', 'logs');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, 'debt-report.json');
fs.writeFileSync(reportPath, JSON.stringify(debtReport, null, 2));

console.log('\n--- Debt Hunt Summary ---');
console.log(`📁 Files Scanned: ${debtReport.summary.totalFiles}`);
console.log(`📝 Total Lines: ${debtReport.summary.totalLines}`);
console.log(`📌 TODOs: ${debtReport.summary.todos}`);
console.log(`🛠️ FIXMEs: ${debtReport.summary.fixmes}`);
console.log(`⚠️  'any' usage: ${debtReport.summary.anys}`);
console.log(`🏆 Debt Score: ${debtReport.summary.debtScore}/100`);
console.log(`\n📄 Report saved to: ${reportPath}`);
