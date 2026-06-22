import { test } from '@playwright/test';
import path from 'path';

test('capture world transition screenshots', async ({ page }) => {
  // 모바일 뷰포트 크기로 설정
  await page.setViewportSize({ width: 393, height: 851 });

  const outputDir = `C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f`;

  // 1. 레벨 선택 페이지로 진입 (World 1)
  const initialUrl = '/level-select?mountain=math&world=World1&category=%EA%B8%B0%EC%B5%88';
  console.log(`Navigating to: ${initialUrl}`);
  await page.goto(initialUrl, { waitUntil: 'networkidle', timeout: 30000 });

  // 로딩 및 애니메이션 완료 대기
  await page.waitForTimeout(2000);
  const p1 = path.join(outputDir, 'world1_initial.png');
  await page.screenshot({ path: p1 });
  console.log(`Captured World 1 to: ${p1}`);

  // 2. 다음 월드 버튼(World2 - 확률과 통계) 클릭
  console.log('Clicking next world button (to World 2)...');
  await page.click('.world-switch-btn.next');

  // 시트 내려가고 + 텍스트 바뀌고 + 시트 올라오기 완료할 수 있게 대기
  await page.waitForTimeout(2000);
  const p2 = path.join(outputDir, 'world2_switched.png');
  await page.screenshot({ path: p2 });
  console.log(`Captured World 2 to: ${p2}`);

  // 3. 다음 월드 버튼(World3 - 도형과 공간) 클릭
  console.log('Clicking next world button (to World 3)...');
  await page.click('.world-switch-btn.next');

  await page.waitForTimeout(2000);
  const p3 = path.join(outputDir, 'world3_switched.png');
  await page.screenshot({ path: p3 });
  console.log(`Captured World 3 to: ${p3}`);

  // 4. 다음 월드 버튼(World4 - 공학 및 응용) 클릭
  console.log('Clicking next world button (to World 4)...');
  await page.click('.world-switch-btn.next');

  await page.waitForTimeout(2000);
  const p4 = path.join(outputDir, 'world4_switched.png');
  await page.screenshot({ path: p4 });
  console.log(`Captured World 4 to: ${p4}`);
});
