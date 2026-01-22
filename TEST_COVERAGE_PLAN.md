# 테스트 커버리지 효율화 전략 계획서

> **작성일:** 2026-01-23  
> **목표:** 현재 65% → 80% 커버리지 달성을 **최소 노력**으로 효율적으로 수행

---

## 📊 1. 현황 분석

### 1.1 전체 커버리지 현황

| 영역 | 현재 커버리지 | 목표 | 난이도 | 우선순위 |
| :--- | :---: | :---: | :---: | :---: |
| **Utils** (순수 로직) | 65% | 85% | ⭐ 쉬움 | 🔴 최우선 |
| **Stores** (zustand) | 70% | 80% | ⭐⭐ 보통 | 🟠 높음 |
| **Hooks** (비동기/상태) | 60% | 80% | ⭐⭐⭐ 어려움 | 🟡 중간 |
| **Components** (UI) | 55% | 75% | ⭐⭐ 보통 | 🟢 낮음 |
| **외부 연동** (Toss SDK) | 17% | 70% | ⭐⭐⭐⭐ 매우 어려움 | 🔵 선택적 |

### 1.2 커버리지가 낮은 주요 파일

#### 🔴 Critical (17% 이하)
```
src/utils/tossGameCenter.ts      17%  → Toss SDK 연동, Mocking 복잡
src/utils/tossGameLogin.ts       16%  → Toss SDK 연동, Mocking 복잡
```

#### 🟠 Low (30~50%)
```
src/utils/tossAuth.ts            33%  → 인증 플로우, 비동기 복잡
src/hooks/useQuestionGenerator.ts 45% → 상태 변화가 많음
```

#### 🟡 Medium (50~70%)
```
src/stores/useLevelProgressStore.ts  60%  → 전역 상태 얽힘
src/hooks/useQuizSubmit.ts           70%  → 핵심 로직
src/utils/urlParams.ts               72%  → 간단한 보강 필요
```

#### 🟢 Good (70% 이상)
```
src/utils/quizGenerator.ts       80%  → 약간의 경계값 테스트 추가
src/utils/tierUtils.ts          100%  → 완료 ✅
src/utils/validation.ts         100%  → 완료 ✅
```

---

## 🎯 2. 효율화 핵심 전략

### 2.1 "80/20 법칙" 적용

> **핵심:** 전체 코드 중 20%의 파일이 커버리지 부족의 80%를 차지합니다.

**우선 공략 대상 (High Impact / Low Effort):**

| 파일 | 현재 | 목표 | 예상 시간 | ROI |
| :--- | :---: | :---: | :---: | :---: |
| `quizGenerator.ts` | 80% | 90% | 15분 | 🔥 최고 |
| `challenge.ts` | 75% | 85% | 20분 | 🔥 최고 |
| `useSettingsStore.ts` | 75% | 85% | 15분 | 🔥 최고 |
| `useLoadingStore.ts` | 90% | 95% | 10분 | 🔥 최고 |
| `urlParams.ts` | 72% | 85% | 20분 | ⭐ 좋음 |

**후순위 (High Effort / Lower Impact):**

| 파일 | 현재 | 목표 | 예상 시간 | 비고 |
| :--- | :---: | :---: | :---: | :--- |
| `tossGameCenter.ts` | 17% | 70% | 2시간 | SDK Mock 패턴 필요 |
| `tossGameLogin.ts` | 16% | 70% | 1.5시간 | 위 패턴 재사용 |
| `tossAuth.ts` | 33% | 70% | 1.5시간 | 인증 플로우 Mock |

---

### 2.2 AI 자동화 워크플로우

#### 모델별 역할 분담

| 단계 | 사용 모델 | 작업 내용 | 비용 효율 |
| :--- | :--- | :--- | :---: |
| **1️⃣ 분석** | Gemini Flash | 커버리지 리포트 파싱, 부족한 파일 목록화 | 💚 저비용 |
| **2️⃣ 템플릿 생성** | Claude Sonnet (Thinking) | 프로젝트 패턴에 맞는 테스트 템플릿 생성 | 💛 중비용 |
| **3️⃣ 대량 생성** | Gemini Flash | 템플릿 기반으로 비슷한 파일들 테스트 작성 | 💚 저비용 |
| **4️⃣ 복잡한 케이스** | Claude Opus (Thinking) | 외부 연동, 복잡한 Mocking 필요 시 | 💔 고비용 |
| **5️⃣ 검증** | Gemini Flash | 테스트 실행 및 커버리지 확인 | 💚 저비용 |

