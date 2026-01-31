# 프리커밋 & CI 비교 분석 및 작업 분류

## 📋 실행 흐름 비교

### 🔵 Pre-commit (로컬, 커밋 전)
```
1. check-dependency-integrity.js  (의존성 무결성)
2. type-check                      (TypeScript 타입 체크)
3. lint-staged                     (변경된 파일만 ESLint + Prettier)
4. check:integrity                 (오타, 매직스트링, CSS, 네비게이션)
5. check:secrets                   (보안 키 검사)
6. check:circular                  (순환 참조 검사)
7. check:logic                     (로직 성능, 경고만)
8. check:security                 (보안 취약점, 경고만)
9. check:layout                    (레이아웃 기본 검사)
10. check:db                       (DB 검증, 조건부 - DB 변경 시만)
```

### 🟢 CI (GitHub Actions, Push/PR 후)
```
Job 1: setup
  - 의존성 설치 및 캐싱

Job 2: validate (병렬 가능)
  - type-check
  - lint (전체 프로젝트)
  - format:check
  - check:secrets
  - check:circular
  - check:integrity
  - check:logic
  - test:bench

Job 3: unit-test (병렬 가능)
  - test:all

Job 4: security-db (병렬 가능)
  - check:security (필수)
  - DB lint
  - check:db:validation

Job 5: build (병렬 가능)
  - npm run build

Job 6: e2e-stability-test (build 필요)
  - test:chaos
  - test:stress:deep

Job 7: e2e-visual-layout (build 필요)
  - test:e2e
  - test:visual
  - check:layout:deep

Job 8: performance-audit (build 필요)
  - check:size
  - check:score
```

---

## 🔍 중복 및 차이점 분석

### ✅ 중복되는 검증 (양쪽 모두 실행)

| 검증 항목 | Pre-commit | CI | 차이점 |
|---------|-----------|-----|--------|
| **type-check** | ✅ 전체 | ✅ 전체 | 동일 |
| **lint** | ✅ 변경 파일만 (lint-staged) | ✅ 전체 프로젝트 | 범위 차이 |
| **format** | ✅ 변경 파일만 (lint-staged) | ✅ 전체 (format:check) | 범위 차이 |
| **check:secrets** | ✅ 필수 | ✅ 필수 | 동일 |
| **check:circular** | ✅ 필수 | ✅ 필수 | 동일 |
| **check:integrity** | ✅ 필수 | ✅ 필수 | 동일 |
| **check:logic** | ⚠️ 경고만 | ✅ 필수 | 엄격도 차이 |
| **check:security** | ⚠️ 경고만 | ✅ 필수 | 엄격도 차이 |
| **check:layout** | ✅ 기본 모드 | ✅ Deep 모드 | 깊이 차이 |
| **check:db** | ⚠️ 조건부 | ✅ 필수 | 조건 차이 |

### 🆕 CI만 실행하는 검증

- `format:check` (전체 프로젝트)
- `test:bench` (벤치마크 테스트)
- `test:all` (전체 단위 테스트)
- `DB lint` (Supabase DB 린트)
- `check:db:validation` (DB 검증)
- `build` (프로덕션 빌드)
- `test:e2e` (E2E 테스트)
- `test:visual` (시각적 회귀 테스트)
- `test:chaos` (카오스 테스트)
- `test:stress:deep` (네트워크 스트레스 테스트)
- `check:size` (번들 사이즈)
- `check:score` (Lighthouse 점수)

### 🆕 Pre-commit만 실행하는 검증

- `check-dependency-integrity.js` (의존성 무결성)

---

## 🎯 문제 분석 및 작업 그룹 분류

### 🔴 그룹 1: 즉시 수정 (에러 - CI 실패 원인)

**문제**: `scripts/check-layout-standalone.js:30` - 미사용 변수 `e`

**영향 범위**:
- ❌ CI `validate` job 실패
- ❌ Pre-commit 통과 가능 (해당 파일은 scripts이므로 lint-staged 대상 아님)

**독립성**: ✅ 완전 독립 (1개 파일만 수정)

**작업 내용**:
```javascript
// 현재
} catch (e) {
  // Continue to next port
}

// 수정 후
} catch {
  // Continue to next port
}
```

---

### 🟡 그룹 2: TypeScript 타입 안전성 (193개 문제 중 20개)

**문제**: `@typescript-eslint/no-explicit-any` 경고

**영향 범위**:
- ⚠️ CI `validate` job 경고 (통과는 함)
- ⚠️ Pre-commit `type-check` 통과 (경고는 무시)

**독립성**: ✅ 파일별 독립 (14개 파일, 병렬 작업 가능)

**작업 전략**: 각 파일별로 적절한 타입 정의

---

### 🟢 그룹 3: React Hooks 의존성 (6개)

**문제**: `react-hooks/exhaustive-deps` 경고

**영향 범위**:
- ⚠️ CI `validate` job 경고
- ⚠️ Pre-commit `lint-staged` 경고 (변경 파일만)

**독립성**: ✅ 파일별 독립 (5개 파일, 병렬 작업 가능)

