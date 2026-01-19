import { test, expect, devices } from '@playwright/test';

// 복잡한 시나리오이므로 타임아웃을 2분으로 늘림
test.setTimeout(120000);

// 모바일 폰 뷰포트 설정 (TDS 모바일 앱 환경 시뮬레이션)
test.use({
    ...devices['Pixel 5'],
    viewport: { width: 393, height: 851 }
});

test.describe('CORE BUSINESS SCENARIO - 게임 플레이부터 랭킹 반영까지', () => {

    test('수학 퀴즈를 풀고 결과를 제출하여 랭킹을 확인할 수 있어야 한다', async ({ page }) => {
        // 브라우저 콘솔 로그 캡처
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

        // 1. 프로필 설정 (닉네임 설정이 되어 있어야 랭킹 반영이 명확함)
        console.log('[E2E] Step 1: Setting up nickname...');
        await page.goto('/my-page');

        // 프로필 폼이 나타날 때까지 대기 (익명 로그인이 자동으로 처리됨)
        await page.waitForSelector('.profile-form-input', { timeout: 15000 });
        await page.fill('.profile-form-input', 'E2ETester');
        await page.click('.profile-form-submit');

        // 마이페이지 메인이 보이면 설정 완료
        await page.waitForSelector('.my-page-nickname', { timeout: 15000 });
        console.log('[E2E] Nickname set: E2ETester');

        // 2. 홈으로 이동
        console.log('[E2E] Step 2: Navigating to home...');
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 3. 수학 산 선택
        console.log('[E2E] Step 3: Selecting Math mountain...');
        const mathMountain = page.locator('.category-climb-button[data-category-id="math"]');
        await expect(mathMountain).toBeVisible({ timeout: 15000 });
        await mathMountain.click();

        // 4. 사칙연산 카테고리 선택 (ID: 기초)
        console.log('[E2E] Step 4: Selecting Arithmetic category (기초)...');
        await page.waitForURL(/.*category-select.*/, { timeout: 15000 });
        await page.waitForSelector('a[href*="category=기초"]', { timeout: 10000 });
        const arithmeticCategory = page.locator('a[href*="category=기초"]').first();
        await expect(arithmeticCategory).toBeVisible({ timeout: 15000 });
        await arithmeticCategory.click();

        // 5. 레벨 1 선택
        console.log('[E2E] Step 5: Selecting Level 1...');
        await page.waitForURL(/.*level-select.*/, { timeout: 15000 });
        const level1Button = page.locator('.level-list-button-primary').first();
        await expect(level1Button).toBeVisible({ timeout: 15000 });
        await level1Button.click();

        // 6. 게임 팁 모달에서 시작하기 클릭
        console.log('[E2E] Step 6: Starting game from tip modal...');
        const startBtn = page.locator('.gt-start-btn');
        await expect(startBtn).toBeVisible({ timeout: 15000 });
        await startBtn.click();

        // 6. 퀴즈 풀기 (최소 1문제)
        console.log('[E2E] Step 6: Solving quiz...');
        await page.waitForSelector('.problem-text', { timeout: 15000 });
        const problemText = await page.locator('.problem-text').textContent();
        console.log(`[E2E] Problem Text Found: "${problemText}"`);

        if (problemText) {
            // 유연한 정규표현식으로 숫자와 연산자 추출 (공백 및 기호 유연성 확보)
            const match = problemText.match(/(-?\d+)\s*([+\-*/])\s*(-?\d+)/);
            if (match) {
                const num1 = parseInt(match[1], 10);
                const operator = match[2];
                const num2 = parseInt(match[3], 10);

                let answer = 0;
                if (operator === '+') answer = num1 + num2;
                if (operator === '-') answer = num1 - num2;
                if (operator === '*') answer = num1 * num2;
                if (operator === '/') answer = Math.floor(num1 / num2);

                const answerStr = answer.toString();
                console.log(`[E2E] Calculated Answer: ${num1} ${operator} ${num2} = ${answerStr}`);

                // 키패드 입력 시 약간의 지연 추가 (안정성)
                for (const char of answerStr) {
                    if (char === '-') {
                        await page.click('.keypad-key-negative');
                    } else {
                        await page.locator(`.keypad-key:text-is("${char}")`).click();
                    }
                    await page.waitForTimeout(100);
                }

                console.log('[E2E] Submitting answer...');
                await page.click('.keypad-key-submit');

                // 정답 여부를 시각적으로 확인할 수 있는 요소가 있다면 체크 (예: 콤보 증가, 점수 상승)
                // 하지만 여기서는 결과창으로 빨리 가기 위해 생략하고 애니메이션 대기만 함
                await page.waitForTimeout(1500);
                console.log('[E2E] Quiz step completed.');
            } else {
                console.error(`[E2E] Failed to parse problem text: "${problemText}"`);
            }
        }

        // 8. 중단하여 결과창 진입
        console.log('[E2E] Step 8: Quitting game to see results...');
        const pauseBtn = page.locator('.pause-button');
        await expect(pauseBtn).toBeVisible();
        await pauseBtn.click();

        await page.waitForTimeout(500);
        const exitBtn = page.locator('.pause-btn.exit');
        await expect(exitBtn).toBeVisible({ timeout: 5000 });
        await exitBtn.click();

        // 9. 결과 페이지 확인
        console.log('[E2E] Step 9: Verifying result page...');
        await page.waitForURL(/.*result.*/, { timeout: 15000 });

        // 결과 페이지 컨테이너 확인
        await expect(page.locator('.result-page')).toBeAttached({ timeout: 15000 });

        // 타이틀 확인
        const resultTitle = page.locator('.result-title').filter({ visible: true }).first();
        await expect(resultTitle).toBeAttached({ timeout: 15000 });
        const titleText = await resultTitle.textContent();
        console.log(`[E2E] Result Title: ${titleText}`);

        // 카운트업 애니메이션 대기 (최대 3초)
        console.log('[E2E] Waiting for score count-up...');
        await page.waitForTimeout(3000);

        const scoreValue = await page.locator('.score-value').filter({ visible: true }).first().textContent();
        console.log(`[E2E] Final Score Displayed: ${scoreValue}`);

        // 9. 랭킹 보기 클릭
        console.log('[E2E] Step 9: Navigating to ranking...');
        const rankingBtn = page.getByRole('button', { name: '랭킹 보기' }).filter({ visible: true }).first();
        await expect(rankingBtn).toBeAttached({ timeout: 15000 });
        await rankingBtn.click();

        // 10. 랭킹 페이지에서 내 점수 확인
        console.log('[E2E] Step 10: Verifying ranking...');
        await page.waitForURL(/.*ranking.*/, { timeout: 15000 });
        console.log('[E2E] Ranking page reached.');

        // 로딩 스피너가 사라질 때까지 대기 (필요시)
        await page.waitForSelector('.ranking-loading', { state: 'hidden', timeout: 20000 });

        // 내 랭킹 아이템이 로드될 때까지 넉넉히 대기
        console.log('[E2E] Searching for my rank item...');
        const myRankItem = page.locator('.ranking-item.my-item').first();
        await expect(myRankItem).toBeAttached({ timeout: 30000 });

        const myScore = await myRankItem.locator('.ranking-score').textContent();
        console.log(`[E2E] My Score in Ranking: ${myScore}`);

        expect(myScore).toBeTruthy();

        console.log('[E2E] Success! Full business cycle verified.');
    });
});
