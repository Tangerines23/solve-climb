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
                const tag = await el.evaluate(node => node.tagName.toLowerCase());
                const classes = await el.evaluate(node => node.className);
                const text = await el.innerText();
                const overflowType = await el.getAttribute('title'); // VisualGuardian sets title with details
                return `\nDETAILS:\n- Element: <${tag} class="${classes}">\n- Type: ${overflowType}\n- Content: "${text.substring(0, 50).replace(/\n/g, ' ')}..."`;
            })
        );

        const errorMessage = `🚨 [UI Overflow Detected] Found ${overflowElements.length} elements with layout overflow:\n${errorDetails.join('\n')}\n` +
            `💡 Check screenshot or browser devtools for elements with red dashed outlines.`;

        console.log(errorMessage); // Ensure visibility in stdout
        throw new Error(errorMessage);
    }
}
