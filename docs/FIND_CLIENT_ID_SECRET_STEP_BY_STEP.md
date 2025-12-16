# 실제 Client ID와 Client Secret 찾기 - 단계별 가이드

## ⚠️ 현재 상황

브라우저 콘솔에서 예시 값(`your_client_id`, `your_client_secret`)을 그대로 사용하셨습니다.  
실제 값을 찾아서 교체해야 합니다!

---

## 🔍 실제 값 찾는 방법

### 방법 1: 앱인토스 콘솔에서 확인 (가장 확실한 방법)

#### Step 1: 앱인토스 콘솔 접속

1. [앱인토스 콘솔](https://console.apps-in-toss.toss.im/) 접속
2. 로그인 (대표 관리자 계정)

#### Step 2: 워크스페이스 및 미니앱 선택

1. 해당 워크스페이스 선택
2. 사용 중인 미니앱 선택 (예: "Solve Climb")

#### Step 3: 토스 로그인 설정 페이지 이동

1. 좌측 메뉴에서 **"토스 로그인"** 메뉴 클릭
2. 또는 **"개발"** > **"토스 로그인"** 메뉴

#### Step 4: API 인증 정보 확인

토스 로그인 설정 페이지에서 다음을 확인하세요:

- **Client ID** 또는 **App ID**
- **Client Secret** 또는 **App Secret** 또는 **API Secret**

⚠️ **참고**: 
- 페이지에 "복호화 키"만 보인다면, 이것은 다른 용도입니다
- OAuth API 호출을 위한 **Client ID/Secret**을 찾아야 합니다
- "API 키", "인증 키", "OAuth 키" 등의 이름으로 표시될 수 있습니다

---

### 방법 2: 기존 Supabase Secrets 확인

이미 설정되어 있다면 기존 값을 확인할 수 있습니다:

```bash
# Supabase Secrets 목록 확인 (값은 마스킹됨)
supabase secrets list

# 하지만 실제 값은 보이지 않으므로, 다른 방법 필요
```

**대안**: Supabase Edge Function 로그에서 확인
1. Supabase 대시보드 > Edge Functions > Logs
2. `toss-oauth` 함수의 최근 로그 확인
3. 로그에 `basicAuthPrefix` 또는 `AuthorizationLength` 값이 있을 수 있음

---

### 방법 3: 토스 개발자센터에서 확인

#### Step 1: 개발자센터 접속

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 로그인

#### Step 2: 내 앱 선택

1. **"앱"** 메뉴 클릭
2. 사용 중인 앱 선택

#### Step 3: 앱 설정 확인

앱 상세 페이지에서 다음 메뉴들을 확인하세요:

- **"설정"** > **"API"** 또는 **"인증"**
- **"개발"** > **"API 설정"**
- **"연동"** > **"OAuth"**

여기서 **Client ID**와 **Client Secret**을 찾을 수 있습니다.

---

### 방법 4: 토스 고객지원 문의

위 방법으로 찾을 수 없는 경우:

1. [토스 개발자센터 고객지원](https://developers-apps-in-toss.toss.im/) 접속
2. 문의 내용:
   ```
   제목: 토스 로그인 API Basic Auth 인증 정보 확인 요청
   
   내용:
   - 앱 이름: [앱 이름]
   - 용도: /api-partner/v1/apps-in-toss/user/oauth2/generate-token API 호출을 위한 Basic Auth
   - 필요한 정보: Client ID와 Client Secret
   ```

---

## ✅ 실제 값으로 Base64 인코딩하기

실제 Client ID와 Client Secret을 찾은 후:

### Step 1: 브라우저 콘솔 열기

앱인토스 콘솔 페이지에서 F12 키를 눌러 개발자 도구 열기

### Step 2: 실제 값으로 교체하여 실행

```javascript
// ⚠️ 아래 값들을 실제로 찾은 값으로 교체하세요!
const clientId = '실제_Client_ID_값';
const clientSecret = '실제_Client_Secret_값';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('TOSS_API_BASIC_AUTH:', basicAuth);

// 결과를 복사해서 메모장에 저장하세요!
```

### Step 3: 결과 확인

**올바른 결과 예시**:
```
TOSS_API_BASIC_AUTH: Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=
```

**잘못된 결과 (예시 값 사용)**:
```
TOSS_API_BASIC_AUTH: eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0
```

⚠️ **현재 결과값 `eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0`는 예시 값의 Base64 인코딩입니다!**  
실제 값을 찾아서 다시 인코딩해야 합니다.

---

## 🔍 값이 올바른지 확인하는 방법

### 방법 1: Base64 디코딩으로 확인

브라우저 콘솔에서:

```javascript
// 현재 결과값 디코딩
const currentValue = 'eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0';
const decoded = atob(currentValue);
console.log('디코딩 결과:', decoded);
// 출력: "your_client_id:your_client_secret" (예시 값!)

// 실제 값으로 인코딩한 후 확인
const realValue = 'Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=';
const decodedReal = atob(realValue);
console.log('실제 값 디코딩 결과:', decodedReal);
// 출력: "client_1234567890:secret_abcdefghijklmnop" (실제 값 형식)
```

### 방법 2: Supabase Secrets 설정 후 테스트

실제 값을 찾아서 설정한 후:

```bash
# Supabase Secrets 설정
supabase secrets set TOSS_API_BASIC_AUTH="실제_Base64_값"

# 브라우저 콘솔에서 테스트
await window.testTossOAuth();
```

성공하면 `{ success: true, accessToken: "xxx..." }`가 반환됩니다.

---

## 📝 체크리스트

- [ ] 앱인토스 콘솔에서 "토스 로그인" 메뉴 확인
- [ ] Client ID 값 확인 및 복사
- [ ] Client Secret 값 확인 및 복사
- [ ] 브라우저 콘솔에서 실제 값으로 Base64 인코딩 실행
- [ ] 결과값이 예시 값(`your_client_id:your_client_secret`)이 아닌지 확인
- [ ] `TOSS_API_BASIC_AUTH` 값을 메모장에 저장
- [ ] `supabase secrets set TOSS_API_BASIC_AUTH="값"` 실행
- [ ] `window.testTossOAuth()` 테스트 성공 확인

---

## 🚨 문제 해결

### 문제 1: "토스 로그인" 메뉴를 찾을 수 없음

**해결**:
1. 앱인토스 콘솔의 모든 메뉴 확인
2. "개발", "설정", "API" 등의 메뉴 확인
3. 토스 고객지원 문의

### 문제 2: Client ID/Secret이 보이지 않음

**해결**:
1. "API 키", "인증 키", "OAuth 키" 등의 다른 이름으로 표시될 수 있음
2. 페이지의 모든 섹션 확인
3. 토스 고객지원 문의

### 문제 3: 값이 너무 짧거나 형식이 이상함

**해결**:
1. 전체 값을 복사했는지 확인
2. 공백이나 줄바꿈이 포함되지 않았는지 확인
3. 다른 페이지에서 다시 확인

---

## 📚 다음 단계

실제 값을 찾아서 Base64 인코딩한 후:

1. `docs/REGENERATE_SECRETS_GUIDE.md` 문서의 Step 3으로 이동
2. `supabase secrets set TOSS_API_BASIC_AUTH="실제_Base64_값"` 실행
3. `supabase secrets list`로 확인
4. 브라우저 콘솔에서 `window.testTossOAuth()` 테스트
