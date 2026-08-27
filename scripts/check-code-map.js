import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

const targets = [
  path.resolve('docs', '.code-map.yaml'),
  path.resolve('.agent', '.code-map.yaml'),
  path.resolve('docs', 'architecture-map.yaml'),
  path.resolve('.agent', 'architecture-map.yaml'),
];

console.log('Checking Code Map & Architecture Map YAML files integrity...');
let hasError = false;

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

    if (filePath.endsWith('.code-map.yaml')) {
      const fileCount = Object.keys(doc.files || {}).length;
      console.log(`✅ [OK] ${relative} is valid Detailed Code Map! (${fileCount} mapped files)`);
    } else {
      const domainCount = Object.keys(doc.domains || {}).length;
      console.log(`✅ [OK] ${relative} is valid Macro Architecture Map! (${domainCount} domains)`);
    }
  } catch (err) {
    console.error(`❌ [ERROR] YAML Parse Error in ${relative}:`, err.message);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('🎉 Code Map & Architecture Map verification passed cleanly!');
}
