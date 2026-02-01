# CI 로컬 테스트 가이드

## 🚀 푸시 전 한 번에 확인 (권장)

```bash
npm run ci:local
```

CI와 **같은 순서**로 validate → unit-test → security audit → build → e2e-critical 을 로컬에서 실행합니다.  
한 단계라도 실패하면 중단되므로, **전부 통과한 뒤에 푸시**하면 CI 실패 가능성을 줄일 수 있습니다.

- **로컬과 다른 점**: DB Lint(supabase link), Linux 스냅샷, CI 전용 Secrets/네트워크는 이 스크립트로 검증되지 않습니다. 필요하면 아래 단계별 명령으로 따로 실행하세요.

---

## ✅ 로컬에서 CI와 동일하게 테스트 가능한 항목

### 1. Validate Job (코드 품질 검증)

```bash
# CI validate job과 동일
npm run validate
```

**포함 항목**:
- ✅ `type-check` - TypeScript 타입 체크
- ✅ `lint` - ESLint 검사
- ✅ `format:check` - Prettier 포맷 체크
- ✅ `check:secrets` - 보안 키 검사
- ✅ `check:circular` - 순환 참조 검사
- ✅ `check:integrity` - 오타, 매직스트링, CSS, 네비게이션
- ✅ `check:logic` - 로직 성능 검사

**추가 항목** (CI에는 있지만 validate 스크립트에는 없음):
- ⚠️ `test:bench` - 벤치마크 테스트 (CI에만 있음)

### 2. Unit Test Job

```bash
# CI unit-test job과 동일
npm run test:all
```

### 3. Security & DB Job

```bash
# 보안 감사
npm run check:security

# DB 검증 (환경 변수 필요)
npm run check:db:validation

# DB Lint (Supabase 연결 필요)
# CI에서는 자동으로 project-ref 추출하지만 로컬에서는 수동 설정 필요
npx supabase link --project-ref <PROJECT_REF> --password <PASSWORD>
npx supabase db lint --linked --fail-on error
```

### 4. Build Job

```bash
# CI build job과 동일
npm run build
```

### 5. E2E Tests (빌드 필요)

```bash
# E2E 안정성 테스트
npm run test:chaos
npm run test:stress:deep

# E2E & Visual 테스트
npm run test:e2e
npm run test:visual

# 레이아웃 Deep 검사
npm run check:layout:deep
```

### 6. Performance Audit (빌드 필요)

```bash
# 먼저 빌드 필요
npm run build

# 번들 사이즈 체크
npm run check:size

# Lighthouse 점수 체크
npm run check:score
```

---

## 🔧 CI와 완전히 동일하게 테스트하는 방법

### 옵션 1: 단계별 실행 (권장)

```bash
# 1. Validate (에러 2개 발견됨)
npm run validate

# 2. Unit Tests
npm run test:all

# 3. Security
npm run check:security

# 4. Build
npm run build

# 5. E2E Tests (빌드 후)
npm run test:e2e
npm run test:visual
npm run test:chaos
npm run test:stress:deep

# 6. Performance (빌드 후)
npm run check:size
npm run check:score
```

### 옵션 2: 통합 스크립트 생성

`package.json`에 추가할 수 있는 스크립트:

```json
"test:ci": "npm run validate && npm run test:all && npm run check:security && npm run build",
"test:ci:full": "npm run test:ci && npm run test:e2e && npm run test:visual && npm run check:size && npm run check:score"
```

---

## ⚠️ 현재 발견된 문제

### 에러 (CI 실패 원인)
1. `scripts/check-layout-standalone.js:30` - 미사용 변수 `e`

### 경고 (193개)
- TypeScript any 타입: 20개
- React Hooks 의존성: 6개
- Object Injection: 150개
- 기타 보안: 2개

---

## 🎯 로컬에서 CI 문제 재현하기

### 1단계: Validate 실행 (현재 실패 중)

```bash
npm run validate
```

**결과**: ❌ 에러 2개로 인해 실패
- `scripts/check-layout-standalone.js:30` - 미사용 변수

### 2단계: 에러 수정 후 재실행

```bash
# 에러 수정 후
npm run validate
```

### 3단계: 전체 CI 테스트

```bash
# validate 통과 후
npm run test:all
npm run build
```

---

## 📋 CI Job별 로컬 테스트 체크리스트

### ✅ Job 1: setup
- 로컬에서는 `npm install`로 대체
- **테스트**: `npm install --legacy-peer-deps`

### ✅ Job 2: validate
- **테스트**: `npm run validate`
- **현재 상태**: ❌ 실패 (에러 2개)

### ✅ Job 3: unit-test
- **테스트**: `npm run test:all`
- **환경 변수 필요**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### ⚠️ Job 4: security-db
- **테스트**: 
  - `npm run check:security` ✅
  - `npm run check:db:validation` ⚠️ (환경 변수 필요)
  - DB lint ⚠️ (Supabase 연결 필요)

### ✅ Job 5: build
- **테스트**: `npm run build`

### ⚠️ Job 6: e2e-stability-test
- **테스트**: `npm run test:chaos && npm run test:stress:deep`
- **전제 조건**: 빌드 완료, Playwright 설치, 환경 변수

### ⚠️ Job 7: e2e-visual-layout
- **테스트**: `npm run test:e2e && npm run test:visual && npm run check:layout:deep`
- **전제 조건**: 빌드 완료, Playwright 설치, 환경 변수

### ⚠️ Job 8: performance-audit
- **테스트**: `npm run check:size && npm run check:score`
- **전제 조건**: 빌드 완료 (`dist` 폴더 필요)

---

## 🚀 빠른 CI 문제 확인 방법

### 최소 검증 (가장 빠름)

```bash
# CI에서 가장 먼저 실패하는 부분
npm run validate
```

### 기본 검증 (권장)

```bash
# validate + test + build
npm run validate && npm run test:all && npm run build
```

### 전체 검증 (CI와 동일)

```bash
# 모든 CI job 실행 (시간 소요)
npm run validate && \
npm run test:all && \
npm run check:security && \
npm run build && \
npm run test:e2e && \
npm run test:visual && \
npm run check:size && \
npm run check:score
```

---

## 💡 현재 상황 요약

**질문**: "지금 테스트로 모든 문제를 확인할 수 있어?"

**답변**: 
- ✅ **대부분 확인 가능**: validate, test, build, e2e 테스트 등
- ⚠️ **일부 제한**: DB lint는 Supabase 연결 필요
- ✅ **현재 문제**: `npm run validate` 실행 시 에러 2개 발견
- ✅ **즉시 수정 가능**: `scripts/check-layout-standalone.js`의 미사용 변수 수정

**다음 단계**:
1. 에러 수정 (그룹 1)
2. `npm run validate` 재실행
3. 통과하면 `npm run test:all` 실행
4. 통과하면 `npm run build` 실행
