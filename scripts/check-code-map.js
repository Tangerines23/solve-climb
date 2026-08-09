import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const targets = [
  path.resolve('docs', '.code-map.yaml'),
  path.resolve('.agent', '.code-map.yaml'),
];

console.log('Checking Code Map YAML files integrity...');
let hasError = false;

for (const filePath of targets) {
  const relative = path.relative(process.cwd(), filePath);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [ERROR] Code map file missing: ${relative}`);
    hasError = true;
    continue;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(content);
    if (!doc || typeof doc !== 'object' || !doc.files) {
      console.error(`❌ [ERROR] Code map file invalid structure: ${relative}`);
      hasError = true;
      continue;
    }

    const fileCount = Object.keys(doc.files).length;
    console.log(`✅ [OK] ${relative} is valid YAML! (${fileCount} mapped files)`);
  } catch (err) {
    console.error(`❌ [ERROR] YAML Parse Error in ${relative}:`, err.message);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('🎉 Code Map verification passed cleanly!');
}
