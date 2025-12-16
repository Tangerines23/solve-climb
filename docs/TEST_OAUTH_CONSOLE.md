# 브라우저 콘솔에서 toss-oauth 테스트하기

## 🚀 빠른 테스트 방법

브라우저 개발자 도구 콘솔에서 아래 코드를 복사해서 실행하세요:

```javascript
// Supabase URL과 Anon Key 확인 (프로젝트 루트의 .env 파일 참고)
const SUPABASE_URL = 'https://your-project.supabase.co'; // VITE_SUPABASE_URL 값
const SUPABASE_ANON_KEY = 'your-anon-key'; // VITE_SUPABASE_ANON_KEY 값

// toss-oauth Edge Function 테스트
const testOAuth = async () => {
  console.log('🧪 toss-oauth Edge Function 테스트 시작...');
  
  const oauthUrl = `${SUPABASE_URL}/functions/v1/toss-oauth`;
  console.log('URL:', oauthUrl);
  
  try {
    const startTime = Date.now();
    const response = await fetch(oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        authorizationCode: 'TEST_CODE_12345',
        referrer: 'TEST',
      }),
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log('✅ 응답 상태:', response.status);
    console.log('✅ 응답 시간:', `${duration}ms`);
    console.log('✅ 응답 데이터:', responseData);
    
    console.log('\n📋 이제 Supabase 대시보드에서:');
    console.log('1. Edge Functions > toss-oauth > Logs 이동');
    console.log('2. 새로고침 버튼 클릭');
    console.log('3. "Search events"에 "[토스 OAuth]" 입력');
    console.log('4. 또는 "401" 또는 "Authorization" 검색');
    console.log('5. 최신 로그 확인');
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      response: responseData,
    };
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// 실행
testOAuth();
```

## 📝 사용 방법

### Step 1: 환경 변수 확인

프로젝트 루트의 `.env` 파일에서:
- `VITE_SUPABASE_URL` 값 복사
- `VITE_SUPABASE_ANON_KEY` 값 복사

### Step 2: 코드 수정

위 코드에서 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`를 실제 값으로 변경

### Step 3: 실행

브라우저 콘솔에 붙여넣고 실행

### Step 4: 로그 확인

Supabase 대시보드에서 로그 확인

## 🔍 로그에서 확인할 항목

로그가 나타나면 다음을 확인:

### 정상 동작 시:
```
[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 50+,  ← ✅ 충분한 길이
  basicAuthLength: 40+,
}

[토스 OAuth] 응답 받음: {
  status: 200,  ← ✅ 성공
}
```

### 문제 발생 시:
```
[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 6,  ← ❌ "Basic "만 있음
  basicAuthLength: 0,     ← ❌ 값이 없음
}

[토스 OAuth] 응답 받음: {
  status: 401,  ← ❌ 인증 실패
}

[토스 OAuth] 401 인증 실패 상세 정보: {
  errorMessage: "missing authorization header",
  ...
}
```

## 💡 팁

- 로그는 몇 초 후에 나타날 수 있습니다
- 새로고침 버튼을 여러 번 클릭해보세요
- 시간 범위를 "Last 5 minutes"로 좁혀서 확인하세요
