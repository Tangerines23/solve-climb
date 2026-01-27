# Solve-Climb 전체 검증 시스템 (Full-Stack Validation)

이 문서는 프로젝트의 품질을 보장하는 **어플리케이션 계층**과 **데이터베이스 계층**의 모든 검증 시스템을 설명합니다.

---

## 🏗️ 1부: 어플리케이션 검증 (Application Layer)
**"코드가 올바르게 작성되었고 작동하는가?"**
CI/CD 파이프라인(`ci.yml`)과 로컬 개발 환경에서 실행되는 테스트들입니다.

### A. 정적 분석 (Static Analysis)
코드를 실행하지 않고 문법과 스타일을 검사합니다.
- **Type Check** (`npm run type-check`): TypeScript 타입 오류 검사.
- **Linting** (`npm run lint`): 코드 스타일 및 잠재적 버그 패턴 검사 (ESLint).
- **Formatting** (`npm run format:check`): 코드 포맷팅 준수 여부 (Prettier).
- **Hardcoded Values** (`npm run check:css`): CSS 내 하드코딩된 값(매직 넘버) 사용 감시.
- **Navigation Paths** (`npm run check:nav`): 라우팅 경로 오타 및 깨진 링크 감시.

### B. 동적 테스트 (Dynamic Testing)
실제 코드를 실행하여 기능을 검증합니다.
- **Unit/Integration Test** (`npm run test`): 유틸리티 함수, 컴포넌트, 훅 단위 테스트 (Vitest).
- **E2E/Accessibility** (`npm run test:e2e`, `test:a11y`): 사용자 시나리오 및 웹 접근성 테스트 (Playwright).
- **Bundle Size** (`npm run check:size`): 빌드 용량이 기준치를 초과하지 않는지 감시.
- **Security Audit** (`npm run check:security`): 라이브러리 취약점(CVE) 검사.
25: 
26: ### C. 성능 및 구조 무결성 (Performance & Structure Integrity) 🌟
27: - **Circular Dependency** (`npm run check:circular`): 무한 루프를 유발하는 순환 참조 방지 (Madge).
28: - **Dead Code** (`npm run diet`): 사용되지 않는 파일 및 export 제거 (Knip Strict).
29: - **Performance Budget** (`npm run check:score`): 초기 로딩 속도(LCP) 80점 미만 시 배포 차단 (Lighthouse).
30: - **Logic Leash** (`npm run check:logic`): 문제 생성(50ms) 및 점수 계산(30ms) 지연 시 배포 차단.
31: 
32: ### D. 보안 쉴드 (Security Shield) 🛡️
33: - **Secret Scanner** (`npm run check:secrets`): 코드 내 비밀키(`sbp_`, `sk_live_`, `JWT`) 유출 감지.
34: - **Security Linter** (`npm run lint`): `eslint-plugin-security`를 통한 보안 취약 코드 패턴 감지.

### E. 코드 무결성 (Code Integrity) 🧹
- **Spell Checker** (`npm run check:spell`): `cspell`을 사용해 오타(Typos)를 실시간으로 감지.
- **Magic String Hunter** (`npm run check:magic`): 3회 이상 반복되는 하드코딩된 문자열 감지 (상수화 유도).
- **Hardcoded Value Check** (`npm run check:css`): CSS 내 매직 넘버/색상 감지.

---

## 🏛️ 2부: 데이터베이스 검증 (Database Layer)
**"데이터가 무결하고 안전하게 저장되는가?"**
`npm run check:db:validation` 명령어로 실행되는 16가지 심층 검사입니다.

### C. 데이터 무결성 (Basic & Logic Integrity)
- **기본 제약**: 미네랄 음수 방지, 스태미나 범위(0-10), 아이템 수량 양수 유지, 티어 레벨(0-100) 준수.
- **논리 제약**: 만료된 세션, 고아 아이템, 중복 아이템, 미래 타임스탬프, 점수 음수/핵 등 감지.

### D. 시스템 안정성 (System Stability)
- **Smoke Test**: `get_ranking_v2` 등 핵심 RPC 함수 실행 확인.
- **JSON Integrity**: 게임 결과(`result`) 및 문제지(`questions`) JSON 데이터 유실 감지.

### E. 비즈니스 로직 (Business Logic) 🌟
- **Mastery Sync**: `total_mastery_score`가 개별 레벨 최고기록(`best_score`)의 합과 일치하는지 전수 검증.

### F. 보안 및 성능 (Security & Performance)
- **Security Check**: 모든 테이블(파티션 포함)의 RLS(Row Level Security) 활성화 여부.
- **Performance Check**: 외래 키(Foreign Key) 인덱스 누락 감시.

---

## 🚀 검증 실행 가이드

### 전체 검증 (Full Validation)
```bash
# 코드부터 DB까지 싹 다 검사 (배포 전 필수)
npm run validate:full
```

### 부분 검증
```bash
# 빠른 코드 검사 (커밋 전 추천)
npm run validate:fast

# DB 상태 정밀 건강검진
npm run check:db:validation
```
