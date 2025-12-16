# 토스 로그인 API 인증 정보 찾기 - 실전 가이드

## 🎯 목표

토스 로그인 API (`/api-partner/v1/apps-in-toss/user/oauth2/generate-token`)를 호출하기 위해 필요한 인증 정보를 찾는 방법입니다.

---

## ⚠️ 중요한 사실

**토스 공식 문서에 따르면, 토스 로그인 API는 mTLS 인증서를 사용합니다.**

[토스 API 사용하기 문서](https://developers-apps-in-toss.toss.im/development/integration-process.html)에 따르면:
- 토스 로그인 API는 **mTLS 기반의 서버 간 통신**이 필요합니다
- mTLS 인증서는 **앱인토스 콘솔에서 직접 발급**받을 수 있습니다
- 인증서 파일(cert)과 키 파일(key)이 필요합니다

**현재 프로젝트 상황**:
- 현재 프로젝트는 Basic Auth를 사용하고 있습니다 (`TOSS_API_BASIC_AUTH`)
- 이는 Supabase Edge Functions의 제약 때문일 수 있습니다
- 또는 토스가 Basic Auth를 지원하는 별도 방법이 있을 수 있습니다

**두 가지 방법을 모두 확인해보세요:**
1. **mTLS 인증서 발급** (공식 방법)
2. **Basic Auth Client ID/Secret** (현재 프로젝트에서 사용 중)

---

## 🔍 찾는 방법 (우선순위 순)

### 방법 0: mTLS 인증서 발급 (공식 방법) ⭐⭐⭐

[토스 API 사용하기 문서](https://developers-apps-in-toss.toss.im/development/integration-process.html)에 따르면:

#### Step 1: 앱인토스 콘솔 접속

1. [앱인토스 콘솔](https://console.apps-in-toss.toss.im/) 접속
2. 로그인 (토스 계정)

#### Step 2: 앱 선택

1. 상단에서 **워크스페이스** 선택
2. 좌측 메뉴에서 **미니앱** 선택 (예: "Solve Climb")

#### Step 3: mTLS 인증서 발급

1. 좌측 메뉴에서 **"mTLS 인증서"** 탭 클릭
2. **"+ 발급받기"** 버튼 클릭
3. 인증서 발급 진행

#### Step 4: 인증서 다운로드

발급 완료 후:
- **인증서 파일** (cert 파일) 다운로드
- **키 파일** (key 파일) 다운로드

⚠️ **주의**:
- 인증서와 키 파일은 **안전한 위치에 보관**하세요
- 인증서는 **390일 동안 유효**합니다
- 만료 전에 반드시 재발급해야 합니다

#### Step 5: Supabase Edge Functions에서 사용

⚠️ **문제**: Supabase Edge Functions는 mTLS 인증서를 직접 사용하기 어렵습니다.

**대안**:
1. 중간 프록시 서버 구축 (mTLS 사용)
2. 토스 고객지원에 Basic Auth 지원 여부 문의
3. 현재 Basic Auth 방식이 작동한다면 계속 사용

---

### 방법 1: Basic Auth Client ID/Secret 찾기 (현재 프로젝트 방식)

#### Step 1: 앱인토스 콘솔 접속

1. 브라우저에서 [앱인토스 콘솔](https://console.apps-in-toss.toss.im/) 접속
2. 로그인 (토스 계정)

#### Step 2: 워크스페이스 및 미니앱 선택

1. 상단에서 **워크스페이스** 선택
2. 좌측 메뉴에서 **미니앱** 선택 (예: "Solve Climb")

#### Step 3: mTLS 인증서 메뉴 확인

**먼저 mTLS 인증서 메뉴를 확인하세요:**
- 좌측 메뉴에서 **"mTLS 인증서"** 탭 확인
- 이 메뉴가 있다면 공식 방법(mTLS)을 사용해야 합니다

#### Step 4: 모든 메뉴 확인하기 (Basic Auth용)

**mTLS 인증서가 없다면, Basic Auth용 정보를 찾아보세요:**

**좌측 메뉴에서 다음을 순서대로 확인하세요:**

1. **"개발"** 메뉴 클릭
   - "토스 로그인" 서브메뉴 확인
   - "API 설정" 서브메뉴 확인
   - "인증" 서브메뉴 확인

2. **"설정"** 메뉴 클릭
   - "API 키" 또는 "키" 섹션 확인
   - "인증 설정" 섹션 확인

3. **"연동"** 메뉴 클릭 (있다면)
   - "OAuth" 섹션 확인

#### Step 5: 찾아야 할 정보

**mTLS 인증서 방식인 경우:**
- **인증서 파일** (cert 파일)
- **키 파일** (key 파일)

**Basic Auth 방식인 경우:**
다음 중 하나의 형태로 표시될 수 있습니다:
- **Client ID** / **App ID** / **API Client ID**
- **Client Secret** / **App Secret** / **API Secret** / **Secret Key**

⚠️ **주의**: 
- "복호화 키"는 다른 용도입니다 (사용자 정보 복호화용)
- "콘솔 API 키"는 관리자 콘솔용입니다
- **OAuth API 호출용** Client ID/Secret을 찾아야 합니다

#### Step 6: 값이 보이지 않는 경우

각 페이지에서:
- 페이지를 아래로 스크롤하여 숨겨진 섹션 확인
- "보기", "확인", "상세" 버튼 클릭
- "재발급" 버튼 옆에 기존 값이 표시될 수 있음

---

### 방법 2: 토스 개발자센터에서 확인

#### Step 1: 개발자센터 접속

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 로그인

#### Step 2: 콘솔로 이동

1. 상단 메뉴에서 **"콘솔로 이동하기"** 클릭
2. 또는 직접 [콘솔](https://console.apps-in-toss.toss.im/) 접속

#### Step 3: 방법 1의 Step 2부터 동일하게 진행

---

### 방법 3: 기존 설정 확인 (이미 사용 중인 경우)

#### 3-1. Supabase Secrets 확인

```bash
# Secrets 목록 확인 (값은 마스킹되어 보이지 않음)
supabase secrets list

# 하지만 실제 값은 보이지 않으므로, 다른 방법 필요
```

#### 3-2. Edge Function 로그 확인

1. Supabase 대시보드 접속
2. **Edge Functions** > **Logs** 메뉴
3. `toss-oauth` 함수 선택
4. 최근 로그에서 `basicAuthPrefix` 또는 관련 정보 확인

⚠️ **주의**: 로그에도 전체 값은 표시되지 않을 수 있습니다.

#### 3-3. 기존 코드나 문서 확인

- 프로젝트의 다른 개발자에게 문의
- 기존 서버 코드에서 환경 변수 확인
- 팀 문서나 위키 확인

---

### 방법 4: 토스 고객지원 문의 (최종 방법) ⭐⭐⭐

위 방법으로 찾을 수 없다면, **토스 고객지원에 직접 문의**하는 것이 가장 확실합니다.

#### Step 1: 고객지원 접속

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. **"지원"** 메뉴 클릭
3. 고객지원 페이지로 이동

#### Step 2: 문의 내용 작성

**제목**:
```
토스 로그인 API Basic Auth 인증 정보 확인 요청
```

**내용**:
```
안녕하세요.

토스 로그인 API를 사용하기 위해 인증 정보가 필요합니다.

- 앱 이름: [앱 이름 입력]
- 워크스페이스: [워크스페이스 이름 입력]
- 필요한 API: /api-partner/v1/apps-in-toss/user/oauth2/generate-token
- 환경: Supabase Edge Functions (Deno)

문의 사항:
1. Supabase Edge Functions에서 mTLS 인증서를 사용할 수 있나요?
2. 만약 불가능하다면, Basic Auth 방식의 Client ID/Secret을 발급받을 수 있나요?
3. 현재 프로젝트에서 Basic Auth를 사용하고 있는데, 이 방식이 공식적으로 지원되나요?

앱인토스 콘솔에서 어디서 확인할 수 있는지 안내해주시면 감사하겠습니다.
```

#### Step 3: 응답 대기

보통 1-2일 내에 응답이 옵니다. 응답을 받으면:
1. 안내받은 위치에서 값 확인
2. 아래 "Base64 인코딩" 단계로 진행

---

## 🔑 값을 찾은 후: Base64 인코딩

Client ID와 Client Secret을 찾았다면:

### Step 1: 브라우저 콘솔 열기

앱인토스 콘솔 페이지에서 **F12** 키를 눌러 개발자 도구 열기

### Step 2: 실제 값으로 인코딩

```javascript
// ⚠️ 아래 값들을 실제로 찾은 값으로 교체하세요!
const clientId = '실제_Client_ID_값_여기에_붙여넣기';
const clientSecret = '실제_Client_Secret_값_여기에_붙여넣기';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('✅ TOSS_API_BASIC_AUTH 값:', basicAuth);

// 결과를 복사해서 메모장에 저장하세요!
```

### Step 3: 결과 확인

**올바른 결과 예시**:
```
✅ TOSS_API_BASIC_AUTH 값: Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=
```

**잘못된 결과 (예시 값 사용 시)**:
```
TOSS_API_BASIC_AUTH 값: eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0
```

⚠️ **주의**: 
- 결과값이 `eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0`와 같다면 예시 값을 사용한 것입니다!
- 반드시 실제 값을 찾아서 사용해야 합니다!

### Step 4: 값 검증 (선택사항)

```javascript
// Base64 디코딩하여 확인
const encoded = 'Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=';
const decoded = atob(encoded);
console.log('디코딩 결과:', decoded);
// 출력: "client_1234567890:secret_abcdefghijklmnop" (실제 값 형식)
```

---

## 📝 Supabase Secrets 설정

값을 찾아서 Base64 인코딩했다면:

```bash
# Supabase Secrets 설정
supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A="

# 설정 확인
supabase secrets list
```

---

## ✅ 테스트

설정 후 브라우저 콘솔에서 테스트:

```javascript
// 토스 OAuth 테스트
await window.testTossOAuth();
```

성공하면:
```javascript
{
  success: true,
  accessToken: "eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ..."
}
```

실패하면:
```javascript
{
  error: "Authentication failed",
  message: "토스 API 인증에 실패했습니다..."
}
```

---

## 🚨 문제 해결

### 문제 1: "토스 로그인" 메뉴를 찾을 수 없음

**해결**:
1. 앱인토스 콘솔의 **모든 좌측 메뉴** 확인
2. "개발", "설정", "연동" 등 모든 탭 확인
3. **토스 고객지원 문의** (가장 확실한 방법)

### 문제 2: Client ID/Secret이 보이지 않음

**해결**:
1. 페이지를 아래로 스크롤하여 숨겨진 섹션 확인
2. "보기", "확인", "상세" 버튼 클릭
3. "재발급" 버튼 옆에 기존 값이 표시될 수 있음
4. **토스 고객지원 문의**

### 문제 3: 값이 너무 짧거나 형식이 이상함

**해결**:
1. 전체 값을 복사했는지 확인 (마지막 문자까지)
2. 공백이나 줄바꿈이 포함되지 않았는지 확인
3. 다른 페이지에서 다시 확인
4. **토스 고객지원 문의**

### 문제 4: 모든 방법을 시도했지만 찾을 수 없음

**해결**:
- **토스 고객지원에 직접 문의**하는 것이 가장 빠르고 확실합니다
- 위의 "방법 4"를 참고하여 문의하세요

---

## 📚 참고 문서

- [토스 API 사용하기 (mTLS 인증서)](https://developers-apps-in-toss.toss.im/development/integration-process.html) ⭐ **공식 문서**
- [토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)
- `docs/TOSS_OAUTH_CLIENT_ID_SECRET_GUIDE.md` - 기본 가이드
- `docs/FIND_CLIENT_ID_SECRET_STEP_BY_STEP.md` - 단계별 가이드

---

## 💡 팁

1. **토스 고객지원 문의가 가장 확실합니다**
   - 직접 문의하면 정확한 위치를 안내받을 수 있습니다
   - 앱별로 설정 방법이 다를 수 있기 때문입니다

2. **값을 찾으면 즉시 메모장에 저장하세요**
   - Client Secret은 한 번만 보여줄 수 있습니다
   - 페이지를 벗어나면 다시 볼 수 없을 수 있습니다

3. **팀원에게 물어보세요**
   - 이미 토스 로그인을 사용하고 있다면 팀원이 알고 있을 수 있습니다
   - 기존 설정 파일이나 문서를 확인해보세요

---

## 🎯 체크리스트

### mTLS 인증서 방식 (공식 방법)

- [ ] 앱인토스 콘솔 접속 완료
- [ ] "mTLS 인증서" 메뉴 확인 완료
- [ ] 인증서 발급 완료
- [ ] 인증서 파일(cert) 다운로드 완료
- [ ] 키 파일(key) 다운로드 완료
- [ ] Supabase Edge Functions에서 사용 가능한지 확인
- [ ] (필요시) 중간 프록시 서버 구축 또는 토스 고객지원 문의

### Basic Auth 방식 (현재 프로젝트)

- [ ] 앱인토스 콘솔 접속 완료
- [ ] 모든 좌측 메뉴 확인 완료
- [ ] Client ID 값 확인 및 복사 완료
- [ ] Client Secret 값 확인 및 복사 완료
- [ ] 브라우저 콘솔에서 실제 값으로 Base64 인코딩 실행 완료
- [ ] 결과값이 예시 값이 아닌지 확인 완료
- [ ] `TOSS_API_BASIC_AUTH` 값을 메모장에 저장 완료
- [ ] `supabase secrets set TOSS_API_BASIC_AUTH="값"` 실행 완료
- [ ] `window.testTossOAuth()` 테스트 성공 확인 완료

**찾을 수 없다면**: 토스 고객지원에 문의하세요! ⭐

---

## 💡 중요 참고사항

**토스 공식 문서에 따르면 mTLS 인증서가 필요합니다.**  
하지만 현재 프로젝트는 Basic Auth를 사용하고 있습니다.

**가능한 시나리오:**
1. Supabase Edge Functions의 제약으로 인해 Basic Auth를 사용 중일 수 있습니다
2. 토스가 Basic Auth를 지원하는 별도 방법이 있을 수 있습니다
3. 현재 방식이 작동한다면 계속 사용해도 될 수 있습니다

**권장 사항:**
- 먼저 **mTLS 인증서를 발급**받아보세요
- Supabase Edge Functions에서 사용 가능한지 확인하세요
- 불가능하다면 **토스 고객지원에 문의**하여 Basic Auth 지원 여부를 확인하세요

