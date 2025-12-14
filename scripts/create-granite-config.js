#!/usr/bin/env node

/**
 * 배포용 granite.config.js 자동 생성 스크립트
 * 
 * 사용법:
 *   node scripts/create-granite-config.js
 * 
 * 이 스크립트는 dist/web/granite.config.js 파일을 생성합니다.
 * import 없이 순수 JavaScript로 작성되어 .ait 파일 배포 시 node_modules 없이도 동작합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configContent = `// dist/granite.config.js
// 배포용 설정 파일 - import 없이 순수 JavaScript로 작성
// 이 파일은 빌드 시 자동으로 생성됩니다.
module.exports = {
  appName: 'solve-climb',
  brand: {
    displayName: 'solve-climb',
    primaryColor: '#00BFA5',
    icon: 'SolveClimb.png',
    bridgeColorMode: 'basic',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: '.',
};
`;

const distPath = path.join(__dirname, '../dist');
const configPath = path.join(distPath, 'granite.config.js');

// dist 폴더가 없으면 생성
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// granite.config.js 파일 생성
fs.writeFileSync(configPath, configContent, 'utf-8');
console.log('✓ Created dist/granite.config.js');

