# TODO

## 🔴 CI 타협 항목 정식 해결

### 1. CI용 테스트 인증 구현 (~30분)

> smoke/a11y `test.skip`의 근본 원인은 `RequireAuth(isProfileComplete)` 가드.
> CI에서 프로필 없이 `/category-select` 등 보호된 라우트에 접근 시
> `/my-page`로 리다이렉트되어 테스트 실패.
> ※ `useMyPageStats`의 RPC 에러 핸들링은 이미 정상 구현됨 (무한 재시도 아님)

- [ ] CI용 테스트 계정 생성 또는 E2E 테스트 내 mock 인증 구현
- [ ] `smoke.spec.ts` — `test.skip(CI)` 제거
- [ ] `accessibility.spec.ts` — `test.skip(CI)` 제거
- [ ] `ci.yml` Layout Deep Scan — `continue-on-error` 제거

### ~~2. A11y `/settings` 라우트 수정~~ ✅ 완료

- [x] `/settings` → `/my-page`로 수정 (실제 라우트와 일치)

### 3. VRT 기준 이미지 갱신 (~10분)

- [ ] CI 아티팩트에서 Linux 기준 스크린샷 다운로드
- [ ] `tests/e2e/visual-regression.spec.ts-snapshots/`에 교체
- [ ] `maxDiffPixelRatio: 0.05` → `0.01`로 복원

---

## 🟡 코드 품질 (validate 경고)

- [ ] `src/utils/challenge.ts:62` — `any` 타입 제거
- [ ] `src/pages/MyPage.tsx:102` — `any` 타입 제거
- [ ] `src/pages/QuizPage.tsx:427` — useCallback 의존성 배열에 `searchParams` 추가
- [ ] `src/components/SegmentedControl.tsx` — Object Injection Sink 경고 해결
- [ ] `src/utils/MathProblemGenerator.ts:448` — Object Injection Sink 경고 해결
- [ ] `src/utils/LogicProblemGenerator.ts:31,180,181` — Object Injection Sink 경고 해결

---

## 🟢 기타

- [ ] `get_user_game_stats` RPC 함수 — Supabase에 생성 또는 앱에서 호출 제거
- [ ] Lighthouse 성능 임계값 `0.6` → 점진적으로 `0.7`로 복원
- [ ] `StaminaGauge.tsx` — CSS inline 스타일을 외부 CSS로 이동
- [ ] `Header.css` — `-webkit-backdrop-filter` 추가 (Safari 호환)
