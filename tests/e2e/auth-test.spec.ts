import { test, expect } from '@playwright/test';

test('익명 인증 테스트', async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 브라우저에서 익명 로그인 시도
    const authResult = await page.evaluate(async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(
            'https://aekcjzxxjczqibxkoakg.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2Nqenh4amN6cWlieGtvYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTU0MzgsImV4cCI6MjA3OTEzMTQzOH0.QInfpxDWboilFrKiWzqXU-QdRa-9cJT0Ch7_ygEK7mw'
        );

        try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) {
                return { success: false, error: error.message };
            }
            return {
                success: true,
                userId: data.user?.id,
                session: !!data.session
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    console.log('[AUTH TEST] Result:', JSON.stringify(authResult, null, 2));
    expect(authResult.success).toBe(true);
    expect(authResult.userId).toBeDefined();
});