---

### 🔵 그룹 4: 보안 경고 - Object Injection (150개)

**문제**: `security/detect-object-injection` 경고

**영향 범위**:
- ⚠️ CI `validate` job 경고 (대량)
- ⚠️ Pre-commit `lint-staged` 경고 (변경 파일만)

**독립성**: ✅ 카테고리별 독립 (컴포넌트/페이지/스토어/유틸리티)

**작업 전략**: 대부분 false positive, ESLint 규칙 조정 검토

---

### 🟣 그룹 5: 보안 경고 - 기타 (2개)

**문제**:
1. `security/detect-unsafe-regex` (1개)
2. `security/detect-eval-with-expression` (1개)

**영향 범위**:
- ⚠️ CI `validate` job 경고
- ⚠️ Pre-commit `lint-staged` 경고

**독립성**: ✅ 완전 독립 (서로 다른 파일)

---

## 🔄 Pre-commit vs CI 간섭 분석

### ⚠️ 잠재적 간섭 지점

#### 1. **Lint 범위 차이**
- **Pre-commit**: `lint-staged` (변경된 파일만)
- **CI**: `npm run lint` (전체 프로젝트)

**간섭 가능성**: ⚠️ **중간**
- Pre-commit 통과 → CI 실패 가능
- 변경하지 않은 파일의 lint 에러는 Pre-commit에서 감지 안 됨

**해결책**:
- Pre-commit에서도 전체 lint 체크 추가 (느려짐)
- 또는 CI에서만 전체 체크 (현재 방식 유지)

#### 2. **Format 체크 차이**
- **Pre-commit**: `lint-staged` (변경 파일만 자동 수정)
- **CI**: `format:check` (전체 프로젝트, 수정 안 함)

**간섭 가능성**: ⚠️ **낮음**
- Pre-commit에서 자동 수정되므로 CI에서도 통과 가능
- 단, 변경하지 않은 파일의 포맷 문제는 Pre-commit에서 감지 안 됨

#### 3. **check:logic 엄격도 차이**
- **Pre-commit**: 경고만 (실패해도 통과)
- **CI**: 필수 (실패 시 CI 실패)

**간섭 가능성**: ✅ **없음**
- Pre-commit은 경고만, CI는 필수이므로 Pre-commit 통과 → CI 실패 가능
- 하지만 현재는 경고만 있으므로 문제 없음

#### 4. **check:security 엄격도 차이**
- **Pre-commit**: 경고만
- **CI**: 필수

**간섭 가능성**: ✅ **없음** (현재는 경고만)

#### 5. **check:layout 깊이 차이**
- **Pre-commit**: 기본 모드 (`check:layout`)
- **CI**: Deep 모드 (`check:layout:deep`)

**간섭 가능성**: ⚠️ **낮음**
- Pre-commit 기본 통과 → CI Deep 실패 가능
- 하지만 기본 모드에서 발견되는 문제는 Deep에서도 발견됨

#### 6. **check:db 조건 차이**
- **Pre-commit**: 조건부 (DB 변경 시만)
- **CI**: 항상 실행

**간섭 가능성**: ✅ **없음**
- Pre-commit은 DB 변경 감지 시만 실행
- CI는 항상 실행하므로 더 안전

---

## 📊 독립 작업 그룹 분류

### 🎯 Phase 1: 즉시 수정 (필수)

**그룹 1**: 에러 수정
- **파일**: `scripts/check-layout-standalone.js`
- **작업**: 미사용 변수 제거
- **예상 시간**: 5분
- **CI 영향**: 즉시 통과 가능
- **독립성**: ✅ 완전 독립

---

### 🎯 Phase 2: 코드 품질 개선 (권장)

**그룹 2**: TypeScript 타입 안전성
- **파일**: 14개 파일
- **작업**: `any` 타입을 구체적 타입으로 변경
- **예상 시간**: 2-3시간
- **병렬화**: ✅ 파일별 독립 작업 가능
- **CI/Pre-commit 영향**: 경고 감소

**그룹 3**: React Hooks 의존성
- **파일**: 5개 파일
- **작업**: 의존성 배열 수정
- **예상 시간**: 1-2시간
- **병렬화**: ✅ 파일별 독립 작업 가능
- **CI/Pre-commit 영향**: 경고 감소

**그룹 5**: 기타 보안 경고
- **파일**: 2개 파일
- **작업**: 정규식 최적화, eval 검토
- **예상 시간**: 30분
- **병렬화**: ✅ 완전 독립
- **CI/Pre-commit 영향**: 경고 감소

---

### 🎯 Phase 3: 대량 경고 처리 (선택)

**그룹 4**: Object Injection 경고
- **파일**: 약 50개 파일
- **작업**: ESLint 규칙 조정 또는 주석 처리
- **예상 시간**: 4-6시간
- **병렬화**: ✅ 카테고리별 독립 작업 가능
- **CI/Pre-commit 영향**: 경고 감소 (대량)

---

## 🔀 병렬 작업 가능 조합

### 동시 작업 가능한 그룹