#### AI 프롬프트 템플릿

**쉬운 파일용 (Flash):**
```
"{파일명}의 테스트 커버리지를 {목표}%로 올려줘.
기존 __tests__ 폴더의 테스트 패턴을 따르고, 
경계값(0, null, 음수, 최대치) 테스트를 추가해."
```

**복잡한 파일용 (Opus):**
```
"{파일명}의 테스트 커버리지를 {목표}%로 올려줘.
@apps-in-toss/web-framework 모듈을 Mock해야 해.
기존 tossGameCenter.test.ts의 Mock 패턴을 참고하고,
모든 환경(localhost, toss app, browser)을 시뮬레이션해."
```

---

### 2.3 테스트 패턴 재사용

#### Store 테스트 패턴

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useExampleStore } from '../useExampleStore';

describe('useExampleStore', () => {
  beforeEach(() => {
    useExampleStore.getState().reset(); // 상태 초기화
  });

  it('should initialize with default state', () => {
    const state = useExampleStore.getState();
    expect(state.value).toBe(initialValue);
  });

  it('should update state when action is called', () => {
    useExampleStore.getState().setValue(newValue);
    expect(useExampleStore.getState().value).toBe(newValue);
  });
});
```

#### Hook 테스트 패턴

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExampleHook } from '../useExampleHook';

describe('useExampleHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useExampleHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('should update state when action is called', async () => {
    const { result } = renderHook(() => useExampleHook());
    
    await act(async () => {
      await result.current.doSomething();
    });
    
    expect(result.current.value).toBe(expectedValue);
  });
});
```

#### Toss SDK Mock 패턴

```typescript
import { vi } from 'vitest';

// 전역 Mock 설정
vi.mock('@apps-in-toss/web-framework', () => ({
  submitGameCenterLeaderBoardScore: vi.fn(),
  openGameCenterLeaderboard: vi.fn(),
  isMinVersionSupported: vi.fn(() => true),
  getOperationalEnvironment: vi.fn(() => 'toss'),
}));

// 환경 시뮬레이션 헬퍼
function setupTossAppEnvironment() {
  (window as any).ReactNativeWebView = {};
  Object.defineProperty(window, 'location', {
    value: { hostname: 'example.com' },
    writable: true,
    configurable: true,
  });
}

function setupLocalDevEnvironment() {
  delete (window as any).ReactNativeWebView;
  Object.defineProperty(window, 'location', {
    value: { hostname: 'localhost' },
    writable: true,
    configurable: true,
  });
}
```

---

## 📅 3. 실행 계획 (Phase별)

### Phase 1: Easy Wins (쉬운 승리) - 예상 1일

**목표:** 빠르게 커버리지 수치를 올려 모멘텀 확보

| 순서 | 파일 | 현재 | 목표 | 예상 시간 | AI 모델 |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | `quizGenerator.ts` | 80% | 90% | 15분 | Flash |
| 2 | `challenge.ts` | 75% | 85% | 20분 | Flash |
| 3 | `useSettingsStore.ts` | 75% | 85% | 15분 | Flash |
| 4 | `useLoadingStore.ts` | 90% | 95% | 10분 | Flash |
| 5 | `urlParams.ts` | 72% | 85% | 20분 | Flash |
| 6 | `algebra.ts` | 70% | 85% | 25분 | Flash |

**예상 결과:** 전체 커버리지 65% → 72%

---

### Phase 2: 핵심 로직 보강 - 예상 2일

**목표:** 게임의 핵심 비즈니스 로직 안정성 확보

| 순서 | 파일 | 현재 | 목표 | 예상 시간 | AI 모델 |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | `useQuizSubmit.ts` | 70% | 85% | 45분 | Sonnet |
| 2 | `useQuestionGenerator.ts` | 45% | 75% | 1시간 | Sonnet |
| 3 | `useLevelProgressStore.ts` | 60% | 80% | 1시간 | Sonnet |
| 4 | `useQuizGameState.ts` | 65% | 80% | 45분 | Sonnet |
| 5 | `MathProblemGenerator.ts` | 70% | 85% | 30분 | Flash |
| 6 | `EquationProblemGenerator.ts` | 65% | 80% | 40분 | Flash |

**예상 결과:** 전체 커버리지 72% → 78%

---

### Phase 3: 외부 연동 (선택적) - 예상 1일

**목표:** Toss SDK 연동 부분의 안정성 확보 (필요 시에만)

