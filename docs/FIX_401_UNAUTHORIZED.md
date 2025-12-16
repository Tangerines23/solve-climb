# 401 Unauthorized 오류 해결 가이드

## 🚨 문제

`window.testTossOAuth()` 실행 시 401 Unauthorized 오류 발생:

```
POST https://xxx.supabase.co/functions/v1/toss-oauth 401 (Unauthorized)
```

## 🔍 원인

Supabase Edge Function은 기본적으로 인증이 필요합니다. `apikey` 헤더만으로는 부족할 수 있고, `Authorization` 헤더도 필요합니다.

## ✅ 해결 방법

### 방법 1: Authorization 헤더 추가 (권장)

`src/utils/tossAuth.ts` 파일의 `testTossOAuth` 함수에 `Authorization` 헤더를 추가했습니다:

```typescript
headers: {
  'Content-Type': 'application/json',
  'apikey': ENV.SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY || ''}`, // 추가됨
}
```

### 방법 2: Edge Function 인증 설정 확인

Edge Function이 인증 없이 호출 가능하도록 설정되어 있는지 확인:

1. Supabase 대시보드 접속
2. Edge Functions > toss-oauth 선택
3. Settings에서 인증 설정 확인

### 방법 3: 환경 변수 확인

`.env` 파일에 올바른 값이 설정되어 있는지 확인:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx...
```

## 🔄 다음 단계

1. **브라우저 새로고침** (F5)
2. **다시 테스트**:
   ```javascript
   await window.testTossOAuth();
   ```

## 📋 예상 결과

### 성공 시

```javascript
{
  success: false,  // 테스트 코드이므로 실제 인증은 실패하지만
  status: 400,     // 401이 아닌 400 (Bad Request) 또는 다른 오류
  response: {
    error: "authorizationCode is required" 또는 다른 오류
  }
}
```

**의미**: Edge Function에 접근할 수 있습니다! (401이 아닌 다른 오류는 정상)

### 여전히 401 오류인 경우

1. **환경 변수 확인**:
   ```javascript
   console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
   ```

2. **Edge Function 로그 확인**:
   ```bash
   supabase functions logs toss-oauth --limit 20
   ```

3. **Supabase 대시보드에서 확인**:
   - Edge Functions > toss-oauth > Settings
   - 인증 설정 확인

## 💡 참고

- 401 오류는 Edge Function에 접근할 수 없다는 의미입니다
- 400 오류는 Edge Function에 접근할 수 있지만 요청이 잘못되었다는 의미입니다 (정상)
- 테스트 코드(`TEST_CODE`)를 사용하므로 실제 인증은 실패하지만, Edge Function 접근 여부는 확인할 수 있습니다

