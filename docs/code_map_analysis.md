# Solve-Climb Code Map Analysis Results

`.code-map.yaml` 및 핵심 소스 코드 직접 분석을 바탕으로 감지된 프로젝트의 구조적 문제점, 리팩토링 대상 및 로직 취약점을 구역별로 분류하여 정리합니다.

---

## 1. 컴포넌트 구역 (Components Area)

### 🚨 UI와 DB/API 로직의 강한 결합 (Tight Coupling)
여러 UI 컴포넌트가 비즈니스 로직(API 호출, DB 직접 쿼리)을 내장하고 있어, 컴포넌트의 단일 책임 원칙(SRP)을 위배하고 재사용성 및 테스트 가능성을 떨어뜨립니다.

*   **[BadgeNotification](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/BadgeNotification.tsx)**:
    *   **코드 현황**: L32-L37에서 `supabase.from('badge_definitions').select(...)`를 직접 호출합니다.
    *   **문제점**: 단순한 오버레이 알림 렌더링 역할의 컴포넌트가 Supabase 클라이언트 의존성과 비동기 데이터 로딩 책임을 동시에 안고 있습니다.
    *   **개선안**: 전역 `useBadgeStore`에 이미 로드된 뱃지 사전 데이터를 주입받아 동기식으로 그리거나, 데이터 페칭 훅을 외부로 분리해야 합니다.
*   **[CyclePromotionModal](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/CyclePromotionModal.tsx)**:
    *   `supabase.rpc(...)`를 통해 승급 처리를 직접 수행합니다.
    *   **개선안**: 승급 처리 비즈니스 로직을 `useProfileStore`의 액션(Action)으로 이동시키십시오.
*   **[ProfileForm](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/ProfileForm.tsx)**:
    *   Supabase 클라이언트를 동적으로 임포트(`import('../utils/supabaseClient')`)하여 `update_profile_nickname` RPC 및 세션 확인을 내부에서 직접 처리하고 있습니다.
    *   **개선안**: 프로필 수정 관련 상태 및 비즈니스 로직은 `useProfileStore`에서 캡슐화하여 처리하고 컴포넌트는 UI 업데이트만 전담해야 합니다.
*   **[Header](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/Header.tsx)**:
    *   `fetchUserData`, `checkStamina` 등 스태미나 충전 및 광고 Recharging 로직이 UI 헤더 내에 산재해 있습니다.

### 🧩 복잡한 컴포넌트 내부 연산 및 DOM 조작
*   **[KeyboardInfoModal](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/KeyboardInfoModal.tsx)**:
    *   모달 내부에서 복잡한 익명 즉시 실행 함수(IIFE) 형태로 거대한 JSX 분기 구조를 처리하고 있으며, 방향 전환(`screen.orientation`) 및 미디어 쿼리(`window.matchMedia`) 리스너를 직접 관리하여 컴포넌트 크기가 매우 큽니다.
    *   **개선안**: 키패드 렌더링 영역을 별도 컴포넌트(`KeyboardPreview`)로 분리하고, 미디어/방향 감지는 `useOrientation` 커스텀 훅으로 추상화하십시오.
*   **[ClimbGraphic](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/components/ClimbGraphic.tsx)**:
    *   SVG 경로(Mountain path) 계산을 위한 수학적 연산(`Math.sin`), 포인트 배열 생성, DOM 직접 접근 및 강제 스크롤 제어(`scrollContainer.scrollTo`, `node.closest` 등)가 섞여 있어 복잡도가 매우 높습니다.
    *   **개선안**: 렌더링에만 집중하도록 좌표 생성 함수는 순수 유틸리티 함수로 추출하고 스크롤 및 위치 제어는 `useClimbScroll` 훅으로 추상화하십시오.

---

## 2. 훅 구역 (Hooks Area)

