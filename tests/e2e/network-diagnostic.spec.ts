import { test, expect } from '@playwright/test';

test('브라우저에서 Supabase 연결이 가능한지 확인', async ({ page }) => {
  await page.goto('/');

  const env = {
    url: process.env.VITE_SUPABASE_URL || '',
    key: process.env.VITE_SUPABASE_ANON_KEY || '',
  };

  const result = await page.evaluate(async ({ url, key }) => {
    const fetchUrl = `${url}/rest/v1/profiles?select=id&limit=1`;
    try {
      const resp = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      return {
        status: resp.status,
        ok: resp.ok,
        json: await resp.json(),
      };
    } catch (e: unknown) {
      return {
        error: (e as Error).message,
        stack: (e as Error).stack,
      };
    }
  }, env);

  console.log('[DIAGNOSTIC] Result:', JSON.stringify(result, null, 2));
  expect(result.error).toBeUndefined();
});
