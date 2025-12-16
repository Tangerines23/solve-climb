# TOSS_API_BASIC_AUTH 값 확인 및 검증 가이드

Supabase Secrets는 보안상 실제 값을 보여주지 않습니다 (Digest만 표시).  
실제 값이 올바른지 확인하는 방법을 안내합니다.

## 🔍 방법 1: Edge Functions 로그로 확인 (가장 확실함)

### Step 1: Edge Functions 재배포

```bash
supabase functions deploy toss-oauth
```

### Step 2: 실제 로그인 테스트

토스 앱에서 로그인을 시도합니다.

### Step 3: Supabase 대시보드에서 로그 확인

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Edge Functions** > `toss-oauth` 선택
4. **Logs** 탭 클릭
5. 최근 로그에서 다음을 확인:

```
[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 50+,  // ← 이 값이 중요!
  ...
}
```

**확인 포인트**:
- `AuthorizationLength`가 **6**이면 → "Basic "만 있고 값이 없음 ❌
- `AuthorizationLength`가 **50 이상**이면 → 올바른 값이 있음 ✅

## 🔧 방법 2: 올바른 값으로 재설정

### Step 1: 토스 개발자센터에서 값 확인

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 내 앱 선택
3. **설정** > **OAuth 설정** 이동
4. `client_id`와 `client_secret` 확인

### Step 2: Base64 인코딩

브라우저 개발자 도구 콘솔에서:

```javascript
// 토스 개발자센터에서 확인한 실제 값
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('✅ Base64 인코딩된 값:', basicAuth);
console.log('길이:', basicAuth.length);

// 검증: 디코딩해서 확인
const decoded = atob(basicAuth);
console.log('디코딩 확인:', decoded);
console.log('형식 확인:', decoded.includes(':'));

// 설정 명령어 출력
console.log('\n📋 Supabase Secrets 설정 명령어:');
console.log(`supabase secrets set TOSS_API_BASIC_AUTH="${basicAuth}"`);
```

### Step 3: Supabase Secrets에 설정

터미널에서:

```bash
# 위에서 생성한 Base64 값으로 설정
supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="

# 확인
supabase secrets list
```

### Step 4: Edge Functions 재배포

```bash
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
supabase functions deploy migration-status
supabase functions deploy migration-link
```

## 📊 로그로 확인하는 방법

### 정상 동작 시 로그

```
[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 50+,  // ✅ 충분한 길이
  ...
}
[토스 OAuth] 응답 받음: {
  status: 200,
  ok: true,
  ...
}
```

### 문제 발생 시 로그

```
[토스 OAuth] 최종 요청 정보: {
  AuthorizationLength: 6,  // ❌ "Basic "만 있음
  ...
}
[토스 OAuth] 응답 받음: {
  status: 401,
  ok: false,
  ...
}
[토스 OAuth] 401 인증 실패 상세 정보: {
  errorMessage: "missing authorization header",
  basicAuthLength: 0,  // ❌ 값이 없음
  ...
}
```

## ✅ 체크리스트

### 값 재설정

- [ ] 토스 개발자센터에서 `client_id`와 `client_secret` 확인
- [ ] Base64 인코딩 완료 (`btoa('client_id:client_secret')`)
- [ ] 디코딩해서 `:` 구분자 확인
- [ ] Supabase Secrets에 설정 완료
- [ ] Edge Functions 재배포 완료

### 로그 확인

- [ ] Supabase 대시보드에서 `toss-oauth` 로그 확인
- [ ] `AuthorizationLength`가 50 이상인지 확인
- [ ] 401 오류가 발생하지 않는지 확인

## 🚨 문제 해결

### "missing authorization header" 오류가 계속 발생하면

1. **로그에서 `AuthorizationLength` 확인**
   - 6이면 → 값이 설정되지 않음
   - 50 이상이면 → 값은 있지만 형식이 잘못됨

2. **값 재설정**
   ```bash
   # 토스 개발자센터에서 확인한 값으로 재설정
   supabase secrets set TOSS_API_BASIC_AUTH="새로운_base64_값"
   supabase functions deploy toss-oauth
   ```

3. **토스 개발자센터 확인**
   - `client_id`와 `client_secret`이 올바른지 확인
   - OAuth 설정이 활성화되어 있는지 확인

## 💡 팁

- Supabase Secrets는 한 번 설정하면 값이 보이지 않으므로,  
  올바른 값을 별도로 안전하게 보관하세요.
- Base64 인코딩은 브라우저 콘솔에서 `btoa()` 함수로 쉽게 할 수 있습니다.
- Edge Functions 로그가 가장 확실한 진단 도구입니다.