### 🔗 훅 내부의 인프라 의존성
*   **[useBadgeChecker](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/hooks/useBadgeChecker.ts)**:
    *   훅이 직접 Supabase client와 RPC 호출 및 DB Select를 수행하고 있어 테스트 시 Supabase 모킹이 강제됩니다.
    *   **개선안**: 데이터 액세스는 스토어나 서비스 객체에 위임하고 훅은 로직 흐름과 상태 전달에만 집중해야 합니다.
*   **[useRanking](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/hooks/useRanking.ts)**:
    *   실시간 랭킹 업데이트 구독(`subscribeToRankingUpdates`) 및 세션 조회가 훅에 섞여 있어 재사용이 어렵습니다.

---

## 3. 페이지 구역 (Pages Area)

### 🤰 비대해진 결과 페이지 (Fat Result Page)
*   **[ResultPage](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/pages/ResultPage.tsx)**:
    *   **코드 현황**: L77-L216 사이의 거대한 `useEffect` 내에서 로컬 스토리지에 새 기록 저장, `clearLevel` 및 `updateBestScore` 비동기 상태 스토어 처리, 랭킹 리스너 호출, Supabase 인증 세션 조회, 그리고 Toss 리더보드(`submitScoreToLeaderboard`) 제출까지 모든 동작을 직접 관장하고 있습니다.
    *   **문제점**: 단일 컴포넌트가 결과 출력(View)과 결과 기록/동기화(Business Logic) 책임을 모두 갖다 보니 600줄이 넘어가는 'Fat Component'가 되었으며, 이로 인해 사이드 이펙트 추적이 어렵습니다.
    *   **개선안**: 결과 처리 비즈니스 로직을 `useQuizResult` 또는 `useResultPage` 등의 전용 커스텀 훅으로 은닉하고, 페이지는 단지 필요한 데이터 상태를 바인딩하여 렌더링하는 역할로 슬림하게 리팩토링해야 합니다.

*   **[LevelSelectPage](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/pages/LevelSelectPage.tsx)**:
    *   `pageEl.setAttribute`, `pageEl.removeAttribute` 등 DOM의 속성을 직접 조작하여 시트 확장/축소를 처리합니다.
    *   **개선안**: React의 선언적 렌더링 모델을 깨뜨리지 않도록 CSS 변수나 클래스 바인딩 상태(`className={isExpanded ? 'expanded' : ''}`)를 통해 제어하십시오.

---

## 4. 유틸리티 및 문제 생성기 구역 (Utils & Generators Area)

### 🎲 일관되지 않은 의사 난수 생성기 (PRNG) 전달
*   **Math/Calculus/CS/Geometry/Logic/Stats Problem Generators**:
    *   이 생성기들은 시드 기반 재현이 가능하도록 `rng` 객체를 옵셔널 파라미터로 받습니다.
    *   하지만 내부 일부 로직에서 `Math.random()`을 호출하거나 `rng`가 없을 때의 Fallback 처리가 파편화되어 있어 시드 기반으로 일정한 퀴즈 셋을 재생성할 때 예기치 않은 난수 불일치가 발생할 수 있습니다.
    *   **개선안**: 난수를 생성하는 유틸리티 메서드(`getRandomInt`, `getRandom` 등)를 하나의 유틸리티로 모아 `rng`가 전달되지 않았을 때 디폴트 시드 난수 생성기를 생성하여 사용하도록 통일해야 합니다.

### ⚠️ `solutionExplainer.ts`의 정규식 파싱 취약성
*   **[solutionExplainer](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/utils/solutionExplainer.ts)**:
    *   **코드 현황**: L60, L97, L107, L128 등에서 `qStr.match(/\d+/g)` 또는 `qStr.match(/\d+(\.\d+)?/g)` 정규식을 사용하여 문제 설명 텍스트에서 숫자를 동적으로 추출한 뒤 수학적 연산을 시도합니다.
    *   **취약점**: 만약 문제 설명 텍스트 구조가 약간 변경되거나("평균 30m 높이에 도전하는 5명의 기록은 10m, 20m..." 등 설명용 숫자가 포함될 경우) 정규식이 예기치 않게 다른 숫자를 먼저 추출하면, 엉뚱한 연산이 수행되거나 인덱스 오류가 발생합니다.
    *   **개선안**: 문제 생성 시점(`MathProblemGenerator` 등)에 단순 텍스트뿐만 아니라 문제 풀이에 필요한 연산 메타데이터(피연산자 리스트, 적용된 연산 기호 등)를 함께 객체로 생성해 반환하도록 아키텍처를 변경하고, `solutionExplainer`는 이 정화된 메타데이터를 사용하여 해설 텍스트를 완성해야 합니다.

