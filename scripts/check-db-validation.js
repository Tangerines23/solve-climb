#!/usr/bin/env node
/**
 * DB 검증 테스트 스크립트
 * Supabase DB의 데이터 무결성을 검증합니다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials not found');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDBValidation() {
    console.log('🔍 Running DB validation tests...\n');

    try {
        // test_db_all_validations() 함수 실행 (기본 + 고급 검증)
        const { data, error } = await supabase.rpc('test_db_all_validations');

        if (error) {
            console.error('❌ Error running DB tests:', error.message);
            process.exit(1);
        }

        if (!data || data.length === 0) {
            console.error('❌ No test results returned');
            process.exit(1);
        }

        // 결과 출력
        let allPassed = true;
        console.log('--- Resource checks ---');
        data.filter(t => t.test_name.startsWith('check_required')).forEach((test) => {
            const icon = test.result ? '✅' : '❌';
            console.log(`${icon} ${test.test_name}: ${test.message}`);
            if (!test.result) allPassed = false;
        });

        console.log('\n--- Data integrity checks ---');
        data.filter(t => !t.test_name.startsWith('check_required')).forEach((test) => {
            const icon = test.result ? '✅' : '❌';
            console.log(`${icon} ${test.test_name}: ${test.message}`);
            if (!test.result) allPassed = false;
        });

        console.log(`\n📊 Total: ${data.length} tests`);
        console.log(`✅ Passed: ${data.filter((t) => t.result).length}`);
        console.log(`❌ Failed: ${data.filter((t) => !t.result).length}`);

        if (!allPassed) {
            console.error('\n❌ DB validation failed! Please check missing resources or data errors.');
            process.exit(1);
        }

        console.log('\n✅ All DB validation tests passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

runDBValidation();
