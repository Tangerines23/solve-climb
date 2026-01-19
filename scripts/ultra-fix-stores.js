import fs from 'fs';
import path from 'path';

const files = ['src/stores/useLevelProgressStore.ts', 'src/stores/useUserStore.ts'];

files.forEach((file) => {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the destructuring pattern with an ULTRA safe one
  // Matches: const { data } = await ...supabase.auth.getUser());

  const pattern = /const\s+\{\s+data\s+\}\s+=\s+await\s+([\s\S]+?supabase\.auth\.getUser\(\)\);?)/g;

  content = content.replace(pattern, (match, query) => {
    return `const authResult = await ${query}\n          const user = authResult?.data?.user;`;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
