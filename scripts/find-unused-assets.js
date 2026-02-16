import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SRC_DIR = path.resolve(process.cwd(), 'src');
const IGNORE_FILES = [
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'mockServiceWorker.js',
  'sw.js',
];

// 재귀적으로 디렉토리 내 모든 파일 찾기
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
}

// 소스 코드 내에서 문자열 검색
function searchInSource(filename) {
  const sourceFiles = getAllFiles(SRC_DIR);
  let found = false;

  for (const srcFile of sourceFiles) {
    const content = fs.readFileSync(srcFile, 'utf8');
    if (content.includes(filename)) {
      found = true;
      break;
    }
  }
  return found;
}

console.log('🔍 Unused Asset Scanner\n');

const publicFiles = getAllFiles(PUBLIC_DIR);
let unusedCount = 0;

publicFiles.forEach((filePath) => {
  const filename = path.basename(filePath);

  if (IGNORE_FILES.includes(filename)) return;

  // index.html도 검색 대상에 포함
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  if (indexHtml.includes(filename)) return;

  // manifest.json도 검색 대상에 포함
  const manifestPath = path.resolve(PUBLIC_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    if (manifestContent.includes(filename)) return;
  }

  const isUsed = searchInSource(filename);

  if (!isUsed) {
    console.log(`❌ Unused: ${path.relative(process.cwd(), filePath)}`);
    unusedCount++;
  }
});

if (unusedCount === 0) {
  console.log('\n✅ All public assets are being used.');
  process.exit(0);
} else {
  console.log(`\n⚠️  Found ${unusedCount} unused assets.`);
  console.log('👉 Please remove them or add to IGNORE_FILES in scripts/find-unused-assets.js');
  process.exit(1);
}
