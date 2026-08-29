import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

const targets = [
  path.resolve('docs', '.code-map.yaml'),
  path.resolve('.agent', '.code-map.yaml'),
  path.resolve('docs', 'architecture-map.yaml'),
  path.resolve('.agent', 'architecture-map.yaml'),
];

console.log('🔍 Checking Code Map & Architecture Map YAML files integrity & health...');
let hasError = false;
let warningCount = 0;

const loadedDocs = {};

// 1. Basic File Existence & YAML Parsing Check
for (const filePath of targets) {
  const relative = path.relative(process.cwd(), filePath);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [ERROR] Map file missing: ${relative}`);
    hasError = true;
    continue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(content);
    if (!doc || typeof doc !== 'object') {
      console.error(`❌ [ERROR] Map file invalid structure: ${relative}`);
      hasError = true;
      continue;
    }

    loadedDocs[relative.replace(/\\/g, '/')] = doc;

    if (filePath.endsWith('.code-map.yaml')) {
      const fileCount = Object.keys(doc.files || {}).length;
      if (fileCount < 10) {
        console.error(`❌ [ERROR] ${relative} has abnormally few mapped files: ${fileCount}`);
        hasError = true;
      } else {
        console.log(`✅ [OK] ${relative} syntax valid! (${fileCount} mapped files)`);
      }
    } else {
      const domainCount = Object.keys(doc.domains || {}).length;
      if (domainCount < 1) {
        console.error(`❌ [ERROR] ${relative} has no domains!`);
        hasError = true;
      } else {
        console.log(`✅ [OK] ${relative} syntax valid! (${domainCount} domains)`);
      }
    }
  } catch (err) {
    console.error(`❌ [ERROR] YAML Parse Error in ${relative}:`, err.message);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

// 2. Synchronized Copy Consistency Check (docs vs .agent)
const docsArch = loadedDocs['docs/architecture-map.yaml'];
const agentArch = loadedDocs['.agent/architecture-map.yaml'];
if (docsArch && agentArch) {
  if (JSON.stringify(docsArch) !== JSON.stringify(agentArch)) {
    console.error(
      '❌ [ERROR] docs/architecture-map.yaml and .agent/architecture-map.yaml are out of sync!'
    );
    hasError = true;
  }
}

const docsCode = loadedDocs['docs/.code-map.yaml'];
const agentCode = loadedDocs['.agent/.code-map.yaml'];
if (docsCode && agentCode) {
  if (JSON.stringify(docsCode) !== JSON.stringify(agentCode)) {
    console.error('❌ [ERROR] docs/.code-map.yaml and .agent/.code-map.yaml are out of sync!');
    hasError = true;
  }
}

// 3. Domain EntryPoints Verification
if (docsArch && docsArch.domains) {
  for (const [domainKey, domain] of Object.entries(docsArch.domains)) {
    const entryPoints = domain.entryPoints || [];
    if (entryPoints.length === 0) {
      console.warn(`⚠️ [WARN] Domain '${domainKey}' has no entryPoints specified.`);
      warningCount++;
    }
    for (const entry of entryPoints) {
      const fullPath = path.resolve(entry);
      if (!fs.existsSync(fullPath)) {
        console.error(
          `❌ [ERROR] Domain '${domainKey}' references non-existent entryPoint: ${entry}`
        );
        hasError = true;
      }
    }
  }
}

// 4. Missing / Generic Metadata Warning (RPC & DB tables)
if (docsArch && docsArch.database) {
  const rpcs = docsArch.database.rpcs || {};
  for (const [_rpcName, desc] of Object.entries(rpcs)) {
    if (typeof desc === 'string' && desc.endsWith('원격 프로시저 (RPC)')) {
      // Generic fallback detected
    }
  }
}

// 5. Broken @calls Annotation Verification in Code Map
if (docsCode && docsCode.files) {
  for (const [sourceFile, fileData] of Object.entries(docsCode.files)) {
    for (const exp of fileData.exports || []) {
      for (const call of exp.calls || []) {
        if (call.startsWith('src/') && call.includes('#')) {
          const [targetFile] = call.split('#');
          const fullPath = path.resolve(targetFile);
          if (!fs.existsSync(fullPath)) {
            console.error(
              `❌ [ERROR] Broken @calls in ${sourceFile} -> target file does not exist: ${targetFile}`
            );
            hasError = true;
          }
        }
      }
    }
  }
}

if (hasError) {
  console.error('\n❌ Code Map & Architecture Map verification failed with errors.');
  process.exit(1);
} else {
  console.log(
    `\n🎉 Code Map & Architecture Map verification passed cleanly! (Warnings/Notices: ${warningCount})`
  );
}
