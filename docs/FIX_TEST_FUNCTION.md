# window.testTossOAuth 함수가 없는 문제 해결

## 🚨 문제

브라우저 콘솔에서 `window.testTossOAuth()`를 실행하면 다음 오류가 발생:

```
Uncaught TypeError: window.testTossOAuth is not a function
```

## ✅ 해결 방법

`src/main.tsx` 파일에 `tossAuth.ts`를 import하도록 수정했습니다:

```typescript
// src/main.tsx
import './utils/tossAuth'; // 추가됨
```

이제 `tossAuth.ts` 파일이 로드되면서 `window.testTossOAuth` 함수가 등록됩니다.

## 🔄 다음 단계

1. **브라우저 새로고침** (F5 또는 Ctrl+R)
2. **개발자 도구 콘솔 열기** (F12)
3. **다시 테스트**:
   ```javascript
   await window.testTossOAuth();
   ```

## 📋 사용 가능한 함수들

`tossAuth.ts`가 로드되면 다음 함수들을 사용할 수 있습니다:

- `window.testTossOAuth()` - toss-oauth Edge Function 테스트
- `window.testTossAuth(accessToken)` - toss-auth Edge Function 테스트
- `window.checkTossLoginFlow()` - 전체 로그인 플로우 체크
- `window.testFullLoginFlow()` - 전체 로그인 플로우 테스트 (토스 앱에서만)
- `window.testGameLoginMigration()` - 게임 로그인 마이그레이션 테스트 (토스 앱에서만)

## 💡 참고

함수들이 등록되면 콘솔에 다음과 같은 메시지가 표시됩니다:

```
💡 개발 모드: 브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:
   - window.checkTossLoginFlow() : 전체 로그인 플로우 체크
   - window.testTossOAuth() : toss-oauth Edge Function 테스트
   ...
```

