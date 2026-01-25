import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 접근성 테스트 (WCAG 2.2)
 * axe-core를 사용하여 웹 접근성 표준 준수 여부를 자동으로 검증합니다.
 */

const pages = [
    { name: 'Home', path: '/' },
    { name: 'Game Select', path: '/select' },
    { name: 'Game Play', path: '/game' },
    { name: 'Profile', path: '/profile' },
    { name: 'Ranking', path: '/ranking' },
];

test.describe('접근성 테스트 (Accessibility)', () => {
    for (const page of pages) {
        test(`${page.name} 페이지 접근성`, async ({ page: browserPage }) => {
            // 페이지 이동
            await browserPage.goto(page.path);

            // 페이지 로드 대기
            await browserPage.waitForLoadState('networkidle');

            // axe-core로 접근성 검사
            const results = await new AxeBuilder({ page: browserPage })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
                .analyze();

            // 위반 사항 출력
            if (results.violations.length > 0) {
                console.log(`\n❌ ${page.name} 페이지 접근성 위반 사항:`);
                results.violations.forEach((violation) => {
                    console.log(`\n- ${violation.id}: ${violation.description}`);
                    console.log(`  영향: ${violation.impact}`);
                    console.log(`  도움말: ${violation.helpUrl}`);
                });
            }

            // 위반 사항이 없어야 함
            expect(results.violations).toEqual([]);
        });
    }
});

test.describe('접근성 테스트 - 개별 컴포넌트', () => {
    test('버튼 접근성', async ({ page }) => {
        await page.goto('/');

        const results = await new AxeBuilder({ page })
            .include('button')
            .analyze();

        expect(results.violations).toEqual([]);
    });

    test('이미지 대체 텍스트', async ({ page }) => {
        await page.goto('/');

        const results = await new AxeBuilder({ page })
            .include('img')
            .analyze();

        expect(results.violations).toEqual([]);
    });

    test('폼 요소 접근성', async ({ page }) => {
        await page.goto('/profile');

        const results = await new AxeBuilder({ page })
            .include('form, input, select, textarea')
            .analyze();

        expect(results.violations).toEqual([]);
    });
});
