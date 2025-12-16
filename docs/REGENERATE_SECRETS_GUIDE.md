# Supabase Edge Functions Secrets 재발급 가이드

이 가이드는 모든 Supabase Edge Functions Secrets를 처음부터 다시 발급받고 설정하는 방법을 단계별로 설명합니다.

---

## 📋 전체 작업 흐름

1. **토스 개발자센터에서 OAuth 인증 정보 확인/재발급**
2. **Supabase에서 Service Role Key 확인**
3. **모든 Secrets를 Supabase에 설정**
4. **설정 확인 및 테스트**

---

## 🔑 Step 1: 토스 OAuth 인증 정보 확인/재발급

### 1-1. 토스 개발자센터 접속

1. 브라우저에서 [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 로그인 (토스 계정 필요)

### 1-2. 내 앱 선택

1. 대시보드에서 **내 앱** 메뉴 클릭
2. 사용 중인 앱 선택 (예: "Solve Climb")

### 1-3. OAuth 설정 확인

1. 앱 설정 페이지에서 **OAuth 설정** 또는 **인증 설정** 메뉴 찾기
2. 다음 정보 확인:
   - **Client ID** (예: `client_1234567890`)
   - **Client Secret** (예: `secret_abcdefghijklmnop`)

### 1-4. Client Secret 재발급 (필요한 경우)

⚠️ **주의**: Client Secret을 재발급하면 기존에 사용하던 Secret은 무효화됩니다.

1. OAuth 설정 페이지에서 **Client Secret 재발급** 또는 **Secret 갱신** 버튼 클릭
2. 확인 메시지에서 **재발급** 확인
3. 새로운 **Client Secret** 복사 (⚠️ 이 페이지를 벗어나면 다시 볼 수 없음!)

### 1-5. Base64 인코딩

브라우저 개발자 도구 콘솔(F12)에서 실행:

```javascript
// 1-3에서 확인한 값으로 교체
const clientId = 'your_client_id_here';
const clientSecret = 'your_client_secret_here';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('TOSS_API_BASIC_AUTH 값:', basicAuth);

// 복사해서 메모장에 저장해두세요!
```

**예시 출력**:
```
TOSS_API_BASIC_AUTH 값: Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=
```

✅ **이 값을 메모장에 저장해두세요!** (다음 단계에서 사용)

---

## 🔑 Step 2: Supabase Service Role Key 확인

### 2-1. Supabase 대시보드 접속

1. 브라우저에서 [Supabase 대시보드](https://app.supabase.com/) 접속
2. 로그인

### 2-2. 프로젝트 선택

1. 사용 중인 프로젝트 선택 (예: "solve-climb")

### 2-3. API 설정 페이지 이동

1. 왼쪽 사이드바에서 **Settings** (⚙️ 아이콘) 클릭
2. **API** 메뉴 클릭

### 2-4. Service Role Key 복사

1. **Project API keys** 섹션에서 **service_role** 키 찾기
2. **Reveal** 버튼 클릭 (비밀번호 입력 필요할 수 있음)
3. **복사** 버튼 클릭하여 전체 키 복사

⚠️ **주의**: 
- 이 키는 매우 긴 JWT 토큰입니다 (수백 자)
- 전체를 복사해야 합니다
- 이 키는 Admin 권한이므로 절대 공개하면 안 됩니다

✅ **이 값을 메모장에 저장해두세요!**

### 2-5. Project URL도 확인

같은 페이지에서:
1. **Project URL** 값 확인 (예: `https://xxx.supabase.co`)
2. 이것도 메모장에 저장

---

## 🔑 Step 3: Supabase CLI로 Secrets 설정

### 3-1. Supabase CLI 설치 확인

터미널에서 확인:

```bash
supabase --version
```

**설치되어 있지 않다면**:
```bash
npm install -g supabase
```

또는

```bash
# Windows (PowerShell)
scoop install supabase
```

### 3-2. Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 Supabase 계정으로 로그인하세요.

### 3-3. 프로젝트 연결 확인

프로젝트 루트 디렉토리에서:

```bash
supabase link --project-ref your-project-ref
```

또는 이미 연결되어 있다면:

```bash
supabase projects list
```

### 3-4. 기존 Secrets 확인 (선택사항)

현재 설정된 secrets 확인:

```bash
supabase secrets list
```

### 3-5. TOSS_API_BASIC_AUTH 설정

Step 1-5에서 저장한 Base64 값을 사용:

```bash
supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A="
```

⚠️ **주의**: 
- 따옴표 안에 값만 넣으세요 ("Basic " 접두사 없이!)
- 값에 공백이 없어야 합니다

### 3-6. SERVICE_ROLE_KEY 설정

Step 2-4에서 저장한 Service Role Key 사용:

```bash
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTk1MDE0Mzg5MH0.xxx..."
```

⚠️ **주의**: 
- 전체 JWT 토큰을 복사해야 합니다
- 따옴표로 감싸세요

### 3-7. SUPABASE_SERVICE_ROLE_KEY 설정 (구버전 호환)

SERVICE_ROLE_KEY와 동일한 값:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTk1MDE0Mzg5MH0.xxx..."
```

(Step 2-4에서 복사한 것과 동일한 값)

### 3-8. TOSS_AUTH_KEY 설정 (선택사항)

출금 기능을 사용하는 경우에만:

```bash
supabase secrets set TOSS_AUTH_KEY="your_toss_auth_key_here"
```

---

## ✅ Step 4: 설정 확인

### 4-1. Secrets 목록 확인

```bash
supabase secrets list
```

**예상 출력**:
```
TOSS_API_BASIC_AUTH: *** (마스킹됨)
SERVICE_ROLE_KEY: *** (마스킹됨)
SUPABASE_SERVICE_ROLE_KEY: *** (마스킹됨)
TOSS_AUTH_KEY: *** (마스킹됨) (설정한 경우)
```

✅ 모든 secrets가 표시되면 성공!

### 4-2. Edge Functions 재배포 (선택사항)

Secrets 변경 후 Edge Functions를 재배포하는 것이 좋습니다:

```bash
# 모든 Edge Functions 배포
supabase functions deploy

# 또는 특정 함수만 배포
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
supabase functions deploy migration-status
supabase functions deploy migration-link
```

---

## 🧪 Step 5: 테스트

### 5-1. 브라우저 콘솔에서 테스트

프로젝트를 실행한 후 (`npm run dev`), 브라우저 콘솔에서:

```javascript
// 토스 OAuth 테스트
await window.testTossOAuth();
```

**예상 결과**:
- 성공: `{ success: true, accessToken: "xxx..." }`
- 실패: `{ success: false, error: "xxx" }`

### 5-2. Supabase 로그 확인

1. [Supabase 대시보드](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. **Edge Functions** > **Logs** 메뉴
4. `toss-oauth` 함수 선택
5. 최근 로그 확인:
   - ✅ 성공: `[토스 OAuth] AccessToken 발급 성공`
   - ❌ 실패: `[토스 OAuth] TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다` 또는 `401 Unauthorized`

---

## 🚨 문제 해결

### 문제 1: "TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다"

**원인**: Secret이 제대로 설정되지 않음

**해결**:
1. `supabase secrets list`로 확인
2. 다시 설정: `supabase secrets set TOSS_API_BASIC_AUTH="값"`
3. Edge Functions 재배포

### 문제 2: "401 Unauthorized" 또는 "missing authorization header"

**원인**: Base64 인코딩이 잘못되었거나 "Basic " 접두사가 포함됨

**해결**:
1. 브라우저 콘솔에서 다시 인코딩:
   ```javascript
   const clientId = 'your_client_id';
   const clientSecret = 'your_client_secret';
   console.log(btoa(`${clientId}:${clientSecret}`));
   ```
2. 결과값만 복사 (공백 없이)
3. `supabase secrets set TOSS_API_BASIC_AUTH="새로운값"` 재설정

### 문제 3: "Server configuration error"

**원인**: SERVICE_ROLE_KEY가 없거나 잘못됨

**해결**:
1. Supabase 대시보드에서 Service Role Key 다시 확인
2. 전체 키를 복사 (일부만 복사하지 않도록 주의)
3. `supabase secrets set SERVICE_ROLE_KEY="전체키"` 재설정

### 문제 4: "supabase: command not found"

**원인**: Supabase CLI가 설치되지 않음

**해결**:
```bash
npm install -g supabase
```

또는

```bash
# Windows
scoop install supabase
```

### 문제 5: "You are not logged in"

**원인**: Supabase CLI에 로그인하지 않음

**해결**:
```bash
supabase login
```

---

## 📝 체크리스트

재발급 및 설정 완료 후 확인:

- [ ] 토스 개발자센터에서 Client ID와 Client Secret 확인
- [ ] Base64 인코딩 완료 (`btoa()` 사용)
- [ ] Supabase에서 Service Role Key 복사
- [ ] `supabase secrets set TOSS_API_BASIC_AUTH="값"` 실행 완료
- [ ] `supabase secrets set SERVICE_ROLE_KEY="값"` 실행 완료
- [ ] `supabase secrets set SUPABASE_SERVICE_ROLE_KEY="값"` 실행 완료
- [ ] `supabase secrets list`로 모든 secrets 확인
- [ ] 브라우저 콘솔에서 `testTossOAuth()` 테스트 성공
- [ ] Supabase 로그에서 에러 없음 확인

---

## 💡 팁

1. **Secrets는 마스킹되어 표시됩니다**: `supabase secrets list`로 확인해도 실제 값은 보이지 않습니다. 이는 정상입니다.

2. **Edge Functions 재배포**: Secrets 변경 후 즉시 적용되지만, 재배포하는 것이 안전합니다.

3. **값 저장**: 모든 키를 안전한 곳(비밀번호 관리자 등)에 저장해두세요.

4. **테스트 환경**: 먼저 개발 환경에서 테스트한 후 프로덕션에 적용하세요.

---

## 📚 참고 자료

- [Supabase Secrets 관리 공식 문서](https://supabase.com/docs/guides/functions/secrets)
- [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Supabase CLI 문서](https://supabase.com/docs/reference/cli/introduction)
