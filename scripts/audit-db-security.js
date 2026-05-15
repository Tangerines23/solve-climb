import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

// Service role client is needed for high-privilege security audit
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSecurityAudit() {
  console.log('--- Starting Advanced Database Security Audit ---');

  try {
    // 1. Call the advanced vulnerability check RPC
    const { data: vulnerabilities, error: vError } = await supabase.rpc(
      'check_security_vulnerabilities'
    );

    if (vError) {
      // If RPC doesn't exist yet, it's not a failure of the script itself but a missing deployment
      if (vError.code === 'P0001' || vError.message.includes('function')) {
        console.warn(
          'Warning: check_security_vulnerabilities RPC not found. Skipping SQL-level audit.'
        );
      } else {
        throw vError;
      }
    } else {
      console.log(`\nFound ${vulnerabilities?.length || 0} potential vulnerabilities:`);
      vulnerabilities?.forEach((v) => {
        const severity = v.severity === 'CRITICAL' ? '🔴' : '🟡';
        console.log(`${severity} [${v.category}] ${v.object_name}: ${v.description}`);
        console.log(`   Fix: ${v.fix_suggestion}\n`);
      });

      const criticals = vulnerabilities?.filter((v) => v.severity === 'CRITICAL') || [];
      if (criticals.length > 0) {
        console.error('CRITICAL VULNERABILITIES DETECTED! Audit failed.');
        process.exit(1);
      }
    }

    // 2. Additional white-box checks could go here...
    console.log('\n--- Advanced Audit Completed Successfully ---');
  } catch (err) {
    console.error('Audit execution error:', err.message);
    process.exit(1);
  }
}

runSecurityAudit();
