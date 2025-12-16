# 로그 찾는 단계별 가이드

## 🔍 현재 상황

`[토스 OAuth]`로 검색했지만 "Listening on http://localhost:9999/" 메시지만 보입니다.  
이것은 함수 시작 메시지일 뿐이고, 실제 API 호출 로그는 아직 나타나지 않았을 수 있습니다.

## ✅ 해결 방법

### 방법 1: 시간 범위 넓히기

현재 시간 범위가 **"15 Dec, 23:43 - 15 Dec, 23:45"**로 매우 좁습니다.

1. 시간 범위 드롭다운 클릭
2. **"Last 5 minutes"** 또는 **"Last 15 minutes"** 선택
3. 새로고침 버튼 클릭

### 방법 2: 검색어 변경

"Search events"에서 다른 키워드로 시도:

1. **`401`** - 인증 실패 로그
2. **`Authorization`** - Authorization 관련
3. **`Basic Auth`** - Basic Auth 관련
4. **`missing`** - "missing authorization" 메시지
5. **검색어 지우기** - 모든 로그 확인

### 방법 3: Severity 필터 사용

1. **Severity** 버튼 클릭
2. **ERROR** 또는 **WARN** 선택
3. 오류 로그만 확인

### 방법 4: Invocations 탭 확인

1. **Invocations** 탭 클릭
2. 최근 호출 목록 확인
3. 401 오류가 있는 호출 클릭
4. 상세 정보 확인

## 🎯 가장 확실한 방법: 다시 테스트

로그가 나타나지 않는다면, 다시 테스트를 실행하세요:

### 브라우저 콘솔에서:

```javascript
// 다시 테스트 실행
const SUPABASE_URL = 'https://aekcjzxxjczqibxkoakg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q43-3IDGF7tYxe-Z8sVIQw_3wx_7SdN';

(async () => {
  console.log('🧪 테스트 시작 - 시간:', new Date().toLocaleTimeString());
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/toss-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      authorizationCode: 'TEST_' + Date.now(),
      referrer: 'TEST',
    }),
  });
  
  const data = await response.json();
  console.log('✅ 상태:', response.status);
  console.log('✅ 시간:', new Date().toLocaleTimeString());
  console.log('✅ 응답:', data);
  
  console.log('\n📋 이제 Supabase 대시보드에서:');
  console.log('   1. 시간 범위를 "Last 5 minutes"로 변경');
  console.log('   2. 새로고침');
  console.log('   3. "401" 또는 "Authorization" 검색');
})();
```

### 실행 후 즉시:

1. Supabase 대시보드로 이동
2. 시간 범위를 **"Last 5 minutes"**로 변경
3. 새로고침
4. **"401"** 또는 **"Authorization"** 검색

## 📊 로그가 나타나면 확인할 것

로그를 클릭하면 오른쪽 패널에 상세 정보가 나타납니다.

### 확인할 값:

1. **`event_message`** 필드에서:
   - `[토스 OAuth]`로 시작하는 메시지 찾기
   - `AuthorizationLength` 값 찾기

2. **`metadata`** JSON에서:
   - `AuthorizationLength`: 6이면 문제, 50 이상이면 정상
   - `basicAuthLength`: 0이면 문제, 40 이상이면 정상

## 💡 팁

- 로그는 몇 초 후에 나타날 수 있습니다
- 새로고침을 여러 번 클릭해보세요
- 시간 범위를 넓히면 더 많은 로그를 볼 수 있습니다
- Invocations 탭에서도 호출 기록을 확인할 수 있습니다

## 🚀 빠른 해결

로그 확인이 어렵다면, 일단 **값을 재설정**하는 것이 빠를 수 있습니다:

1. 토스 개발자센터에서 `client_id:client_secret` 확인
2. Base64 인코딩
3. Supabase Secrets에 재설정
4. Edge Functions 재배포
5. 다시 테스트

이렇게 하면 문제가 해결될 가능성이 높습니다!