---

## 5. 정적 코드 품질 및 보안 취약점 (Static Analysis & Security)

`npm run lint` 실행 결과, 총 **96개의 경고(warnings)**가 검출되었습니다. 이를 유형별로 분류하여 리팩토링 포인트를 도출합니다.

### 🛡️ Object Injection 취약점 (`security/detect-object-injection`)
*   **검출 파일**:
    *   `src/features/quiz/components/QuizPreview.tsx` (L70, L98, L108, L110, L112)
    *   `src/features/quiz/hooks/useQuestionGenerator.ts` (L103)
    *   `src/pages/LevelSelectPage.tsx` (L50)
    *   `src/utils/CSProblemGenerator.ts` (L259)
    *   `src/utils/GeometryProblemGenerator.ts` (L281)
    *   `src/utils/solutionExplainer.ts` (L131, L412, L450)
*   **문제점**: 사용자 입력 또는 동적으로 가변되는 문자열 키(`object[key]`)를 사용하여 객체의 속성에 바로 접근할 때, Prototype Pollution 이나 내부 상태 오염 공격에 노출될 수 있습니다.
*   **개선안**: `src/utils/validation.ts` 내에 선언되어 있는 `safeAccess` 헬퍼 함수를 적용하여 안전하게 멤버에 접근해야 합니다.
    ```typescript
    // 예시: safeAccess(object, key) 형태로 안전하게 키 존재 여부를 확인하고 값 반환
    ```

### 🪝 React Hook 의존성 배열 오류 (`react-hooks/exhaustive-deps`)
*   **검출 파일**:
    *   `src/features/quiz/contexts/QuizContext.tsx` (L634, L733)
*   **문제점**: `useEffect`나 `useMemo`에 필수 의존 인자인 `levelParam`, `triggerSuccessFeedback`, `triggerWrongFeedback`, `mountainParam` 등이 누락되었습니다. 이는 이전 렌더링의 갇힌(state closure) 값으로 로직이 동작하거나 상태 갱신이 무시되는 원인이 됩니다.
*   **개선안**: 의존성 배열에 경고된 변수들을 포함하거나, `useCallback` 및 `useRef`를 적절히 활용하여 참조 무한 루프를 방지하면서 의존성을 추가해야 합니다.

### ⚡ HMR 오동작 우려 (`react-refresh/only-export-components`)
*   **검출 파일**:
    *   `src/features/quiz/contexts/QuizContext.tsx` (L71, L73)
*   **문제점**: React Refresh 규격 상 React 컴포넌트(또는 ContextProvider)만 단독으로 export하지 않고 일반 유틸리티 함수나 상수를 병행 export하면, Fast Refresh가 동작하지 않아 코드 수정 시마다 매번 웹 브라우저가 전체 새로고침(Full Reload)됩니다.
*   **개선안**: Context 파일 내의 유틸리티나 상수들은 `@/features/quiz/utils` 혹은 독립된 파일로 격리 분리하십시오.

### 🏷️ 무분별한 `any` 타입 사용 (`@typescript-eslint/no-explicit-any`)
*   **검출 파일**: `eventBus.ts`, `scoreCalculator.ts`, `useQuizSubmit.ts`, `useBadgeChecker.ts` 등 전 범위
*   **문제점**: 타입스크립트의 정적 타입 안전성을 무력화하고, 런타임 시 잠재적인 `TypeError`를 발생시키는 explicit `any` 타입이 남용되고 있습니다.
*   **개선안**: 가능한 구체적인 인터페이스나 유니온 타입을 정의하고, 불명확한 경우에는 `unknown` 타입을 사용하여 Type Guard(타입 가드)를 적용하도록 점진적으로 교체해야 합니다.

