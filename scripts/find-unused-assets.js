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

// 1. 소스 코드 및 관련 파일들 모두 읽기
console.log('📖 Loading source files into memory...');
const sourceFiles = [...getAllFiles(SRC_DIR), path.resolve(process.cwd(), 'index.html')];
const manifestPath = path.resolve(PUBLIC_DIR, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  sourceFiles.push(manifestPath);
}

const sourceContents = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

console.log('🔍 Scanning for unused assets...\n');

const publicFiles = getAllFiles(PUBLIC_DIR);
let unusedCount = 0;

publicFiles.forEach((filePath) => {
  const filename = path.basename(filePath);

  if (IGNORE_FILES.includes(filename)) return;

  // Use a more precise regex to find the filename in source
  // This helps avoid matching "logo.png" inside "my-logo.png"
  // It checks for boundary characters or quotes
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(`["'/]${escapedFilename}["']`, 'i');

  // Also support direct mentions (e.g. in comments or non-quoted strings)
  const isUsed = searchRegex.test(sourceContents) || sourceContents.includes(filename);

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
