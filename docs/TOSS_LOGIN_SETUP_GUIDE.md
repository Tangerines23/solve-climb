# 토스 앱인토스 로그인 기능 설정 가이드

이 문서는 Solve Climb 프로젝트에 토스 앱인토스 로그인 기능을 설정하는 전체 과정을 안내합니다.

---

## 📋 목차

1. [개요](#개요)
2. [사전 준비사항](#사전-준비사항)
3. [Step 1: 토스 개발자센터 설정](#step-1-토스-개발자센터-설정)
4. [Step 2: Supabase Secrets 설정](#step-2-supabase-secrets-설정)
5. [Step 3: 클라이언트 환경 변수 설정](#step-3-클라이언트-환경-변수-설정)
6. [Step 4: Edge Functions 배포](#step-4-edge-functions-배포)
7. [Step 5: 테스트 및 확인](#step-5-테스트-및-확인)
8. [문제 해결](#문제-해결)

---

## 개요

이 프로젝트는 이미 토스 앱인토스 로그인 기능이 구현되어 있습니다. 다음 구성 요소들이 포함되어 있습니다:

- **클라이언트 코드**: `src/utils/tossAuth.ts`, `src/utils/tossLogin.ts`
- **Supabase Edge Functions**: `supabase/functions/toss-oauth`, `supabase/functions/toss-auth`
- **UI 통합**: `src/pages/MyPage.tsx`에서 로그인 버튼 제공

설정만 완료하면 바로 사용할 수 있습니다!

---

## 사전 준비사항

다음 항목들이 준비되어 있어야 합니다:

- [ ] 토스 앱인토스 개발자센터 계정
- [ ] Supabase 프로젝트 계정
- [ ] Supabase CLI 설치 (`npm install -g supabase`)
- [ ] 프로젝트 루트에 `.env` 파일 생성 가능

---

## Step 1: 토스 개발자센터 설정

### 1-1. 토스 개발자센터 접속

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 로그인

### 1-2. 내 앱 선택

1. 왼쪽 사이드바에서 **"앱"** 메뉴 클릭
2. 사용 중인 앱 선택 (예: "Solve Climb")

### 1-3. Basic Auth 인증 정보 확인

⚠️ **중요**: 토스 개발자센터에는 "OAuth 설정" 메뉴가 없습니다.  
대신 앱인토스 콘솔에서 API 인증 정보를 확인해야 합니다.

**참고 문서**: [토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)

1. 앱인토스 콘솔에서 앱 선택
2. 다음 메뉴에서 확인:
   - **"키"** 또는 **"API 키"** 메뉴
   - **"개발"** > **"API 설정"**
   - **"설정"** > **"인증"**
3. 다음 정보 확인:
   - **Client ID** 또는 **App ID**
   - **Client Secret** 또는 **App Secret**

⚠️ **참고**: 메뉴 위치는 콘솔 버전에 따라 다를 수 있습니다.  
모든 설정 탭을 확인해보세요.

### 1-4. Client Secret 재발급 (필요한 경우)

⚠️ **주의**: Client Secret을 재발급하면 기존 Secret은 무효화됩니다.

1. 앱 설정 페이지에서 **"키"** 또는 **"API 키"** 메뉴로 이동
2. **"Secret 재발급"** 또는 **"갱신"** 버튼 클릭
3. 확인 후 새로운 **Client Secret** 복사
4. ⚠️ 이 페이지를 벗어나면 다시 볼 수 없으니 반드시 복사해두세요!

### 1-5. 찾기 어려운 경우

인증 정보를 찾기 어렵다면:

1. **토스 고객지원 문의**: [토스 개발자센터 고객지원](https://developers-apps-in-toss.toss.im/)
2. **토스 개발 문서 확인**: [토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)
3. **기존 설정 확인**: 
   ```bash
   # Supabase Secrets에서 기존 값 확인
   supabase secrets list
   ```

### 1-6. Base64 인코딩

브라우저 개발자 도구 콘솔(F12)에서 실행:

```javascript
// 1-3에서 확인한 값으로 교체
const clientId = 'your_client_id_here';
const clientSecret = 'your_client_secret_here';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('TOSS_API_BASIC_AUTH 값:', basicAuth);

// 결과를 복사해서 메모장에 저장하세요!
```

**예시 출력**:
```
TOSS_API_BASIC_AUTH 값: Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=
```

✅ **이 값을 메모장에 저장해두세요!** (Step 2에서 사용)

---

## ⚠️ 중요 참고사항

### 토스 로그인 작동 방식

[토스 개발 문서](https://developers-apps-in-toss.toss.im/login/develop.html)에 따르면:

1. **인가 코드 받기**: `appLogin` 함수를 통해 인가 코드(`authorizationCode`)와 `referrer`를 받습니다
2. **AccessToken 받기**: 인가 코드로 `/api-partner/v1/apps-in-toss/user/oauth2/generate-token` API를 호출합니다
3. **Basic Auth 필요**: 이 API 호출 시 `client_id:client_secret`을 Base64 인코딩한 Basic Auth가 필요합니다

### Basic Auth가 필요한 이유

토스 로그인 API는 서버 간 통신을 위해 Basic Auth를 사용합니다.  
이 값은 앱인토스 콘솔에서 확인할 수 있으며, Supabase Edge Function에서 사용됩니다.

---

## Step 2: Supabase Secrets 설정

### 2-1. Supabase 대시보드 접속

1. [Supabase 대시보드](https://app.supabase.com/) 접속
2. 로그인 후 프로젝트 선택

### 2-2. Service Role Key 확인

1. 왼쪽 사이드바에서 **Settings** (⚙️) 클릭
2. **API** 메뉴 클릭
3. **Project API keys** 섹션에서 **service_role** 키 찾기
4. **Reveal** 버튼 클릭 후 전체 키 복사

⚠️ **주의**: 이 키는 Admin 권한이므로 절대 공개하면 안 됩니다!

### 2-3. Project URL 확인

같은 페이지에서 **Project URL** 값 확인 (예: `https://xxx.supabase.co`)

### 2-4. Supabase CLI로 Secrets 설정

터미널에서 실행:

```bash
# TOSS_API_BASIC_AUTH 설정 (Step 1-5에서 저장한 값 사용)
supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A="

# SERVICE_ROLE_KEY 설정 (Step 2-2에서 복사한 값 사용)
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# SUPABASE_URL 설정 (선택사항, 자동으로 설정되지만 명시 가능)
supabase secrets set SUPABASE_URL="https://xxx.supabase.co"
```

### 2-5. Secrets 확인

```bash
supabase secrets list
```

다음 항목들이 설정되어 있는지 확인:
- ✅ `TOSS_API_BASIC_AUTH`
- ✅ `SERVICE_ROLE_KEY`
- ✅ `SUPABASE_URL` (선택사항)

---

## Step 3: 클라이언트 환경 변수 설정

### 3-1. .env 파일 생성/수정

프로젝트 루트에 `.env` 파일을 생성하거나 수정합니다:

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx...
```

### 3-2. Supabase Anon Key 확인

1. Supabase 대시보드 > Settings > API
2. **Project API keys** 섹션에서 **anon** "public" 키 복사
3. `.env` 파일의 `VITE_SUPABASE_ANON_KEY`에 붙여넣기

### 3-3. 환경 변수 확인

브라우저 개발자 도구 콘솔에서 확인:

```javascript
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '미설정');
```

---

## Step 4: Edge Functions 배포

### 4-1. Supabase CLI 로그인

```bash
supabase login
```

### 4-2. 프로젝트 링크 (처음 한 번만)

```bash
supabase link --project-ref your-project-ref
```

프로젝트 ref는 Supabase 대시보드 URL에서 확인할 수 있습니다:
- URL: `https://app.supabase.com/project/abcdefghijklmnop`
- Project ref: `abcdefghijklmnop`

### 4-3. Edge Functions 배포

```bash
# toss-oauth 배포
supabase functions deploy toss-oauth

# toss-auth 배포
supabase functions deploy toss-auth
```

### 4-4. 배포 확인

```bash
supabase functions list
```

다음 함수들이 배포되어 있는지 확인:
- ✅ `toss-oauth`
- ✅ `toss-auth`

---

## Step 5: 테스트 및 확인

### 5-1. 개발 서버 실행

```bash
npm run dev
```

### 5-2. 브라우저에서 테스트

1. 브라우저에서 앱 열기
2. 개발자 도구 콘솔(F12) 열기
3. 마이페이지로 이동하여 "토스 로그인" 버튼 클릭

### 5-3. 디버깅 도구 사용

브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:

```javascript
// 전체 로그인 플로우 체크
window.checkTossLoginFlow()

// toss-oauth Edge Function 테스트
window.testTossOAuth()

// toss-auth Edge Function 테스트 (accessToken 필요)
window.testTossAuth("your_access_token_here")
```

### 5-4. Edge Function 로그 확인

```bash
# toss-oauth 로그 확인
supabase functions logs toss-oauth

# toss-auth 로그 확인
supabase functions logs toss-auth
```

---

## 문제 해결

### 문제 1: "fail to fetch" 오류

**원인**: Edge Function이 배포되지 않았거나 접근할 수 없음

**해결**:
```bash
# Edge Functions 재배포
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
```

### 문제 2: "401 Unauthorized" 오류

**원인**: `TOSS_API_BASIC_AUTH` 값이 잘못되었거나 설정되지 않음

**해결**:
1. 토스 개발자센터에서 Client ID와 Client Secret 재확인
2. Base64 인코딩 재실행
3. Supabase Secrets 재설정:
   ```bash
   supabase secrets set TOSS_API_BASIC_AUTH="새로운_Base64_값"
   ```
4. Edge Functions 재배포

### 문제 3: "Server configuration error" 오류

**원인**: `SERVICE_ROLE_KEY` 또는 `SUPABASE_URL`이 설정되지 않음

**해결**:
```bash
# Service Role Key 설정
supabase secrets set SERVICE_ROLE_KEY="your_service_role_key"

# Supabase URL 설정
supabase secrets set SUPABASE_URL="https://xxx.supabase.co"

# Edge Functions 재배포
supabase functions deploy toss-auth
```

### 문제 4: 환경 변수가 로드되지 않음

**원인**: `.env` 파일이 없거나 잘못된 위치에 있음

**해결**:
1. 프로젝트 루트에 `.env` 파일이 있는지 확인
2. `.env` 파일 내용 확인:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxx...
   ```
3. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

---

## 📚 참고 문서

- [토스 OAuth Client ID/Secret 찾는 방법](./TOSS_OAUTH_CLIENT_ID_SECRET_GUIDE.md)
- [토스 로그인 API 키 가이드](./TOSS_LOGIN_API_KEYS.md)
- [Secrets 재발급 가이드](./REGENERATE_SECRETS_GUIDE.md)
- [토스 로그인 문제 해결](./TOSS_LOGIN_TROUBLESHOOTING.md)

---

## ✅ 체크리스트

설정 완료 후 다음을 확인하세요:

- [ ] 토스 개발자센터에서 OAuth Client ID/Secret 확인 완료
- [ ] `TOSS_API_BASIC_AUTH` Base64 값 생성 완료
- [ ] Supabase Secrets 설정 완료 (`TOSS_API_BASIC_AUTH`, `SERVICE_ROLE_KEY`)
- [ ] 클라이언트 `.env` 파일 설정 완료 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Edge Functions 배포 완료 (`toss-oauth`, `toss-auth`)
- [ ] 브라우저에서 로그인 테스트 성공

---

## 🎉 완료!

모든 설정이 완료되면 토스 앱에서 로그인 기능을 사용할 수 있습니다!

추가 질문이나 문제가 있으면 `docs/TOSS_LOGIN_TROUBLESHOOTING.md` 문서를 참고하세요.

