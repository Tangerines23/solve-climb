import fs from 'fs';
import path from 'path';

const files = ['src/stores/useLevelProgressStore.ts', 'src/stores/useUserStore.ts'];

files.forEach((file) => {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the destructuring pattern with a safer one
  // Matches:
  // const {
  //   data: { user },
  // } = await ...supabase.auth.getUser());

  const pattern =
    /const\s+\{\s+data:\s+\{\s+user\s+\},\s+\}\s+=\s+await\s+([\s\S]+?supabase\.auth\.getUser\(\)\);?)/g;

  content = content.replace(pattern, (match, query) => {
    return `const { data } = await ${query}\n          const user = data?.user;`;
  });

  // Also match the single line version if any
  const singleLinePattern =
    /const\s+\{\s+data:\s+\{\s+user\s+\}\s+\}\s+=\s+await\s+([\s\S]+?supabase\.auth\.getUser\(\)\);?)/g;
  content = content.replace(singleLinePattern, (match, query) => {
    return `const { data } = await ${query}\n    const user = data?.user;`;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
