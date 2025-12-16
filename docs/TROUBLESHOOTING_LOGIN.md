# 로그인 문제 해결 가이드

## 🔍 문제 진단 방법

### 1. Supabase Edge Functions 로그 확인

#### 방법 1: Supabase 대시보드 사용 (권장)

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Edge Functions** 클릭
4. `toss-oauth` 함수 선택
5. **Logs** 탭 클릭
6. 최근 로그 확인

#### 방법 2: Supabase CLI 사용

```bash
# 로컬에서 Edge Functions 실행 중일 때만 사용 가능
supabase functions serve toss-oauth

# 또는 모든 함수 실행
supabase functions serve
```

### 2. "missing authorization header" 오류 해결

이 오류는 `TOSS_API_BASIC_AUTH` 환경 변수 문제일 가능성이 높습니다.

#### 체크리스트

1. **Supabase Secrets 확인**
   ```bash
   supabase secrets list
   ```
   - `TOSS_API_BASIC_AUTH`가 목록에 있는지 확인

2. **값 형식 확인**
   - 올바른 형식: Base64 인코딩된 `client_id:client_secret`
   - 예: `Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=` (Base64)
   - ❌ "Basic " 접두사 포함하면 안 됨 (코드에서 자동 제거하지만 확인 필요)

3. **토스 개발자센터에서 값 확인**
   - [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
   - 내 앱 > 설정 > OAuth 설정
   - `client_id`와 `client_secret` 확인
   - Base64 인코딩: `btoa('client_id:client_secret')` (브라우저 콘솔에서)

4. **Secrets 재설정 (필요시)**
   ```bash
   # 올바른 Base64 값으로 재설정
   supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="
   ```

5. **Edge Functions 재배포**
   ```bash
   supabase functions deploy toss-oauth
   supabase functions deploy toss-auth
   ```

### 3. 로그에서 확인할 항목

Supabase Functions 로그에서 다음을 확인하세요:

#### 정상 동작 시
```
[토스 OAuth] 토스 API 요청 준비: {
  url: "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token",
  hasAuthHeader: true,
  authHeaderLength: 50+,
  authHeaderPrefix: "Basic Y2xpZW50X2lk...",
  basicAuthLength: 40+,
}
```

#### 문제 발생 시
```
[토스 OAuth] 401 인증 실패 상세 정보: {
  status: 401,
  errorMessage: "missing authorization header",
  hasBasicAuth: true/false,
  basicAuthLength: 0 또는 매우 짧음,
  authHeaderSent: "Basic ...",
}
```

### 4. 로컬 개발 환경에서 "로그인을 완료할 수 없다" 오류

이것은 정상입니다. 로컬 개발 환경(샌드박스)에서는:
- 토스 SDK 함수들이 제대로 작동하지 않을 수 있습니다
- 실제 토스 앱에서만 완전한 테스트가 가능합니다

**해결 방법**:
- 로컬에서는 Edge Function 연결만 테스트
- 실제 로그인 테스트는 AIT 배포 후 또는 실제 토스 앱에서

## 🛠️ 단계별 해결 절차

### Step 1: Secrets 값 확인

```bash
# Secrets 목록 확인 (이미 확인함)
supabase secrets list

# 실제 값 확인 (마스킹되지 않은 값)
# 주의: 이 명령어는 값의 일부만 보여줄 수 있습니다
```

### Step 2: Base64 인코딩 확인

브라우저 콘솔에서:
```javascript
// 토스 개발자센터에서 확인한 client_id와 client_secret
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('Base64 인코딩된 값:', basicAuth);

// 이 값이 Supabase Secrets의 TOSS_API_BASIC_AUTH와 일치하는지 확인
```

### Step 3: Edge Functions 재배포

```bash
# 수정된 코드 배포
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
supabase functions deploy migration-status
supabase functions deploy migration-link
```

### Step 4: 테스트 및 로그 확인

1. 실제 토스 앱에서 로그인 시도
2. Supabase 대시보드에서 Edge Functions 로그 확인
3. `[토스 OAuth]` 로그에서 실제 전송된 헤더 확인

## 📋 체크리스트

### "missing authorization header" 해결

- [ ] Supabase Secrets에 `TOSS_API_BASIC_AUTH` 설정됨
- [ ] 값이 Base64 인코딩된 `client_id:client_secret` 형식
- [ ] "Basic " 접두사 없음
- [ ] 토스 개발자센터의 `client_id:client_secret`과 일치
- [ ] Edge Functions 재배포 완료
- [ ] Supabase Functions 로그에서 실제 헤더 확인

### 로컬 개발 환경

- [ ] 로컬 개발 서버 실행 (`npm run dev`)
- [ ] "로컬 개발 환경에서는..." 메시지 확인 (정상)
- [ ] 실제 토스 앱에서 테스트 필요 안내 확인

## 🔧 추가 디버깅

### Edge Function에서 직접 테스트

브라우저 콘솔에서:
```javascript
// toss-oauth Edge Function 직접 테스트
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

이렇게 하면 Edge Function이 실제로 어떻게 응답하는지 확인할 수 있습니다.

## 💡 참고

- Supabase Functions 로그는 실시간으로 업데이트됩니다
- 로그는 최대 7일간 보관됩니다
- 프로덕션 환경과 로컬 환경의 로그는 별도로 관리됩니다
