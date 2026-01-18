import { test, expect } from '@playwright/test';

test('브라우저에서 Supabase 연결이 가능한지 확인', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
        const url = 'https://aekcjzxxjczqibxkoakg.supabase.co/rest/v1/profiles?select=id&limit=1';
        const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2Nqenh4amN6cWlieGtvYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTU0MzgsImV4cCI6MjA3OTEzMTQzOH0.QInfpxDWboilFrKiWzqXU-QdRa-9cJT0Ch7_ygEK7mw';
        try {
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': apikey,
                    'Authorization': `Bearer ${apikey}`
                }
            });
            return {
                status: resp.status,
                ok: resp.ok,
                json: await resp.json()
            };
        } catch (e: any) {
            return {
                error: e.message,
                stack: e.stack
            };
        }
    });

    console.log('[DIAGNOSTIC] Result:', JSON.stringify(result, null, 2));
    expect(result.error).toBeUndefined();
});
