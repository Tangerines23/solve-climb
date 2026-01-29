import { chromium } from '@playwright/test';

/**
 * Memory Leak Detector
 * 반복적인 UI 동작(모달 열기/닫기 등) 후 DOM 노드 수가
 * 기준치(Baseline)로 돌아오는지 확인하여 메모리 누수를 감지합니다.
 */

async function checkMemoryLeaks() {
  console.log('🧠 Starting Memory Leak Detection...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173'); // 로컬 개발 서버 기준
    await page.waitForLoadState('networkidle');

    // 1. Baseline 측정
    const getDOMNodeCount = () => page.evaluate(() => document.querySelectorAll('*').length);
    const baselineNodes = await getDOMNodeCount();
    console.log(`[LEAK] Baseline DOM Nodes: ${baselineNodes}`);

    // 2. 반복 작업 수행 (예: 모달 열기/닫기 또는 페이지 전환)
    const ITERATIONS = 10;
    console.log(`[LEAK] Performing ${ITERATIONS} iterations of Modal/Action stress...`);

    for (let i = 0; i < ITERATIONS; i++) {
      // "+" 버튼 클릭 (모달 오픈 시나리오)
      const plusBtn = page.locator('button:has-text("+")').first();
      if (await plusBtn.isVisible()) {
        await plusBtn.click();
        await page.waitForTimeout(300);

        // 닫기 버튼 또는 바깥 클릭 (모달 닫기)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // 3. GC 대기 및 최종 측정
    console.log('[LEAK] Waiting for cleanup...');
    await page.waitForTimeout(2000);

    const finalNodes = await getDOMNodeCount();
    const growth = finalNodes - baselineNodes;

    console.log(`[LEAK] Final DOM Nodes: ${finalNodes} (Growth: ${growth})`);

    // 허용 오차 (일부 프레임워크나 내부 캐싱으로 인한 미세한 증가는 허용)
    const TOLERANCE = 50;
    if (growth > TOLERANCE) {
      console.error(`❌ Potential Memory Leak Detected! DOM nodes grew by ${growth}.`);
      process.exit(1);
    } else {
      console.log('✅ Memory Leak Check Passed. DOM nodes are stable.');
    }
  } catch (error) {
    console.error('❌ Error during memory leak check:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkMemoryLeaks();
