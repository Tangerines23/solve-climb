import { test } from '@playwright/test';

test('Supabase 데이터베이스 상태 확인', async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const dbStatus = await page.evaluate(async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(
            'https://aekcjzxxjczqibxkoakg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2Nqenh4amN6cWlieGtvYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTU0MzgsImV4cCI6MjA3OTEzMTQzOH0.QInfpxDWboilFrKiWzqXU-QdRa-9cJT0Ch7_ygEK7mw'
        );

        // 1. 익명 로그인
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            return { step: 'auth', error: authError.message };
        }

        const userId = authData.user?.id;

        // 2. profiles 테이블 조회
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, nickname')
            .limit(5);

        if (profileError) {
            return { step: 'profiles', error: profileError.message, userId };
        }

        // 3. game_activity 테이블 조회
        const { data: activities, error: activityError } = await supabase
            .from('game_activity')
            .select('*')
            .limit(5);

        if (activityError) {
            return { step: 'game_activity', error: activityError.message, userId, profilesCount: profiles?.length };
        }

        // 4. RPC 함수 호출 테스트
        const { data: ranking, error: rpcError } = await supabase
            .rpc('get_ranking_v2', {
                p_category: '기초',
                p_period: 'weekly',
                p_type: 'time-attack'
            });

        if (rpcError) {
            return {
                step: 'rpc',
                error: rpcError.message,
                userId,
                profilesCount: profiles?.length,
                activitiesCount: activities?.length
            };
        }

        return {
            success: true,
            userId,
            profilesCount: profiles?.length || 0,
            activitiesCount: activities?.length || 0,
            rankingCount: ranking?.length || 0,
            sampleProfile: profiles?.[0],
            sampleActivity: activities?.[0],
            sampleRanking: ranking?.[0]
        };
    });

    console.log('[DB STATUS]', JSON.stringify(dbStatus, null, 2));

    if (!dbStatus.success) {
        console.error(`[DB STATUS] Failed at step: ${dbStatus.step}`);
        console.error(`[DB STATUS] Error: ${dbStatus.error}`);
    }
});