---

## 6. Zustand 상태 관리 및 동기화 이슈 (State Management & Sync Issues)

[useLevelProgressStore](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/stores/useLevelProgressStore.ts) 상태 관리 코드에서 다음과 같은 구조적 모순과 로직 누수가 발견되었습니다.

### 🔄 스토어와 서비스 레이어의 책임 중첩
*   **문제점**: `clearLevel`과 `updateBestScore` 등 쓰기 작업은 [LevelSyncService](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/services/LevelSyncService.ts)를 호출하여 서버 동기화를 대행하고 있습니다. 그러나 정작 데이터 읽기 동기화 로직인 `syncProgress` 메서드는 서비스 레이어를 거치지 않고, 스토어 내부에서 직접 `supabase.auth.getUser()` 및 `supabase.from('user_level_records')` 쿼리를 실행합니다.
*   **영향**: 데이터 통신 로직이 스토어와 서비스 레이어에 파편화되어 있어 유지보수가 어렵고 단위 테스트 작성을 까다롭게 만듭니다.
*   **개선안**: `syncProgress` 내부의 데이터 패칭 로직도 `LevelSyncService.fetchUserProgress()` 등 서비스 레이어로 온전히 이관하고, 스토어는 조회된 결과 데이터를 받아 상태를 저장하는 단순 액션(`setProgress`)만 노출하도록 리팩토링해야 합니다.

### 📴 오프라인 플레이 기록 누수 (Reconciliation Loop Hole)
*   **문제점**: `syncProgress`의 화해(Reconciliation) 로직(L377-L382)을 보면, 로컬 점수가 서버 점수보다 더 높은 경우(예: 오프라인 모드에서 플레이한 최신 기록)를 감지하고 단순히 `Needs delayed sync`라는 콘솔 로그만 남길 뿐, 실제로 서버로 백그라운드 동기화를 재시도하는 후속 큐(Queue) 처리나 로직이 누락되어 있습니다.
*   **영향**: 사용자가 인터넷이 끊긴 상태에서 달성한 고득점 기록이 다시 온라인 상태로 전환되어 동기화가 실행될 때, 서버 리더보드에 반영되지 않고 로컬 스토리지에만 갇혀 있게 됩니다.
*   **개선안**: 로컬 상태에 `isDirty` 또는 `syncPending` 플래그를 추가하고, 온라인 상태로 복귀하거나 앱 구동 시 해당 레코드들을 서버로 백업 동기화하는 재시도 큐(Sync Queue) 메커니즘을 연동해야 합니다.

### 🛡️ 불안정한 동기적 객체 쓰기 (Bracket Notation Mutation)
*   **문제점**: 읽기 메서드(`isLevelCleared`, `getNextLevel`)에서는 Prototype Pollution 등을 방어하기 위해 `safeAccess` 헬퍼를 적용했으나, 정작 쓰기 메서드(`clearLevel`, `updateBestScore`) 내에서는 `state.progress[worldKey] || {}` 및 `worldProgress[category]` 등 일반 브래킷 동적 키 연산자를 통해 객체를 직접 수정하고 있어 여전히 Prototype Pollution 위험에 노출되어 있습니다.
*   **개선안**: 안전하게 딥 마운트(Deep mutation)할 수 있는 `safeSet` 객체 유틸리티를 적용하거나, 쓰기 연산 전 `world`, `category` 파라미터의 문자열 유효성 검증(Schema validation) 단계를 엄격하게 적용하여 보안 취약점을 원천 차단해야 합니다.

---

## 7. 가상 세션 위조에 따른 프론트엔드 보안 취약점 (Session Spoofing Vulnerability)

