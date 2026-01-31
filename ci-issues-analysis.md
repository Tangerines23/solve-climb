# CI 테스트 문제 분석 및 작업 분류

## 📊 전체 문제 현황

- **에러**: 2개
- **경고**: 191개
- **총 문제**: 193개

---

## 🔴 그룹 1: 에러 수정 (최우선)

### 문제 유형
- **사용되지 않는 변수 에러** (2개)

### 영향 파일
- `scripts/check-layout-standalone.js:30` - catch 블록의 미사용 변수 `e`

### 작업 내용
```javascript
// 현재
} catch (e) {
  // Continue to next port
}

// 수정 후
} catch {
  // Continue to next port
}
// 또는
} catch (_e) {
  // Continue to next port
}
```

### 독립성
- ✅ **완전 독립**: scripts 파일만 수정, 다른 코드와 무관
- ✅ **즉시 적용 가능**: CI 통과를 위해 필수

---

## 🟡 그룹 2: TypeScript 타입 안전성 개선

### 문제 유형
- **`@typescript-eslint/no-explicit-any`** (약 20개)

### 영향 파일 목록
1. `src/components/PwaUpdateNotification.tsx:14`
2. `src/components/debug/DummyPlayerManager.tsx:65,84,106`
3. `src/components/dev/VisualGuardian.tsx:16,20,27,28,72,94,130`
4. `src/hooks/useBadgeChecker.ts:53`
5. `src/hooks/useHistoryData.ts:209,218,469`
6. `src/hooks/useMyPageStats.ts:238`
7. `src/hooks/useQuizSubmit.ts:379,380`
8. `src/mocks/handlers.ts:51,84`
9. `src/pages/MyPage.tsx:202`
10. `src/pages/ResultPage.tsx:336`
11. `src/pages/ShopPage.tsx:145`
12. `src/pwa.d.ts:9`
13. `src/stores/useLevelProgressStore.ts:418`
14. `src/utils/rpcValidator.ts:47,47,50`

### 작업 전략
- 각 파일별로 적절한 타입 정의
- `unknown` 또는 구체적 타입으로 대체
- 타입 가드 활용

### 독립성
- ✅ **파일별 독립**: 각 파일을 개별적으로 수정 가능
- ✅ **병렬 작업 가능**: 여러 파일 동시 수정 가능
- ⚠️ **주의**: 같은 파일 내 여러 any가 있으면 함께 수정 권장

---

## 🟢 그룹 3: React Hooks 의존성 배열 수정

### 문제 유형
- **`react-hooks/exhaustive-deps`** (6개)

### 영향 파일 및 위치
1. `src/hooks/useDebugShortcuts.ts:96` - useCallback 의존성 누락
2. `src/hooks/useQuizSubmit.ts:515` - useCallback 의존성 누락
3. `src/pages/QuizPage.tsx:417,625,674` - useCallback/useEffect 의존성 누락
4. `src/pages/ResultPage.tsx:224,322` - useEffect/useMemo 의존성 누락
5. `src/pages/ShopPage.tsx:121` - useEffect 의존성 누락

### 작업 전략
- 누락된 의존성 추가
- 또는 `eslint-disable-next-line` (의도적 제외 시)
- useCallback/useMemo 최적화 검토

### 독립성
- ✅ **파일별 독립**: 각 Hook별로 독립적 수정
- ⚠️ **주의**: 같은 컴포넌트 내 여러 Hook이 있으면 함께 검토 권장
- ✅ **병렬 작업 가능**: 서로 다른 파일은 동시 수정 가능

---

## 🔵 그룹 4: 보안 경고 - Object Injection (대량)

### 문제 유형
- **`security/detect-object-injection`** (약 150개)

### 영향 파일 카테고리

#### A. 컴포넌트 파일 (약 50개)
- `src/components/ClimbGraphic.tsx` (8개)
- `src/components/ClimbGraphicBackgrounds.tsx` (4개)
- `src/components/KeyboardInfoModal.tsx` (5개)
- `src/components/QuizCard.tsx` (2개)
- `src/components/algebra/EquationVisualizer.tsx` (1개)
- `src/components/debug/*.tsx` (여러 파일)
- `src/components/quiz/QuizPreview.tsx` (2개)
- `src/components/tutorial/TutorialOverlay.tsx` (1개)

#### B. 페이지 파일 (약 20개)
- `src/pages/CategorySelectPage.tsx`
- `src/pages/LevelSelectPage.tsx`
- `src/pages/MyPage.tsx`
- `src/pages/QuizPage.tsx`
- `src/pages/RankingPage.tsx`
- `src/pages/ResultPage.tsx`
- `src/pages/RoadmapPage.tsx`
- `src/pages/ShopPage.tsx`

#### C. 스토어 파일 (약 40개)
- `src/stores/useLevelProgressStore.ts` (대량)
- `src/stores/useProfileStore.ts`

