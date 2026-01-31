# CI 실패 원인 상세 분석

**커밋**: `2ac9079567a50badf432270e2082f069c7e13125`  
**실행 ID**: `21509911953`  
**실패한 Job**: 4개

---

## 🔴 Job 1: validate (실패)

### 실패 원인
**에러 2개**:
```
scripts/check-layout-standalone.js:30:16
error: 'e' is defined but never used. Allowed unused caught errors must match /^[A-Z_]|^_/u
```

### 상세 내용
- **파일**: `scripts/check-layout-standalone.js`
- **라인**: 30
- **문제**: catch 블록의 미사용 변수 `e`
- **경고**: 191개 (TypeScript any, React Hooks, 보안 경고 등)

### 해결 방법
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

## 🔴 Job 2: security-db (실패)

### 실패 원인
**DB 연결 실패**:
```
failed to connect to postgres: failed to connect to `host=aws-1-ap-northeast-2.pooler.supabase.com user=postgres.aekcjzxxjczqibxkoakg database=postgres`: failed SASL auth (FATAL: password authentication failed for user "postgres" (SQLSTATE 28P01))
```

### 상세 내용
- **단계**: `🐘 DB Lint Check`
- **문제**: Supabase DB 비밀번호 인증 실패
- **원인**: `SUPABASE_DB_PASSWORD` secret이 잘못되었거나 만료됨

### 해결 방법
1. GitHub Secrets에서 `SUPABASE_DB_PASSWORD` 확인
2. Supabase 대시보드에서 DB 비밀번호 재설정
3. Secret 업데이트

---

## 🔴 Job 3: e2e-stability-test (실패)

### 실패 원인
**Chaos Monkey 테스트 실패**:
```
Error: Chaos Monkey found 2 critical errors!
```

### 상세 내용
- **테스트**: `tests/e2e/monkey-test.spec.ts`
- **문제**: 카오스 환경에서 2개의 critical error 발견
- **재시도**: 3번 모두 실패

### 해결 방법
1. 스크린샷 확인: `test-results/monkey-test-.../test-failed-1.png`
2. Trace 파일 확인: `npx playwright show-trace test-results/.../trace.zip`
3. Critical error 원인 파악 후 수정

---

## 🔴 Job 4: e2e-visual-layout (실패)

### 실패 원인 (다중)

#### 1. Accessibility 테스트 실패
```
Error: expect(received).toEqual(expected) // deep equality
- Expected - 1
+ Received + 250
```
- **예상**: 1개 위반
- **실제**: 250개 위반 발견
- **주요 문제**:
  - Color contrast 부족 (2.33, 필요: 4.5:1)
  - Landmark 문제 (콘텐츠가 landmark에 포함되지 않음)
  - Scrollable region focusable 문제

#### 2. Visual Regression 테스트 타임아웃
```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
- waiting for locator('.level-select-content') to be visible
- waiting for locator('.ranking-list') to be visible
```
- **Level Select Page**: `.level-select-content` 요소를 찾지 못함
- **Ranking Page**: `.ranking-list` 요소를 찾지 못함
- **재시도**: 3번 모두 타임아웃

#### 3. Core Business Scenario 타임아웃
```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
- waiting for locator('.profile-form-input') to be visible
```
- **문제**: 프로필 입력 폼이 로드되지 않음
- **재시도**: 3번 모두 실패

#### 4. Monkey Test 실패
```
Error: Chaos Monkey found 2 critical errors!
```
- **문제**: 카오스 환경에서 critical error 발견

#### 5. 추가 문제
- **Rate Limit**: `Request rate limit reached` (429 에러)
- **DB 테이블 누락**: `Could not find the table 'public.game_activity'`
- **PWA 에러**: `Cannot destructure property 'Symbol(Symbol.iterator)' of 'useRegisterSW(...)'`

---

## 📊 실패 요약

| Job | 실패 원인 | 우선순위 | 해결 난이도 |
|-----|----------|---------|------------|
| **validate** | ESLint 에러 (미사용 변수) | 🔴 최우선 | ⭐ 쉬움 |
| **security-db** | DB 비밀번호 인증 실패 | 🟡 높음 | ⭐⭐ 보통 |
| **e2e-stability-test** | Chaos Monkey critical errors | 🟡 높음 | ⭐⭐⭐ 어려움 |
| **e2e-visual-layout** | 다중 실패 (a11y, 타임아웃, rate limit) | 🟡 높음 | ⭐⭐⭐ 어려움 |

---

## 🎯 해결 우선순위

### Phase 1: 즉시 수정 (필수)
1. ✅ **validate job**: `scripts/check-layout-standalone.js` 에러 수정
   - 예상 시간: 5분
   - 영향: CI 통과 가능

### Phase 2: 설정 수정 (필수)
2. ✅ **security-db job**: Supabase DB 비밀번호 확인/업데이트
   - 예상 시간: 10분
   - 영향: DB 검증 통과 가능

### Phase 3: 테스트 안정화 (권장)
3. ⚠️ **e2e-visual-layout**: 
   - Rate limit 문제 해결 (테스트 간격 조정)
   - 타임아웃 증가 또는 페이지 로딩 로직 개선
   - Accessibility 위반 수정 (250개 → 1개 이하)

4. ⚠️ **e2e-stability-test**: 
   - Critical error 원인 파악
   - 스크린샷 및 trace 파일 확인

---

## 📝 로그 확인 방법

### 전체 로그 확인
```bash
# 실패한 부분만 확인 (이미 저장됨)
Get-Content ci-failure-log.txt | Select-String -Pattern "##\[error\]|Error|FAILED" -Context 5

# 특정 job 로그 확인
gh run view 21509911953 --log-failed > ci-failure-log.txt
```

### 로그 파일 정보
- **파일**: `ci-failure-log.txt`
- **줄 수**: 8,202줄
- **크기**: 약 148KB (터미널 출력 기준)

---

## ✅ CLI로 확인 가능 여부

**답변**: ✅ **CLI로 모두 확인 가능**

- `gh run view <run-id> --log-failed`: 실패한 로그만 확인
- `gh run view <run-id> --log`: 전체 로그 확인
- 로그가 매우 길어서 파일로 저장 후 검색하는 것이 효율적

**현재 상태**: 
- ✅ 전체 로그 확인 완료 (8,202줄)
- ✅ 실패 원인 모두 파악 완료
- ✅ 각 job별 상세 분석 완료
