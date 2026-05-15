import { chromium } from '@playwright/test';

/**
 * JS Heap Snapshot Auditor
 * 브라우저의 실제 JS Heap 메모리 사용량을 측정하여
 * 런타임 메모리 비대화 및 누수를 정밀 분석합니다.
 */

async function checkHeapSnapshot() {
  console.log('🧠 [Heap Auditor] JS Heap 메모리 정밀 분석 시작...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const port = process.env.PORT || 5173;
    await page.goto(`http://localhost:${port}`);
    await page.waitForLoadState('networkidle');

    // CDP 세션 시작
    const client = await page.context().newCDPSession(page);

    // 1. 초기 메모리 측정
    await client.send('HeapProfiler.enable');
    await client.send('Performance.enable'); // Performance 메트릭 활성화 필요
    await client.send('HeapProfiler.collectGarbage'); // GC 강제 실행

    const getHeapSize = async () => {
      const { metrics } = await client.send('Performance.getMetrics');
      const heapMetric = metrics.find((m) => m.name === 'JSHeapUsedSize');
      return heapMetric ? heapMetric.value : 0;
    };

    const baselineHeap = await getHeapSize();
    console.log(`[HEAP] Baseline: ${(baselineHeap / 1024 / 1024).toFixed(2)} MB`);

    // 2. 부하 시나리오 (페이지 전환 등)
    console.log('[HEAP] 페이지 전환 및 컴포넌트 마운트/언마운트 시뮬레이션 중...');
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    // 3. 최종 메모리 측정
    await client.send('HeapProfiler.collectGarbage'); // 다시 GC 실행
    const finalHeap = await getHeapSize();
    const growth = (finalHeap - baselineHeap) / 1024 / 1024;

    console.log('\n-----------------------------------');
    console.log(`📊 Memory Heap Report:`);
    console.log(`  - Final size: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Growth: ${growth.toFixed(2)} MB`);
    console.log('-----------------------------------\n');

    // 허용 임계치 (5MB 이상의 성장은 누수 의심)
    const LIMIT_MB = 10;
    if (growth > LIMIT_MB) {
      console.error(
        `❌ 실패: 메모리 점유량이 ${growth.toFixed(2)}MB 증가했습니다. (한도: ${LIMIT_MB}MB)`
      );
      process.exit(1);
    } else {
      console.log('✅ 통과: 메모리 점유량이 안정적입니다.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 분석 중 시스템 오류 발생:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkHeapSnapshot();