#### D. 유틸리티 파일 (약 30개)
- `src/utils/MathProblemGenerator.ts`
- `src/utils/StatsProblemGenerator.ts`
- `src/utils/challenge.ts`
- `src/utils/debug.ts`
- `src/utils/debugMacros.ts`
- `src/utils/debugPresets.ts`
- `src/utils/errorHandler.ts`
- `src/utils/logger.ts`
- `src/utils/math.ts`
- `src/utils/performance.ts`
- `src/utils/quizGenerator.ts`
- `src/utils/scoreCalculator.ts`

#### E. 상수/훅 파일 (약 10개)
- `src/constants/*.ts`
- `src/hooks/useHistoryData.ts`
- `src/hooks/useQuestionGenerator.ts`

### 작업 전략
- **대부분 false positive**: 동적 객체 접근이지만 안전한 경우
- ESLint 규칙 비활성화 또는 주석 처리
- 실제 취약점이 있는 경우 타입 가드 추가

### 독립성
- ✅ **카테고리별 독립**: 컴포넌트/페이지/스토어/유틸리티별로 독립 작업
- ✅ **병렬 작업 가능**: 서로 다른 카테고리 동시 수정
- ⚠️ **주의**: 같은 파일 내 여러 경고는 함께 처리 권장

---

## 🟣 그룹 5: 보안 경고 - 기타 (2개)

### 문제 유형
1. **`security/detect-unsafe-regex`** (1개)
   - `src/hooks/useBadgeChecker.ts:15`

2. **`security/detect-eval-with-expression`** (1개)
   - `src/utils/__tests__/MathProblemGenerator.fuzz.test.ts:42`

### 작업 내용
- 정규식 최적화 또는 주석 처리
- 테스트 파일의 eval 사용 검토 (테스트 환경이므로 허용 가능)

### 독립성
- ✅ **완전 독립**: 서로 다른 파일, 서로 다른 문제 유형
- ✅ **병렬 작업 가능**: 동시 수정 가능

---

## 📋 작업 우선순위 및 병렬화 전략

### Phase 1: 즉시 수정 (에러)
- **그룹 1**: 에러 수정 (1개 파일)
- **예상 시간**: 5분
- **CI 영향**: 즉시 통과 가능

### Phase 2: 타입 안전성 (중요)
- **그룹 2**: TypeScript any 타입 수정
- **예상 시간**: 2-3시간
- **병렬화**: 파일별로 분산 작업 가능

### Phase 3: React 최적화 (중요)
- **그룹 3**: React Hooks 의존성 수정
- **예상 시간**: 1-2시간
- **병렬화**: 파일별로 분산 작업 가능

### Phase 4: 보안 경고 정리 (선택)
- **그룹 5**: 기타 보안 경고 (2개)
- **예상 시간**: 30분
- **병렬화**: 완전 독립

### Phase 5: Object Injection 경고 (대량, 선택)
- **그룹 4**: Object Injection 경고 처리
- **예상 시간**: 4-6시간 (대량)
- **병렬화**: 카테고리별로 분산 작업 가능
- **전략**: ESLint 규칙 조정 또는 주석 처리 고려

---

## 🔄 병렬 작업 가능 그룹

### 동시 작업 가능 조합
1. **그룹 1 + 그룹 2**: 에러 수정과 타입 수정 (완전 독립)
2. **그룹 2 + 그룹 3**: 타입 수정과 Hook 수정 (서로 다른 파일)
3. **그룹 3 + 그룹 5**: Hook 수정과 보안 경고 (완전 독립)
4. **그룹 4 내부**: 카테고리별 병렬 작업 (컴포넌트/페이지/스토어/유틸리티)

### 주의사항
- 같은 파일을 수정하는 경우는 순차 작업
- 그룹 4는 대량이므로 우선순위 낮게 설정 가능
- 실제 취약점 여부 확인 후 처리 방식 결정

---

## 📝 작업 체크리스트

### Phase 1 (필수)
- [ ] 그룹 1: `scripts/check-layout-standalone.js` 에러 수정

### Phase 2 (권장)
- [ ] 그룹 2: TypeScript any 타입 수정 (14개 파일)
- [ ] 그룹 3: React Hooks 의존성 수정 (5개 파일)
- [ ] 그룹 5: 기타 보안 경고 (2개 파일)

### Phase 3 (선택)
- [ ] 그룹 4: Object Injection 경고 처리 (대량, 우선순위 낮음)

---

## 🎯 권장 작업 순서

1. **즉시**: 그룹 1 (에러 수정) → CI 통과
2. **단기**: 그룹 2 + 그룹 3 (병렬) → 코드 품질 개선
3. **중기**: 그룹 5 → 보안 경고 정리
4. **장기**: 그룹 4 → 대량 경고 처리 (ESLint 규칙 조정 검토)
