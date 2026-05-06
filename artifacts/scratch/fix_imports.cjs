const fs = require('fs');
const path = require('path');

const srcDir = 'src';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);

// Mapping for internal quiz files (to help resolve ambiguous imports)
const quizFiles = allFiles.filter(f => f.includes('src/features/quiz'));
const quizMapping = {};
quizFiles.forEach(file => {
  const ext = path.extname(file);
  if (ext !== '.ts' && ext !== '.tsx') return;
  if (file.includes('__tests__')) return;
  if (file.endsWith('index.ts')) return;

  const basename = path.basename(file, ext);
  const relPath = path.relative('src/features/quiz', file).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  
  if (!quizMapping[basename]) {
      quizMapping[basename] = relPath;
  }
});

allFiles.forEach(file => {
  const ext = path.extname(file);
  if (ext !== '.ts' && ext !== '.tsx') return;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix malformed @/ aliases in ANY file
  const malformedAliasRegex = /@\/(\.\.\/)+/g;
  if (malformedAliasRegex.test(content)) {
    content = content.replace(malformedAliasRegex, '@/');
    changed = true;
  }

  // 2. Fix excessive relative paths (only if they are clearly targeting top-level dirs)
  const topLevelDirs = ['stores', 'constants', 'utils', 'hooks', 'components', 'types', 'services', 'lib', 'pages', 'features'];
  topLevelDirs.forEach(dir => {
    // Matches ../../../dir/ or ../../../../dir/
    const relRegex = new RegExp(`(\\.\\.\\/){3,}${dir}\\/`, 'g');
    if (relRegex.test(content)) {
      content = content.replace(relRegex, `@/${dir}/`);
      changed = true;
    }
  });

  // 3. Fix broken imports to tiers/game constants that moved to quiz
  if (content.includes('@/constants/tiers')) {
    content = content.replace(/@\/constants\/tiers/g, '@/features/quiz/constants/tiers');
    changed = true;
  }
  if (content.includes('@/constants/game')) {
    content = content.replace(/@\/constants\/game/g, '@/features/quiz/constants/game');
    changed = true;
  }

  // 4. If we are in features/quiz, ensure internal imports are correct
  if (file.includes('src/features/quiz')) {
    const importRegex = /(['"])(@\/features\/quiz\/)([^'"]+)\1/g;
    content = content.replace(importRegex, (match, quote, prefix, itemName) => {
      if (itemName.includes('/')) return match;

      if (quizMapping[itemName]) {
        const newPath = `${prefix}${quizMapping[itemName]}`;
        if (newPath !== match.slice(1, -1)) {
          changed = true;
          return `${quote}${newPath}${quote}`;
        }
      }
      return match;
    });

    // Special case for core hooks
    const coreHooks = ['useQuizSubmit', 'useQuizRevive', 'useQuizGameState', 'useQuizValidator', 'useQuizScoring'];
    coreHooks.forEach(hook => {
      if (content.includes(`@/features/quiz/${hook}`)) {
         content = content.replace(new RegExp(`@/features/quiz/${hook}`, 'g'), `@/features/quiz/hooks/core/${hook}`);
         changed = true;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});
