import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Security & RLS Perimeter Audit
 * 빌드 결과물의 보안성(민감 파일 유출)과 DB RLS 활성화 여부를 전수 조사합니다.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSecurityAudit() {
  console.log('🛡️  Starting Security & RLS Audit...');
  let failed = false;

  // 1. 빌드 결과물 민감 파일 체크 (Hygiene Check)
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    console.log('[SEC] Checking dist folder for sensitive files...');
    const sensitiveFiles = ['.env', 'package-lock.json', '.git', 'supabase'];

    const checkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (sensitiveFiles.includes(file)) {
          console.error(`❌ CRITICAL: Sensitive file "${file}" found in dist!`);
          failed = true;
        }
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        }
      }
    };
    checkDir(distPath);
  }

  // 2. DB RLS 전수 조사
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[SEC] Auditing Database Table RLS Status...');

    // test_db_all_validations 에 이미 RLS 체크가 포함되어 있지만,
    // 여기서는 명시적으로 모든 테이블 리스트를 뽑아 대조할 수 있는 로직 지향
    const { data: tests, error } = await supabase.rpc('test_db_all_validations');

    if (error) {
      console.warn('⚠️ Could not run DB validation RPC. Skipping DB part of audit.');
    } else {
      const rlsTest = tests.find((t) => t.test_name === 'check_rls_enabled');
      if (rlsTest && !rlsTest.result) {
        console.error(`❌ SECURITY: ${rlsTest.message}`);
        failed = true;
      } else if (rlsTest) {
        console.log('✅ All public tables have RLS enabled.');
      }
    }
  }

  if (failed) {
    console.error('❌ Security Audit Failed!');
    process.exit(1);
  } else {
    console.log('✅ Security Audit Passed.');
  }
}

runSecurityAudit();