[useSession](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/features/auth/hooks/useSession.ts) 훅은 로컬 스토리지에 저장된 세션 정보를 가상 세션(`createVirtualSession`)으로 만들어 사용합니다. 이 통합 방식에서 클라이언트 사이드 권한 위조 가능성이 존재합니다.

### 🎭 로컬 스토리지를 통한 관리자 권한 위조
*   **문제점**: `checkLocalSession` (L56-L67)은 로컬 스토리지에서 파싱된 `localSession.isAdmin`과 `localSession.userId`를 신뢰하여 가상 Supabase `Session` 객체를 반환합니다.
*   **영향**: 악의적인 사용자 또는 공격자가 브라우저 개발자 도구(F12) 콘솔에서 로컬 스토리지의 세션 키 값을 조작(`"isAdmin": true` 및 임의의 `userId` 주입)하면, 클라이언트 측 가드가 손쉽게 우회됩니다. 결과적으로 관리자 전용 메뉴 진입이나 디버그 기능 제어가 뚫리게 됩니다.
*   **개선안**:
    1.  **암호화 저장**: 로컬 스토리지에 저장되는 세션 메타데이터를 클라이언트 측 고유 Salt를 가미해 암호화하여 저장(예: `CryptoJS.AES`)하고, 변조 감지 시 즉시 세션을 초기화하십시오.
    2.  **이중 검증**: 관리자 권한 검증 등 핵심적인 분기가 일어나는 컴포넌트나 라우터 가드에서는 로컬 스토리지 검사만 신뢰하지 말고, Supabase의 `auth.api.getUser()` 호출을 통해 실제 DB 레벨의 관리자 여부를 엄격하게 비동기식으로 재확증해야 합니다.

---

## 8. 퀴즈 생성 엔진의 잠재적 오류 및 설계 결함 (Quiz Engine Vulnerabilities)

[MathProblemGenerator](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/utils/MathProblemGenerator.ts)와 [quizGenerator](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/utils/quizGenerator.ts)를 분석하여 발견한 실질적인 로직 리스크는 다음과 같습니다.

### 💀 Zero Division (0 나누기) 발생 가능성
*   **코드 현황**: `generateStandardProblem` 내의 나눗셈 분기(L596-L610)에서 `divisorRange` 가리키는 피연산자 범위를 무작위로 추출하여 분모 `b`를 얻습니다.
*   **취약점**: 만약 향후 커스텀 레벨이 추가되거나 난이도 설정 중 `ranges` 범위에 `0`이 포함되게 설계될 경우(예: `min: 0, max: 5`), 분모 `b`가 `0`으로 무작위 선택될 수 있습니다. 이 경우 수식은 `0 ÷ 0` 혹은 `a ÷ 0` 형태가 되어 JavaScript 런타임에서 `Infinity` 또는 `NaN`이 반환되어 연산 오류가 발생합니다.
*   **개선안**: `b`를 난수로 추출한 후 분모가 `0`인 경우 반드시 예외 처리하거나 분모 생성 범위에서 `0`을 명시적으로 필터링하는 방어 루프가 동반되어야 합니다.

### 💾 불안정한 전역 캐싱 및 가비지 컬렉터 부하
*   **코드 현황**: `calculateWithPrecedence` (L468-L513) 연산자 우선순위 계산 시 캐싱용 전역 `Map`인 `calculationCache`를 사용하며, 1000개 초과 시 `calculationCache.keys().next().value`를 얻어 가장 먼저 생성된 캐시 엔트리를 제거합니다.
*   **문제점**:
    1.  ES6 Map의 삽입 순서에 의존하는 키 제거 방식은 다소 불안정하며, 연산 루프 중 주기적인 반복자(Iterator)의 호출은 런타임의 가비지 컬렉션(GC) 부하를 가중시킵니다.
    2.  사칙연산 계산의 복잡도보다 캐시 키 조인 문자열(`nums.join(',')|ops.join(',')`)을 생성하고 맵을 탐색하는 오버헤드가 더 클 수 있습니다.
*   **개선안**: 수식 생성 속도가 병목에 미치지 않는다면 캐시를 완전히 제거하거나, LRU 캐시 구현 라이브러리/독립된 FIFO 큐 클래스로 분리해야 합니다.

