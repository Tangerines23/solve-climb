# 🔍 코드 감사 리포트 (Code Audit Report)

**생성일:** 2024년  
**아키텍처:** 백엔드 서버 없이 Supabase와 토스 SDK만 사용하는 구조

---

## 📋 요약

총 **3개 파일**이 아키텍처와 맞지 않거나 불필요한 것으로 확인되었습니다.

---

## 🗑️ 삭제 권장 파일 (Delete List)

### 1. `src/utils/tossAuth.ts`
**이유:** 
- **Rule A 위반** - 존재하지 않는 백엔드 서버(`APP_CONFIG.API_BASE_URL`)를 호출하는 코드 포함
- `getAccessToken()` 함수가 `${APP_CONFIG.API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token` 호출
- `getUserInfo()` 함수가 `${APP_CONFIG.API_BASE_URL}/api-partner/v1/apps-in-toss/user/me` 호출
- 이 API 엔드포인트는 실제로 존재하지 않아 작동하지 않는 죽은 코드(Dead Code)

**의존성:**
- `src/pages/MyPage.tsx`에서 `loginWithToss()` 함수를 import하여 사용 중

**영향:**
- `MyPage.tsx`의 토스 로그인 기능이 작동하지 않음 (네트워크 에러 발생)

---

### 2. `src/utils/googleAuth.ts`
**이유:**
- **Rule C 위반** - 낙동강 오리알 컴포넌트
- `ProfileForm.tsx`에서 모든 관련 코드가 주석 처리되어 있음
- 실제로 사용되지 않는 파일 (사용처 없음)
- Google OAuth API 호출은 정상이지만, 프로젝트에서 사용하지 않음

**의존성:**
- 없음 (모든 import가 주석 처리됨)

**영향:**
- 없음 (사용되지 않음)

---

## 🛠️ 수정 필요 파일 (Refactor List)

### 1. `src/pages/MyPage.tsx`
**문제점:**
- 삭제 대상 파일(`tossAuth.ts`)의 `loginWithToss()` 함수를 import하여 사용 중
- 128번째 줄: `const tossUser = await loginWithToss();` 호출
- 이 코드는 백엔드 서버가 없으므로 작동하지 않음

**해결책:**
- `loginWithToss()` 호출 부분을 제거하거나
- 토스 SDK의 `appLogin()`을 직접 사용하도록 수정
- 또는 토스 로그인 기능을 완전히 제거하고 익명 로그인만 사용

**권장 수정:**
```typescript
// 삭제할 코드:
import { loginWithToss } from '../utils/tossAuth';
const tossUser = await loginWithToss();

// 대체 방안 1: 토스 SDK 직접 사용 (백엔드 없이)
import { appLogin } from '@apps-in-toss/web-framework';
const result = await appLogin();
// result에서 authorizationCode만 사용하고, 사용자 정보는 로컬에서 관리

// 대체 방안 2: 토스 로그인 기능 제거
// 토스 로그인 버튼을 제거하고 익명 로그인만 사용
```

---

### 2. `src/config/app.ts`
**문제점:**
- `API_BASE_URL` 설정이 정의되어 있지만, 실제로는 사용되지 않아야 함
- 현재 `tossAuth.ts`에서만 사용 중 (삭제 예정)

**해결책:**
- `API_BASE_URL` 설정을 제거하거나 주석 처리
- 또는 향후 사용 계획이 있다면 유지하되, 현재는 사용하지 않음을 명시

**권장 수정:**
```typescript
// 제거 또는 주석 처리:
// API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.solveclimb.com',
```

---

## ❓ 확인 필요 (Review Needed)

### 1. `src/utils/googleAuth.ts`의 `handleGoogleCallback()` 함수
**이유:**
- Google OAuth 콜백 처리 함수가 있지만, 실제로 사용되지 않음
- 주석에 "프로덕션에서는 반드시 서버를 통해 처리해야 합니다"라고 명시되어 있음
- 현재 프로젝트는 백엔드 서버가 없으므로 이 함수는 사용할 수 없음

**권장사항:**
- 파일 전체를 삭제하거나
- 향후 Google 로그인 기능이 필요할 때 다시 구현

---

## ✅ 정상 파일 (No Issues)

### 1. `src/utils/tossGameCenter.ts`
- 토스 SDK 연동의 핵심 파일
- `submitScoreToLeaderboard()`, `openLeaderboard()` 함수가 올바르게 구현됨
- 백엔드 서버 없이 토스 SDK만 사용하는 구조에 맞음
- **유지 필요**

### 2. `src/hooks/useMyPageStats.ts`
- Supabase를 사용하여 통계를 가져오는 Hook
- 로컬 세션과 Supabase 세션을 모두 지원
- **정상 작동**

---

## 📊 통계

- **삭제 권장:** 2개 파일
- **수정 필요:** 2개 파일
- **확인 필요:** 1개 항목
- **정상:** 2개 파일

---

## 🎯 우선순위

### 높음 (High Priority)
1. `src/utils/tossAuth.ts` 삭제
2. `src/pages/MyPage.tsx` 수정 (토스 로그인 기능 제거 또는 수정)

### 중간 (Medium Priority)
3. `src/utils/googleAuth.ts` 삭제 (사용되지 않음)
4. `src/config/app.ts`에서 `API_BASE_URL` 제거 또는 주석 처리

### 낮음 (Low Priority)
5. 코드 정리 및 주석 업데이트

---

## 📝 참고사항

- 현재 프로젝트는 **로컬 스토리지**와 **Supabase**만 사용하는 구조
- 토스 SDK는 게임 센터 기능(점수 제출, 리더보드 열기)만 사용
- 인증은 Supabase Auth 또는 로컬 세션으로 처리
- 백엔드 서버가 없으므로, 모든 백엔드 API 호출 코드는 작동하지 않음