1. **그룹 1 + 그룹 2**: 에러 수정과 타입 수정 (완전 독립)
2. **그룹 2 + 그룹 3**: 타입 수정과 Hook 수정 (서로 다른 파일)
3. **그룹 3 + 그룹 5**: Hook 수정과 보안 경고 (완전 독립)
4. **그룹 4 내부**: 카테고리별 병렬 작업
   - 컴포넌트 파일 그룹
   - 페이지 파일 그룹
   - 스토어 파일 그룹
   - 유틸리티 파일 그룹

### 주의사항

- 같은 파일을 수정하는 경우는 순차 작업
- 그룹 4는 대량이므로 우선순위 낮게 설정 가능
- 실제 취약점 여부 확인 후 처리 방식 결정

---

## 📝 Pre-commit vs CI 최적화 제안

### 현재 상태 분석

#### ✅ 잘 작동하는 부분
1. **의존성 무결성**: Pre-commit에서만 체크 (로컬 환경 문제 조기 발견)
2. **변경 파일만 검사**: Pre-commit에서 lint-staged 사용 (빠른 피드백)
3. **전체 검사**: CI에서 전체 프로젝트 검사 (안전성 확보)

#### ⚠️ 개선 가능한 부분

1. **Lint 범위 차이**
   - **현재**: Pre-commit은 변경 파일만, CI는 전체
   - **문제**: 변경하지 않은 파일의 lint 에러는 Pre-commit에서 감지 안 됨
   - **제안**: Pre-commit에 전체 lint 체크 추가 (느려짐) 또는 현재 방식 유지

2. **Format 체크**
   - **현재**: Pre-commit은 자동 수정, CI는 체크만
   - **상태**: ✅ 잘 작동 (Pre-commit에서 자동 수정되므로 CI 통과)

3. **check:logic 엄격도**
   - **현재**: Pre-commit은 경고만, CI는 필수
   - **제안**: Pre-commit도 필수로 변경 (일관성) 또는 현재 방식 유지 (속도)

4. **check:security 엄격도**
   - **현재**: Pre-commit은 경고만, CI는 필수
   - **제안**: Pre-commit도 필수로 변경 (일관성) 또는 현재 방식 유지 (속도)

---

## 🎯 권장 작업 순서

### 즉시 (필수)
1. ✅ **그룹 1**: 에러 수정 → CI 통과

### 단기 (권장, 병렬 가능)
2. ✅ **그룹 2**: TypeScript 타입 수정 (14개 파일)
3. ✅ **그룹 3**: React Hooks 의존성 수정 (5개 파일)
4. ✅ **그룹 5**: 기타 보안 경고 (2개 파일)

### 중기 (선택)
5. ⚠️ **그룹 4**: Object Injection 경고 처리 (대량, ESLint 규칙 조정 검토)

---

## 📋 작업 체크리스트

### Phase 1 (필수)
- [ ] 그룹 1: `scripts/check-layout-standalone.js` 에러 수정

### Phase 2 (권장, 병렬 가능)
- [ ] 그룹 2: TypeScript any 타입 수정 (14개 파일)
- [ ] 그룹 3: React Hooks 의존성 수정 (5개 파일)
- [ ] 그룹 5: 기타 보안 경고 (2개 파일)

### Phase 3 (선택)
- [ ] 그룹 4: Object Injection 경고 처리 (대량)

---

## 🔧 Pre-commit vs CI 일관성 개선 제안

### 옵션 1: Pre-commit 강화 (느려짐, 안전함)
- Pre-commit에서도 전체 lint 체크
- Pre-commit에서도 check:logic, check:security 필수로 변경

### 옵션 2: 현재 방식 유지 (빠름, CI에서 안전성 확보)
- Pre-commit은 빠른 피드백 (변경 파일만)
- CI는 전체 검증 (안전성)

### 옵션 3: 하이브리드 (권장)
- Pre-commit: 변경 파일만 검사 (빠른 피드백)
- CI: 전체 검증 (안전성)
- Pre-commit에 경고 표시 (전체 lint 결과 미리보기, 실패는 안 함)

---

## 📊 작업 우선순위 매트릭스

| 그룹 | 우선순위 | 예상 시간 | CI 영향 | Pre-commit 영향 | 병렬화 |
|------|---------|---------|---------|----------------|--------|
| 그룹 1 | 🔴 최우선 | 5분 | ✅ 통과 | ✅ 통과 | ✅ 독립 |
| 그룹 2 | 🟡 높음 | 2-3시간 | ⚠️ 경고 감소 | ⚠️ 경고 감소 | ✅ 파일별 |
| 그룹 3 | 🟡 높음 | 1-2시간 | ⚠️ 경고 감소 | ⚠️ 경고 감소 | ✅ 파일별 |
| 그룹 5 | 🟢 중간 | 30분 | ⚠️ 경고 감소 | ⚠️ 경고 감소 | ✅ 독립 |
| 그룹 4 | 🔵 낮음 | 4-6시간 | ⚠️ 경고 감소 | ⚠️ 경고 감소 | ✅ 카테고리별 |