| 순서 | 파일 | 현재 | 목표 | 예상 시간 | AI 모델 |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | `tossGameCenter.ts` | 17% | 70% | 2시간 | **Opus** |
| 2 | `tossGameLogin.ts` | 16% | 70% | 1.5시간 | Sonnet (패턴 재사용) |
| 3 | `tossAuth.ts` | 33% | 70% | 1.5시간 | Sonnet (패턴 재사용) |

**예상 결과:** 전체 커버리지 78% → 82%

> **참고:** 외부 연동 테스트는 실제 서비스 안정성에 직접 영향을 주지 않으므로,
> 시간이 부족하면 후순위로 미뤄도 됩니다.

---

## 🛠️ 4. 자동화 스크립트

### 4.1 커버리지가 낮은 파일 자동 탐지

```powershell
# 커버리지 80% 미만인 파일만 표시
npm run test:coverage -- --run 2>&1 | Select-String -Pattern "\|\s+[0-6][0-9]\.[0-9]"
```

### 4.2 특정 영역 커버리지 확인

```powershell
# Utils만 확인
npm run test:coverage:utils

# Components만 확인
npm run test:coverage:components
```

### 4.3 단일 파일 커버리지 확인

```powershell
# 특정 파일만 테스트 및 커버리지 확인
npm run test -- src/utils/__tests__/quizGenerator.test.ts --coverage --run
```

---

## 📋 5. 체크리스트

### Phase 1 체크리스트
- [ ] `quizGenerator.ts` 커버리지 90% 달성
- [ ] `challenge.ts` 커버리지 85% 달성
- [ ] `useSettingsStore.ts` 커버리지 85% 달성
- [ ] `useLoadingStore.ts` 커버리지 95% 달성
- [ ] `urlParams.ts` 커버리지 85% 달성
- [ ] `algebra.ts` 커버리지 85% 달성
- [ ] 전체 커버리지 72% 이상 확인

### Phase 2 체크리스트
- [ ] `useQuizSubmit.ts` 커버리지 85% 달성
- [ ] `useQuestionGenerator.ts` 커버리지 75% 달성
- [ ] `useLevelProgressStore.ts` 커버리지 80% 달성
- [ ] `useQuizGameState.ts` 커버리지 80% 달성
- [ ] `MathProblemGenerator.ts` 커버리지 85% 달성
- [ ] `EquationProblemGenerator.ts` 커버리지 80% 달성
- [ ] 전체 커버리지 78% 이상 확인

### Phase 3 체크리스트 (선택적)
- [ ] Toss SDK Mock 패턴 템플릿 작성
- [ ] `tossGameCenter.ts` 커버리지 70% 달성
- [ ] `tossGameLogin.ts` 커버리지 70% 달성
- [ ] `tossAuth.ts` 커버리지 70% 달성
- [ ] 전체 커버리지 80% 이상 확인

---

## 📝 6. 참고 사항

### 6.1 테스트 작성 원칙

1. **AAA 패턴 준수:** Arrange(준비) → Act(실행) → Assert(검증)
2. **경계값 테스트:** 0, null, undefined, 음수, 최대값 등
3. **에러 케이스 우선:** Happy path보다 에러 처리 우선
4. **Mocking 최소화:** 필요한 것만 Mock, 과도한 Mocking 지양

### 6.2 커버리지 목표 기준

| 기준 | 임계값 | 설명 |
| :--- | :---: | :--- |
| Lines | 80% | 실행된 코드 라인 비율 |
| Functions | 80% | 호출된 함수 비율 |
| Branches | 75% | 실행된 분기(if/else) 비율 |
| Statements | 80% | 실행된 구문 비율 |

### 6.3 커버리지 제외 대상

```javascript
// vite.config.js의 coverage.exclude 설정
exclude: [
  'node_modules/',
  'src/setupTests.ts',
  '**/*.d.ts',
  '**/*.config.*',
  '**/dist/**',
  '**/coverage/**',
  '**/__tests__/**',
  '**/mocks/**',
  '**/types/**',
  'src/main.tsx',
  'src/App.tsx',
  'src/components/debug/**',  // 디버그용 컴포넌트
]
```

---

## 🎯 요약

| 항목 | 권장 사항 |
| :--- | :--- |
| **모델 선택** | 쉬운 파일 → Flash, 복잡한 파일 → Opus |
| **우선순위** | Utils → Stores → Hooks → Components → SDK 연동 |
| **자동화** | AI에게 패턴 학습시킨 후 반복 작업 위임 |
| **목표** | Phase 1~2만 해도 80% 달성 가능 |
| **핵심** | 100% 불필요, **핵심 비즈니스 로직 80%**가 목표 |
