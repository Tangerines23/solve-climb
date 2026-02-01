---
description: 레이아웃 오버플로우 및 UI 깨짐 문제 수정 프로세스
---

이 워크플로우는 레이아웃 버그를 수정할 때 AI 에이전트가 따라야 할 표준 절차입니다.

### 1단계: 문제 재현 및 확인
1. 개발 서버를 실행합니다: `npm run dev`
2. 브라우저 도구를 통해 문제가 되는 페이지로 이동합니다.
3. 해당 페이지에서 어떤 요소가 넘치거나 잘리는지 확인합니다.

### 2단계: 레이아웃 스크립트 분석
// turbo
1. 심층 레이아웃 분석을 실행합니다: `npm run check:layout:deep`
2. 출력 결과에서 `⚠` 또는 `OVERFLOW` 표시를 찾아 문제 요소를 식별합니다.
3. 해당 요소의 CSS 파일을 찾아 읽습니다.

### 3단계: CSS 수정
1. 문제가 되는 CSS 클래스를 수정합니다.
   - **일반적인 해결책:**
     - `overflow-x: hidden` 추가
     - `width: 100vw` → `width: 100%` 변경
     - `box-sizing: border-box` 추가
     - `max-width: 100%` 추가
2. 구조적 문제인 경우 `PageLayout` 컴포넌트 도입을 고려합니다.

### 4단계: 검증
// turbo
1. 변경 후 레이아웃 스크립트를 다시 실행합니다: `npm run check:layout:deep`
2. 해당 페이지가 100% clean 보고인지 확인합니다.

### 5단계: 시각적 회귀 테스트 (선택 사항)
1. 스냅샷이 존재하는 경우, 시각적 테스트를 실행합니다:
   `npx playwright test tests/e2e/visual.spec.ts`
2. 새로운 스냅샷이 필요하면 업데이트합니다:
   `npx playwright test --update-snapshots`
