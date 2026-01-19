import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const hooks = globSync('src/hooks/**/*.ts*');
const stores = globSync('src/stores/**/*.ts*');
const allFiles = [...hooks, ...stores];

const pattern =
  /const\s+\{\s+data\s+\}\s+=\s+await\s+([\s\S]+?supabase\.(?:auth\.getUser|from\([\s\S]+?\)\.select\([\s\S]+?\)|rpc\([\s\S]+?\))\);?)/g;

allFiles.forEach((file) => {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const newContent = content.replace(pattern, (match, query) => {
    modified = true;
    // Extract the variable name if possible, or use a generic one
    return `const { data } = (await ${query.trim()}) || {}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
  }
});
