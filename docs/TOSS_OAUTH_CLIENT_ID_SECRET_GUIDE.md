# 토스 OAuth Basic Auth 인증 정보 찾는 방법

## ⚠️ 중요: 토스 로그인 API 인증 방식

토스 로그인 API (`/api-partner/v1/apps-in-toss/user/oauth2/generate-token`)를 호출할 때는 **Basic Auth**가 필요합니다.  
이 Basic Auth는 `client_id:client_secret` 형식으로 Base64 인코딩한 값입니다.

**참고 문서**: [토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)

---

## 🔍 Basic Auth 인증 정보 찾는 방법

### 방법 1: 앱인토스 콘솔에서 확인 (권장)

#### Step 1: 토스 앱인토스 개발자센터 접속

1. [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
2. 로그인

#### Step 2: 콘솔로 이동

1. 상단 메뉴에서 **"콘솔로 이동하기"** 클릭
2. 또는 직접 [콘솔](https://console.apps-in-toss.toss.im/) 접속

#### Step 3: 내 앱 선택

1. 사용 중인 앱 선택 (예: "Solve Climb")

#### Step 4: API 키 또는 인증 정보 확인

앱 설정 페이지에서 다음을 확인하세요:

- **"키"** 또는 **"API 키"** 메뉴
- **"인증"** 또는 **"API 인증"** 섹션
- **"개발"** > **"API 설정"** 메뉴

여기서 다음 정보를 확인할 수 있습니다:
- **Client ID** 또는 **App ID**
- **Client Secret** 또는 **App Secret**

⚠️ **참고**: 토스 개발자센터의 실제 구조에 따라 메뉴 위치가 다를 수 있습니다.  
앱 설정 페이지의 모든 탭을 확인해보세요.

### 방법 2: 토스 고객지원 문의

위 방법으로 찾을 수 없는 경우:

1. [토스 개발자센터 고객지원](https://developers-apps-in-toss.toss.im/)에서 문의
2. "토스 로그인 API Basic Auth 인증 정보" 문의
3. 앱 이름과 함께 문의하면 더 빠르게 확인 가능

### 방법 3: 기존 예제 코드 참고

프로젝트의 `apps-in-toss-examples-main/with-app-login` 예제를 참고하세요.  
예제에서는 mTLS 인증서를 사용하지만, 우리 프로젝트는 Basic Auth를 사용합니다.

---

## 📝 Client Secret 재발급 (필요한 경우)

⚠️ **주의**: Client Secret을 재발급하면 기존에 사용하던 Secret은 무효화됩니다!

1. 앱 설정 페이지에서 **"키"** 또는 **"API 키"** 메뉴로 이동
2. **"Secret 재발급"** 또는 **"갱신"** 버튼 클릭
3. 확인 메시지에서 **"재발급"** 확인
4. 새로운 **Client Secret** 복사
   - ⚠️ 이 페이지를 벗어나면 다시 볼 수 없으니 반드시 복사해두세요!

---

## 🔑 Base64 인코딩 (TOSS_API_BASIC_AUTH 생성)

Client ID와 Client Secret을 확인한 후, 브라우저 콘솔(F12)에서 실행:

```javascript
// ⚠️ 중요: 아래 값들을 실제로 찾은 값으로 교체하세요!
// 예시 값(your_client_id, your_client_secret)을 그대로 사용하면 안 됩니다!
const clientId = '실제_Client_ID_값';
const clientSecret = '실제_Client_Secret_값';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('TOSS_API_BASIC_AUTH 값:', basicAuth);

// 결과를 복사해서 메모장에 저장하세요!
```

**올바른 출력 예시**:
```
TOSS_API_BASIC_AUTH 값: Y2xpZW50XzEyMzQ1Njc4OTA6c2VjcmV0X2FiY2RlZmdoaWprbG1ub3A=
```

**잘못된 출력 (예시 값 사용 시)**:
```
TOSS_API_BASIC_AUTH 값: eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0
```

⚠️ **주의**: 예시 값(`your_client_id`, `your_client_secret`)을 그대로 사용하면 위와 같은 잘못된 결과가 나옵니다.  
반드시 실제 값을 찾아서 교체해야 합니다!

**값 확인 방법**: `docs/FIND_CLIENT_ID_SECRET_STEP_BY_STEP.md` 참고

---

## 🚨 "콘솔 API 키"와의 차이점

| 구분 | 콘솔 API 키 | OAuth Client ID/Secret |
|------|------------|------------------------|
| **용도** | 관리자 콘솔에서 API 호출 | OAuth 2.0 인증 |
| **위치** | "키" 메뉴 | "앱" > "OAuth 설정" |
| **형식** | 단일 키 | Client ID + Client Secret 쌍 |
| **사용** | 콘솔 API 호출 시 | `client_id:client_secret` Base64 인코딩 |

---

## ✅ 확인 체크리스트

- [ ] "앱" 메뉴로 이동했는지 확인
- [ ] 사용 중인 앱을 선택했는지 확인
- [ ] "OAuth 설정" 또는 "인증 설정" 메뉴를 찾았는지 확인
- [ ] Client ID를 확인했는지 확인
- [ ] Client Secret을 확인했는지 확인
- [ ] Base64 인코딩을 완료했는지 확인
- [ ] `TOSS_API_BASIC_AUTH` 값을 메모장에 저장했는지 확인

---

## 💡 찾기 어려운 경우

### 대안 1: 토스 개발 문서 확인

[토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)를 참고하세요.  
문서에서 Basic Auth 설정 방법을 확인할 수 있습니다.

### 대안 2: 토스 고객지원 문의

1. [토스 개발자센터 고객지원](https://developers-apps-in-toss.toss.im/)에서 문의
2. "토스 로그인 API Basic Auth 인증 정보 확인 방법" 문의
3. 앱 이름과 함께 문의하면 더 빠르게 확인 가능

### 대안 3: 앱인토스 콘솔 전체 탐색

1. 콘솔에서 앱 선택
2. 모든 메뉴 탭 확인:
   - "개발" > "API 설정"
   - "설정" > "인증"
   - "키" 또는 "API 키"
   - 기타 모든 설정 메뉴

### 대안 4: 기존 설정 확인

이미 토스 로그인을 사용하고 있다면:
1. 기존 서버 코드에서 Basic Auth 값 확인
2. 환경 변수 파일에서 확인
3. Supabase Secrets에서 기존 값 확인:
   ```bash
   supabase secrets list
   ```

---

## 📚 다음 단계

Client ID와 Client Secret을 확인한 후:

1. `docs/REGENERATE_SECRETS_GUIDE.md` 문서의 Step 3으로 이동
2. `supabase secrets set TOSS_API_BASIC_AUTH="Base64값"` 실행
3. 테스트 진행
