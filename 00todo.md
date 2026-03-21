# TODO (Solve & Climb Master Checklist)

## 🔴 최우선 기술 부채 (CI/검증 안정화)

### 1. CI용 테스트 인증 구현

- [x] CI용 테스트 계정 생성 또는 E2E 테스트 내 mock 인증 구현 (VITE_CI 활용)
- [x] `smoke.spec.ts` — `test.skip(CI)` 제거
- [x] `accessibility.spec.ts` — `test.skip(CI)` 제거
- [x] `ci.yml` Layout Deep Scan — `continue-on-error` 제거

### 2. VRT 기준 이미지 갱신

- [x] CI 아티팩트에서 Linux 기준 스크린샷 다운로드 및 `tests/e2e/visual-regression.spec.ts-snapshots/` 교체
- [x] `maxDiffPixelRatio: 0.05` → `0.01`로 복원

### 3. 코드 품질 (validate 경고)

- [x] `src/utils/challenge.ts` — `any` 타입 제거
- [x] `src/pages/MyPage.tsx` — `any` 타입 제거 및 useCallback 의존성 정리
- [x] `src/utils/MathProblemGenerator.ts` — Object Injection Sink 해결
- [x] `src/utils/LogicProblemGenerator.ts` — Object Injection Sink 해결
- [x] `src/components/SegmentedControl.tsx` — ARIA 속성 및 인라인 스타일 수정
- [x] `src/components/StaminaGauge.tsx` — 인라인 스타일 외부 CSS 이관

---

## 🟡 기능 보완 및 확장 (Feature Roadmap)

### 1. 퀴즈 콘텐츠 및 생성기 확장

- [ ] **Logic/Common Sense**: 문제 데이터 구축 (DB 또는 로컬 JSON)
- [ ] **World Expansion**: World 2(도형), 3(확률), 4(공학) 생성기 로직 고도화 (현재 스켈레톤 상태)

### 2. 유저 통계 및 마이페이지

- [ ] `user_statistics` DB 구현 (총 플레이, 승률, 연승 등)
- [ ] 마이페이지 '기본 정보' 외 '기록(History)' 탭 UI 구현
- [ ] `get_user_game_stats` RPC 함수 Supabase 연동 확인

### 3. 레이아웃 및 UX 수정

- [x] `Header.css` — `-webkit-backdrop-filter` 추가 (Safari 호환)
- [x] 모바일 환경 오버플로우 전수 조사 (Visual Guardian 로그 참고)

---

## 🟢 운영 및 출시 준비 (Compliance)

- [x] **Account Deletion**: '회원 탈퇴' 기능 구현 (스토어 필수)
- [x] **Legal**: `PRIVACY_POLICY.md` 내용을 기반으로 실제 인앱 페이지 구현
- [ ] **AdMob**: 테스트 ID를 실제 서비스 ID로 전환
