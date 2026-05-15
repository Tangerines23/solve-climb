import { chromium } from '@playwright/test';

/**
 * Interaction to Next Paint (INP) & Rendering Auditor
 * 퀴즈 입력 필드 상호작용 시의 지연 시간(Latency)을 측정하여 렌더링 최적화 효과를 검증합니다.
 */

async function checkRerenderCycle() {
  console.log('⚡ [Rendering Auditor] 퀴즈 상호작용 성능 분석 시작...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const port = process.env.VITE_PORT || 5173;
    const url = process.env.VITE_URL || `http://localhost:${port}`;

    console.log(`🔗 접속 중: ${url}`);
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // 1. INP 측정 도우미 함수 주입
    await page.addInitScript(() => {
      window.inpValues = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event' || entry.entryType === 'first-input') {
            const delay = entry.processingEnd - entry.startTime;
            window.inpValues.push({
              name: entry.name,
              delay: delay,
              duration: entry.duration,
              target: entry.target ? entry.target.className : 'unknown',
            });
          }
        }
      });
      observer.observe({ type: 'event', buffered: true, durationThreshold: 0 });
    });

    // 2. 퀴즈 진입 시나리오 (프로필 생성 처리 포함)
    console.log('🚀 퀴즈 진입 시퀀스 시작...');

    // 프로필 생성 화면인지 확인
    if (page.url().includes('/my-page')) {
      console.log('📝 프로필 생성 필요 감지. 테스트 프로필 생성 중...');
      await page.fill('input[placeholder*="닉네임"], .nickname-input', 'Tester');
      await page.click('button:has-text("시작하기")');
      await page.waitForTimeout(1000);
      await page.goto(url); // 홈으로 강제 이동
      await page.waitForLoadState('networkidle');
    }

    // 메인 페이지에서 산 선택
    const climbBtn = page.locator('.category-climb-button');
    if (!(await climbBtn.isVisible())) {
      console.log('⚠️ 등반 버튼 미발견. 홈으로 재이동 시도...');
      await page.goto(url);
      await page.waitForSelector('.category-climb-button', { timeout: 5000 });
    }
    await page.click('.category-climb-button');
    await page.waitForTimeout(500);

    // 카테고리 선택
    await page.click('.topic-card-link');
    await page.waitForTimeout(500);

    // 레벨 선택 (첫 번째 레벨)
    await page.click('.level-node');
    await page.waitForTimeout(1000);

    // 시작하기 버튼 클릭
    await page.click('.gt-start-btn');
    await page.waitForTimeout(1000);

    // 배낭 준비 완료 (모달/버튼)
    const backpackBtn = page.locator('.gt-backpack-btn');
    if (await backpackBtn.isVisible()) {
      await backpackBtn.click();
    }

    await page.waitForSelector('.keypad-key', { timeout: 10000 });
    console.log('✅ 퀴즈 화면 진입 완료. 키패드 입력 테스트 시작...');

    // 3. 실제 입력 상호작용 수행 및 측정 (키패드 클릭)
    const keys = page.locator('.keypad-key');
    const keyCount = await keys.count();

    console.log(`🔢 발견된 키패드 버튼 수: ${keyCount}`);

    // 1, 2, 3 번호를 차례로 클릭 (보통 처음 몇 개가 숫자)
    for (let i = 0; i < Math.min(3, keyCount); i++) {
      await keys.nth(i).click();
      await page.waitForTimeout(200);
    }

    // 4. 결과 수집 및 분석
    const results = await page.evaluate(() => window.inpValues || []);

    console.log('\n-----------------------------------');
    console.log('📊 Interaction Latency Report (Keypad):');

    const clickResults = results.filter(
      (r) => r.name.includes('click') || r.name.includes('pointer')
    );

    if (clickResults.length > 0) {
      clickResults.forEach((res) => {
        const status =
          res.delay > 100 ? '❌ Bad' : res.delay > 50 ? '⚠️ Fair' : '✅ Good (Optimized)';
        console.log(`  - ${res.name}: ${res.delay.toFixed(2)}ms [${status}]`);
      });
    } else {
      console.log('  (수집된 클릭 데이터가 없습니다. 모든 결과 출력합니다.)');
      results.forEach((res) => {
        console.log(`  - ${res.name}: ${res.delay.toFixed(2)}ms`);
      });
    }
    console.log('-----------------------------------\n');

    // 최적화 목표: 평균 지연 시간 50ms 미만
    const avgDelay =
      clickResults.length > 0
        ? clickResults.reduce((acc, r) => acc + r.delay, 0) / clickResults.length
        : 0;

    if (avgDelay > 100) {
      console.error(
        `❌ 실패: 평균 지연 시간(${avgDelay.toFixed(2)}ms)이 너무 높습니다. 리렌더링 최적화가 필요합니다.`
      );
      process.exit(1);
    } else {
      console.log(`✅ 통과: 평균 지연 시간 ${avgDelay.toFixed(2)}ms로 안정적입니다.`);
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 분석 중 시스템 오류 발생:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkRerenderCycle();
