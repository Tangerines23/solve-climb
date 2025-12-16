# 지금 바로 로그 확인하기

## ✅ 테스트 완료!

콘솔에서 **401 Unauthorized** 오류가 발생했습니다.  
이제 Supabase 대시보드에서 로그를 확인해야 합니다.

## 📋 Supabase 대시보드에서 로그 확인

### Step 1: 대시보드 접속
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 (aekcjzxxjczqibxkoakg)

### Step 2: Edge Functions 로그로 이동
1. 왼쪽 메뉴에서 **Edge Functions** 클릭
2. `toss-oauth` 함수 클릭
3. **Logs** 탭 클릭

### Step 3: 로그 검색
1. **새로고침** 버튼 클릭 (오른쪽 상단)
2. "Search events" 입력란에 다음 중 하나 입력:
   - `[토스 OAuth]`
   - `401`
   - `Authorization`
   - `missing authorization`

### Step 4: 최신 로그 확인
가장 위에 있는 최신 로그를 클릭하면 상세 정보를 볼 수 있습니다.

## 🔍 로그에서 확인할 핵심 값

로그를 클릭하면 오른쪽 패널에 상세 정보가 나타납니다.  
다음 값들을 확인하세요:

### 1. `AuthorizationLength` 값 찾기
로그 메시지에서:
```json
{
  "AuthorizationLength": 6,  // ← 이 값이 중요!
  ...
}
```

또는
```json
{
  "authorizationHeaderLength": 6,  // ← 이것도 확인
  ...
}
```

### 2. `basicAuthLength` 값 찾기
```json
{
  "basicAuthLength": 0,  // ← 이 값도 중요!
  ...
}
```

## 📊 값에 따른 진단

### `AuthorizationLength`가 **6**인 경우
- 문제: `TOSS_API_BASIC_AUTH` 값이 없거나 비어있음
- 해결: Supabase Secrets에 올바른 값 재설정 필요

### `AuthorizationLength`가 **50 이상**인 경우
- 문제: 값은 있지만 토스 API가 인식하지 못함
- 해결: Base64 인코딩이 올바른지 확인 필요

### `basicAuthLength`가 **0**인 경우
- 문제: 환경 변수에서 값을 가져오지 못함
- 해결: Supabase Secrets 확인 및 재설정 필요

## 💡 빠른 해결 방법

로그를 확인하기 어렵다면, 일단 **값을 재설정**하는 것이 빠를 수 있습니다:

### 1. 토스 개발자센터에서 값 확인
- [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- 내 앱 > 설정 > OAuth 설정
- `client_id`와 `client_secret` 확인

### 2. Base64 인코딩
브라우저 콘솔에서:
```javascript
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('설정할 값:', basicAuth);
console.log(`\nsupabase secrets set TOSS_API_BASIC_AUTH="${basicAuth}"`);
```

### 3. Supabase Secrets에 설정
터미널에서:
```bash
supabase secrets set TOSS_API_BASIC_AUTH="위에서_생성한_값"
```

### 4. Edge Functions 재배포
```bash
supabase functions deploy toss-oauth
```

## 🎯 다음 단계

1. **Supabase 대시보드에서 로그 확인**
   - `AuthorizationLength` 값 확인
   - 값이 6이면 → Secrets 재설정 필요
   - 값이 50 이상이면 → 다른 문제일 수 있음

2. **로그 값을 알려주시면**
   - 정확한 원인 진단
   - 구체적인 해결 방법 제시

로그에서 `AuthorizationLength` 값을 찾아서 알려주세요!
