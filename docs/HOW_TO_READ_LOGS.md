# Supabase Edge Functions 로그 읽는 방법

## 🔍 로그에서 찾아야 할 항목

### 1. 실제 API 호출 로그 찾기

현재 보이는 로그는 함수 시작/종료 메시지입니다.  
**실제 로그인 시도 시 생성되는 로그**를 찾아야 합니다.

#### 찾아야 할 로그 키워드:

1. **`[토스 OAuth]`** - 모든 토스 OAuth 관련 로그
2. **`최종 요청 정보`** - 실제 API 호출 전 헤더 정보
3. **`응답 받음`** - 토스 API 응답 상태
4. **`401 인증 실패`** - 인증 오류 상세 정보
5. **`AuthorizationLength`** - 헤더 길이 (중요!)

### 2. 로그 필터링 방법

Supabase 대시보드에서:

1. **"Search events"** 입력란에 다음 키워드 입력:
   ```
   [토스 OAuth]
   ```
   또는
   ```
   AuthorizationLength
   ```
   또는
   ```
   401
   ```

2. **시간 범위 변경**:
   - "Last hour" → "Last 24 hours" 또는 "Last 7 days"로 변경
   - 실제 로그인을 시도한 시간대의 로그 확인

3. **Severity 필터**:
   - "ERROR" 또는 "WARN" 선택하여 오류 로그만 확인

### 3. 로그 읽는 방법

#### 정상 동작 시 로그 예시:

```
[토스 OAuth] 토스 API 요청 준비: {
  url: "https://apps-in-toss-api.toss.im/...",
  hasAuthHeader: true,
  authHeaderLength: 50+,        ← ✅ 충분한 길이
  basicAuthLength: 40+,         ← ✅ 값이 있음
  ...
}

[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 50+,     ← ✅ 중요!
  ...
}

[토스 OAuth] 응답 받음: {
  status: 200,                  ← ✅ 성공
  ok: true,
  ...
}
```

#### 문제 발생 시 로그 예시:

```
[토스 OAuth] Basic Auth 값이 너무 짧거나 비어있습니다: {
  basicAuthLength: 0,           ← ❌ 값이 없음
  ...
}

또는

[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 6,      ← ❌ "Basic "만 있음
  ...
}

[토스 OAuth] 응답 받음: {
  status: 401,                  ← ❌ 인증 실패
  ok: false,
  ...
}

[토스 OAuth] 401 인증 실패 상세 정보: {
  errorMessage: "missing authorization header",
  basicAuthLength: 0,          ← ❌ 값이 없음
  ...
}
```

## 📋 단계별 로그 확인 가이드

### Step 1: 로그인 시도

토스 앱에서 실제로 로그인을 시도합니다.

### Step 2: 로그 새로고침

Supabase 대시보드에서:
- 새로고침 버튼 클릭
- 또는 시간 범위를 "Last 5 minutes"로 변경

### Step 3: 검색

"Search events"에 다음 중 하나 입력:
- `[토스 OAuth]`
- `AuthorizationLength`
- `401`
- `missing authorization`

### Step 4: 로그 확인

다음 항목을 확인하세요:

1. **`AuthorizationLength` 값**
   - 6 → 값이 없음 ❌
   - 50 이상 → 값이 있음 ✅

2. **`basicAuthLength` 값**
   - 0 → 값이 없음 ❌
   - 40 이상 → 값이 있음 ✅

3. **응답 상태**
   - 200 → 성공 ✅
   - 401 → 인증 실패 ❌

## 🎯 빠른 확인 방법

### 브라우저 콘솔에서 테스트

실제 로그인을 시도하기 전에, Edge Function을 직접 호출해서 로그를 확인할 수 있습니다:

```javascript
// 브라우저 콘솔에서 실행
const testOAuth = async () => {
  const response = await fetch('https://[your-project].supabase.co/functions/v1/toss-oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '[your-anon-key]',
    },
    body: JSON.stringify({
      authorizationCode: 'TEST_CODE',
      referrer: 'TEST',
    }),
  });
  
  const data = await response.json();
  console.log('응답:', data);
};

testOAuth();
```

이렇게 하면 즉시 로그가 생성되어 확인할 수 있습니다.

## 💡 팁

- 로그는 실시간으로 업데이트되지 않을 수 있습니다. 새로고침을 눌러주세요.
- 로그가 너무 많으면 검색 기능을 활용하세요.
- 시간 범위를 좁혀서 최근 로그만 확인하세요.
- "ERROR" 레벨만 필터링하면 문제가 있는 로그만 볼 수 있습니다.
