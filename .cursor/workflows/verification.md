---
description: 코드 변경 후 전체 검증 파이프라인 실행 프로세스
---

이 워크플로우는 작업 완료 시 또는 PR 생성 전에 전체 프로젝트의 무결성과 품질을 검증하기 위한 표준 절차입니다.

### 0단계: 사전 준비
- 개발 서버가 실행 중이어야 합니다 (레이아웃 체크에 필요): `npm run dev`

### 1단계: 정적 분석 (Static Analysis)
// turbo
1. 타입 체크: `npm run type-check`
// turbo
2. 린트: `npm run lint`
// turbo
3. 코드 포맷: `npm run format:check`

### 2단계: 코드 무결성 검사 (Code Integrity)
// turbo
1. 통합 무결성 검사: `npm run check:integrity`
   - 맞춤법 오류, CSS 하드코딩, 매직 스트링 검출
// turbo
2. 데드 코드 탐지: `npm run diet`
   - 미사용 파일, 미사용 exports, 미사용 의존성 확인

### 3단계: 레이아웃 검증 (Layout Verification)
// turbo
1. 심층 레이아웃 분석: `npm run check:layout:deep`
   - 모든 페이지의 모든 뷰포트(모바일, 태블릿, 데스크탑)에서 오버플로우 탐지
   - 100% clean이 아니면 `/layout-fix` 워크플로우 참조

### 4단계: 로직 검증 (Logic Verification)
// turbo
1. 단위 테스트: `npm run test:all`
   - Vitest로 모든 단위/통합 테스트 실행
2. (선택) Mutation Testing: 수동으로 핵심 로직을 고장 내어 테스트가 감지하는지 확인

### 5단계: E2E 및 시각적 검증 (E2E & Visual)
// turbo
1. E2E 테스트: `npm run test:e2e`
   - Playwright로 전체 사용자 흐름 테스트
2. 시각적 회귀 테스트 (스냅샷 존재 시):
   `npx playwright test tests/e2e/visual.spec.ts`

### 6단계: DB 검증 (Supabase 관련 변경 시)
// turbo
1. DB 린트: `npm run check:db:lint`
// turbo
2. DB 밸리데이션: `npm run check:db:validation`

### 완료 기준
- 모든 단계의 검사가 에러 없이 통과해야 합니다.
- 경고(Warning)는 가능한 해결하되, 필수는 아닙니다.
- 결과를 `walkthrough.md`에 요약합니다.
