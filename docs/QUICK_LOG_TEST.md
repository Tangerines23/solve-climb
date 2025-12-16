# 빠른 로그 생성 및 확인 가이드

## 🎯 문제: 로그가 없다면?

"AuthorizationLength"로 검색했는데 결과가 없다는 것은:
- 아직 `toss-oauth` 함수가 호출되지 않았거나
- 로그가 다른 이름으로 저장되었을 수 있습니다

## ✅ 해결 방법: 로그를 직접 생성하기

### 방법 1: 브라우저 콘솔에서 직접 테스트 (가장 빠름)

브라우저 개발자 도구 콘솔에서 실행:

```javascript
// 1. 환경 변수 확인 (프로젝트 루트의 .env 파일에서 확인)
const SUPABASE_URL = 'https://your-project.supabase.co'; // VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // VITE_SUPABASE_ANON_KEY

// 2. Edge Function 테스트
const testOAuth = async () => {
  console.log('🧪 toss-oauth Edge Function 테스트 시작...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/toss-oauth`);
  
  try {
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
    
    const data = await response.json();
    console.log('✅ 응답 상태:', response.status);
    console.log('✅ 응답 데이터:', data);
    
    console.log('\n📋 이제 Supabase 대시보드에서:');
    console.log('1. 새로고침 버튼 클릭');
    console.log('2. "Search events"에 "[토스 OAuth]" 입력');
    console.log('3. 또는 "401" 또는 "Authorization" 검색');
    console.log('4. 최신 로그 확인');
    
    return data;
  } catch (error) {
    console.error('❌ 오류:', error);
  }
};

// 실행
testOAuth();
```

### 방법 2: 실제 로그인 시도

1. 토스 앱에서 실제로 로그인 버튼 클릭
2. Supabase 대시보드로 돌아가기
3. 새로고침
4. 검색

## 🔍 검색어 변경

"AuthorizationLength"가 없으면 다른 키워드로 시도:

1. **`[토스 OAuth]`** - 모든 토스 OAuth 로그
2. **`401`** - 인증 실패 로그
3. **`Authorization`** - Authorization 관련 로그
4. **`Basic Auth`** - Basic Auth 관련 로그
5. **`missing authorization`** - 특정 에러 메시지

## 📊 로그가 생성되면 확인할 항목

로그가 나타나면 다음을 확인하세요:

### 정상 동작 시:
```json
{
  "AuthorizationLength": 50 이상,
  "basicAuthLength": 40 이상,
  "status": 200
}
```

### 문제 발생 시:
```json
{
  "AuthorizationLength": 6,
  "basicAuthLength": 0,
  "status": 401,
  "errorMessage": "missing authorization header"
}
```

## 💡 팁

- 로그는 실시간으로 나타나지 않을 수 있습니다 (몇 초 지연)
- 새로고침 버튼을 여러 번 클릭해보세요
- 시간 범위를 "Last 5 minutes"로 좁혀서 확인하세요
