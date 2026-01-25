#!/usr/bin/env node

/**
 * 하드코딩된 CSS 값 검사 스크립트
 *
 * 사용법:
 *   node scripts/check-hardcoded-values.js
 *
 * 허용되는 하드코딩:
 *   - index.css의 변수 정의
 *   - 그래픽 요소의 그라데이션
 *   - 브랜드 색상 (Google 등)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 허용되는 하드코딩 패턴
const ALLOWED_PATTERNS = [
  /index\.css/, // index.css 파일 전체
  /tds-theme\.css/, // 테마 정의 파일
  /ClimbGraphic\.css/, // 그래픽 정의 파일
  /linear-gradient/, // 그라데이션
  /radial-gradient/, // 방사형 그라데이션
  /#4285F4|#357ae8|#2d6cd9/, // Google 브랜드 색상
  /rgba\(var\(/, // rgba(var(...)) 형태
  /rgb\(var\(/, // rgb(var(...)) 형태
];

// 검사할 파일 확장자
const CSS_EXTENSIONS = ['.css', '.tsx'];

// 검사 결과
const issues = {
  colors: [],
  spacing: [],
  borderRadius: [],
};

/**
 * 파일이 허용되는 하드코딩인지 확인
 */
function isAllowedHardcoding(filePath, line) {
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(filePath) || pattern.test(line));
}

/**
 * CSS 파일에서 하드코딩된 값 검사
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.includes('console.log')) return; // console.log 스타일링 제외
    if (line.includes('고정값 허용')) return; // 의도된 고정값 사용 제외
    const lineNum = index + 1;

    // 하드코딩된 색상 검사 (#RRGGBB 또는 #RGB)
    const colorMatch = line.match(/#[0-9a-fA-F]{3,6}/gi);
    if (colorMatch) {
      const hasVar = line.includes('var(--');
      if (!hasVar && !isAllowedHardcoding(filePath, line)) {
        issues.colors.push({
          file: filePath,
          line: lineNum,
          value: colorMatch[0],
          code: line.trim(),
        });
      }
    }

    // 하드코딩된 padding/margin/gap 검사 (CSS 및 TSX CamelCase 대응)
    const spacingMatch = line.match(/(padding|margin|gap|spacing)[a-z]*:\s*['"]?(\d+)px['"]?/gi);
    if (spacingMatch) {
      const hasVar = line.includes('var(--');
      if (!hasVar && !isAllowedHardcoding(filePath, line)) {
        issues.spacing.push({
          file: filePath,
          line: lineNum,
          value: spacingMatch[0],
          code: line.trim(),
        });
      }
    }

    // 하드코딩된 border-radius 검사 (CSS 및 TSX CamelCase 대응)
    const borderRadiusMatch = line.match(/border[a-z]*Radius:\s*['"]?(\d+)px['"]?/gi) || line.match(/border-radius:\s*(\d+)px/gi);
    if (borderRadiusMatch) {
      const hasVar = line.includes('var(--');
      if (!hasVar && !isAllowedHardcoding(filePath, line)) {
        issues.borderRadius.push({
          file: filePath,
          line: lineNum,
          value: borderRadiusMatch[0],
          code: line.trim(),
        });
      }
    }
  });
}

/**
 * 디렉토리 재귀적으로 탐색
 */
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // node_modules, dist, .git, apps-in-toss-examples-main, __tests__ 제외
      if (!['node_modules', 'dist', '.git', 'apps-in-toss-examples-main', '__tests__'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      // .test., .spec. 파일 제외하고 CSS/TSX 파일만 포함
      if (CSS_EXTENSIONS.includes(ext) && !file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🔍 하드코딩된 CSS 값 검사 시작...\n');

  const srcDir = path.join(__dirname, '..', 'src');
  const cssFiles = walkDir(srcDir);

  console.log(`📁 검사할 파일: ${cssFiles.length}개\n`);

  cssFiles.forEach((file) => {
    checkFile(file);
  });

  // 결과 출력
  const totalIssues = issues.colors.length + issues.spacing.length + issues.borderRadius.length;

  if (totalIssues === 0) {
    console.log('✅ 하드코딩된 값이 없습니다!\n');
    process.exit(0);
  }

  console.log(`⚠️  하드코딩된 값 발견: ${totalIssues}개\n`);

  if (issues.colors.length > 0) {
    console.log('🎨 하드코딩된 색상:');
    issues.colors.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.code}`);
      console.log(`   → ${issue.value} → var(--color-*) 사용 권장\n`);
    });
  }

  if (issues.spacing.length > 0) {
    console.log('📏 하드코딩된 간격:');
    issues.spacing.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.code}`);
      console.log(`   → var(--spacing-*) 사용 권장\n`);
    });
  }

  if (issues.borderRadius.length > 0) {
    console.log('🔲 하드코딩된 Border Radius:');
    issues.borderRadius.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.code}`);
      console.log(`   → var(--rounded-*) 사용 권장\n`);
    });
  }

  console.log('\n💡 해결 방법:');
  console.log('   - 색상: var(--color-*) 변수 사용');
  console.log('   - 간격: var(--spacing-*) 변수 사용');
  console.log('   - Border Radius: var(--rounded-*) 변수 사용');
  console.log('   - 자세한 내용: docs/DESIGN_SYSTEM.md 참고\n');

  process.exit(1);
}

// 스크립트 실행
main();