### ⌨️ 소수 입력 키패드 UI의 일관성 결여 (UX Issue)
*   **코드 현황**: 소수 문제 생성(`generateDecimalProblem`, L731-L754) 시, 소수 연산 결과가 우연히 정수로 떨어지면 (`Number.isInteger(roundedResult)`가 true인 경우) `inputType`을 강제로 `number`로 변경합니다. (예: `2.5 + 1.5 = 4.0` 일 때 inputType이 `number`가 됨)
*   **영향**: 소수 계산 문제임에도 불구하고 우연히 결과가 정수로 끝나는 레벨에서는 브라우저의 소수점(`.`) 입력 자판이 차단되는 기현상이 일어납니다. 이는 사용자에게 일관성 없는 키패드 조작 경험을 주어 혼란을 줍니다.
*   **개선안**: 결과 값의 정수 여부와 무관하게, 스테이지 타입이 `decimal`인 경우 항상 `inputType`을 `decimal`로 강제 고정하여 소수점 자판이 유지되게 하십시오.

---

## 9. 토스 연동 로그인 플로우의 보안 및 계층 설계 결함 (Auth Flow Flaws)

[tossAuth.ts](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/utils/tossAuth.ts) 유틸리티에서 연동 로그인 처리 시 계층 설계 위반 및 세션 정보 노출 우려가 발견되었습니다.

### 🔑 OAuth 로그인 처리 시 비밀번호 평문 노출
*   **코드 현황**: `handleTossLoginFlow` (L318-L327)에서 Edge Function을 통해 토스 토큰으로 가상 Supabase 유저 계정을 생성/조회한 후, 반환되는 `loginInfo.email`과 `loginInfo.password` 평문 패스워드를 프론트엔드로 받아와 클라이언트 측에서 `supabase.auth.signInWithPassword`를 호출하여 로그인 세션을 맺습니다.
*   **보안 리스크**:
    1.  사용자 인증 후 가상 계정의 비밀번호가 암호화되지 않은 채 클라이언트로 전송 및 브라우저 메모리에 일시 노출됩니다.
    2.  공격자가 해당 API 응답(Edge Function 반환값)을 탈취하거나 가상 계정 크리덴셜 규칙을 역추적할 경우, 토스 실명인증 단계를 우회하고 해당 사용자 계정에 수동으로 무단 로그인할 수 있게 됩니다.
*   **개선안**: 클라이언트 측에서 비밀번호 인증을 재시도하는 대신, Edge Function 내에서 Supabase `Service Role`을 활용해 계정을 생성 및 세션을 맺고 완성된 JWT access_token/refresh_token 세션 데이터만 리턴하게 하거나, Supabase가 지원하는 Custom Auth Provider 플로우를 설계해 비밀번호 노출을 제거해야 합니다.

### 💬 인프라/유틸 계층 내 프레젠테이션 메시지 하드코딩
*   **코드 현황**: L271-L290 등 API 호출 유틸리티 내부에서 `throw new Error("토스 API 인증에 실패했습니다...\n\n...")`와 같이 한글로 구성된 사용자 대상 프레젠테이션 경고 메시지를 하드코딩하여 던집니다.
*   **계층 설계 문제**: UI와 관계없는 낮은 수준(Low-level)의 유틸리티가 화면에 뿌려줄 레이아웃 텍스트 포맷을 주도하여 단일 책임 원칙(SRP)과 관심사 분리(SoC)를 위배하며, 다국어 지원(i18n) 확장을 매우 까다롭게 만듭니다.
*   **개선안**: 유틸리티 레이어에서는 로우 에러(Raw Error)나 정의된 오류 코드(예: `TOSS_AUTH_FAILED`)만을 던지고, 이 에러를 잡아서 UI 팝업/토스트 메시지로 변환하는 매핑 책임은 최상위 뷰(Page)나 global error handler 레이어로 이관해야 합니다.





