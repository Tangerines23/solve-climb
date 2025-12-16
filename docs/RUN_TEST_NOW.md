# 지금 바로 테스트하기

## 🚀 브라우저 콘솔에서 실행

브라우저 개발자 도구 콘솔(F12)에서 아래 코드를 **전체 복사**해서 실행하세요:

```javascript
// 환경 변수 (자동 설정됨)
const SUPABASE_URL = 'https://aekcjzxxjczqibxkoakg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q43-3IDGF7tYxe-Z8sVIQw_3wx_7SdN';

// toss-oauth Edge Function 테스트
(async () => {
  console.log('🧪 toss-oauth Edge Function 테스트 시작...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/toss-oauth`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/toss-oauth`, {
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
    
    console.log('\n✅ 응답 상태:', response.status);
    console.log('✅ 응답 시간:', `${duration}ms`);
    console.log('✅ 응답 데이터:', responseData);
    
    if (response.status === 401) {
      console.log('\n⚠️ 401 인증 실패 - TOSS_API_BASIC_AUTH 값 확인 필요');
    } else if (response.status === 500) {
      console.log('\n⚠️ 서버 오류 - Edge Function 로그 확인 필요');
    }
    
    console.log('\n📋 이제 Supabase 대시보드에서:');
    console.log('   1. Edge Functions > toss-oauth > Logs 이동');
    console.log('   2. 새로고침 버튼 클릭');
    console.log('   3. "Search events"에 "[토스 OAuth]" 입력');
    console.log('   4. 또는 "401" 또는 "AuthorizationLength" 검색');
    console.log('   5. 최신 로그 확인');
    
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
})();
```

## 📋 실행 후 확인할 것

### 1. 콘솔 응답 확인

콘솔에 나타나는 응답 상태를 확인:
- **200**: 성공 (하지만 TEST_CODE이므로 실제로는 실패할 수 있음)
- **401**: 인증 실패 → `TOSS_API_BASIC_AUTH` 값 문제
- **500**: 서버 오류 → Edge Function 로그 확인 필요

### 2. Supabase 대시보드에서 로그 확인

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Edge Functions** > `toss-oauth` 선택
4. **Logs** 탭 클릭
5. 새로고침 버튼 클릭
6. "Search events"에 `[토스 OAuth]` 입력

### 3. 로그에서 확인할 값

로그가 나타나면 다음 값만 확인:

#### 정상:
```json
{
  "AuthorizationLength": 50 이상,
  "basicAuthLength": 40 이상
}
```

#### 문제:
```json
{
  "AuthorizationLength": 6,
  "basicAuthLength": 0,
  "status": 401,
  "errorMessage": "missing authorization header"
}
```

## 💡 다음 단계

로그에서 `AuthorizationLength` 값이:
- **50 이상** → 값은 있지만 다른 문제일 수 있음
- **6** → 값이 없음 → `TOSS_API_BASIC_AUTH` 재설정 필요

로그 값을 알려주시면 정확히 진단해드리겠습니다!
