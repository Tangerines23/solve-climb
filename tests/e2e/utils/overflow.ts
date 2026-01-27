import { Page, expect } from '@playwright/test';

/**
 * 🕵️ UI Overflow 감지 유틸리티
 * VisualGuardian이 표시한 data-vg-overflow 속성을 기반으로 레이아웃 깨짐을 확인합니다.
 */
export async function expectNoOverflow(page: Page) {
    // VisualGuardian이 요소를 스캔할 시간을 줌 (기본 2초 주기로 스캔하므로 최대 3초 대기)
    await page.waitForTimeout(3000);

    const overflowElements = await page.locator('[data-vg-overflow="true"]').all();

    if (overflowElements.length > 0) {
        const errorDetails = await Promise.all(
            overflowElements.map(async (el) => {
                const tag = await el.evaluate(node => node.tagName);
                const text = await el.innerText();
                const overflowType = await el.getAttribute('title');
                return `- Element: ${tag}, Type: ${overflowType}, Text: "${text.substring(0, 30)}..."`;
            })
        );

        throw new Error(
            `🚨 [UI Overflow Detected] 다음 요소에서 레이아웃 넘침이 발견되었습니다:\n${errorDetails.join('\n')}\n` +
            `💡 브라우저 개발자 도구에서 해당 요소의 점선 테두리를 확인하세요.`
        );
    }
}
