# mTLS vs Basic Auth - 토스 로그인 API 인증 방식 비교

## 🎯 핵심 질문: mTLS가 필수인가?

**답변**: **토스 공식 문서에 따르면 mTLS가 필수입니다.** 하지만 실제로는 상황에 따라 다를 수 있습니다.

---

## 📚 토스 공식 문서의 내용

[토스 API 사용하기 문서](https://developers-apps-in-toss.toss.im/development/integration-process.html)에 명시된 내용:

### mTLS가 필요한 기능들

다음 기능들은 **반드시 mTLS 인증서를 통한 통신이 필요**합니다:

- ✅ **토스 로그인**
- ✅ 토스 페이
- ✅ 인앱 결제
- ✅ 기능성 푸시, 알림
- ✅ 프로모션(토스 포인트)

### mTLS 인증서 발급 방법

- **위치**: 앱인토스 콘솔 > "mTLS 인증서" 탭
- **발급**: "+ 발급받기" 버튼 클릭
- **파일**: 인증서 파일(cert) + 키 파일(key)
- **유효기간**: 390일

---

## 🔍 현재 프로젝트 상황

### 현재 프로젝트의 구현 방식

**파일**: `supabase/functions/toss-oauth/index.ts`

```typescript
// Basic Auth를 사용하고 있음
const basicAuth = Deno.env.get('TOSS_API_BASIC_AUTH');
const authHeader = `Basic ${basicAuth}`;

const response = await fetch(
  `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,  // Basic Auth 사용
    },
    body: JSON.stringify({
      authorizationCode,
      referrer: referrer || 'DEFAULT',
    }),
  }
);
```

**특징**:
- ✅ Basic Auth 방식 사용 (`client_id:client_secret` Base64 인코딩)
- ✅ 일반 `fetch` API 사용 (mTLS 없음)
- ✅ Supabase Edge Functions 환경에서 실행

### 예제 코드의 구현 방식

**파일**: `apps-in-toss-examples-main/with-app-login/server/src/services/auth.service.js`

```javascript
// mTLS를 사용하고 있음
const TLSClient = require('../clients/TLSClient');
const client = new TLSClient(CLIENT_CERT_PATH, CLIENT_KEY_PATH);

exports.getAccessToken = async ({ authorizationCode, referrer }) => {
  return client.post(`${AUTH_API_BASE}/generate-token`, {
    authorizationCode,
    referrer,
  });
};
```

**특징**:
- ✅ mTLS 인증서 사용
- ✅ TLSClient 클래스 사용
- ✅ Node.js 서버 환경에서 실행

---

## 🤔 왜 이런 차이가 있을까?

### 가능한 시나리오

#### 시나리오 1: Basic Auth가 실제로 작동함
- 토스가 Basic Auth를 지원하는 별도 엔드포인트를 제공할 수 있음
- 또는 내부적으로 Basic Auth를 mTLS로 변환하는 프록시가 있을 수 있음
- 현재 프로젝트가 이미 작동 중이라면 이 경우일 가능성이 높음

#### 시나리오 2: 아직 테스트되지 않음
- 코드는 작성되었지만 실제로 작동하는지 테스트되지 않았을 수 있음
- `TOSS_API_BASIC_AUTH` 값이 설정되지 않아서 아직 시도해보지 않았을 수 있음

#### 시나리오 3: Supabase Edge Functions의 제약
- Supabase Edge Functions는 Deno 환경에서 실행됨
- mTLS 인증서를 직접 사용하기 어려울 수 있음
- 그래서 Basic Auth를 사용하려고 시도했을 수 있음

---

## ✅ 확인 방법

### 1. 현재 Basic Auth 방식이 작동하는지 테스트

```bash
# 1. TOSS_API_BASIC_AUTH 값 설정 (있다면)
supabase secrets set TOSS_API_BASIC_AUTH="Base64_인코딩된_값"

# 2. Edge Function 배포
supabase functions deploy toss-oauth

# 3. 브라우저 콘솔에서 테스트
await window.testTossOAuth();
```

**결과 분석**:
- ✅ **성공한다면**: Basic Auth가 작동하는 것 → 계속 사용 가능
- ❌ **401 에러**: mTLS가 필요할 수 있음
- ❌ **네트워크 에러**: mTLS가 필수일 수 있음

### 2. 토스 고객지원에 문의

**문의 내용**:
```
제목: 토스 로그인 API 인증 방식 문의

내용:
안녕하세요.

토스 로그인 API(/api-partner/v1/apps-in-toss/user/oauth2/generate-token)를 
Supabase Edge Functions(Deno 환경)에서 호출하려고 합니다.

문의 사항:
1. 이 API는 mTLS 인증서가 필수인가요?
2. Supabase Edge Functions처럼 mTLS를 사용하기 어려운 환경에서는 
   Basic Auth 방식(client_id:client_secret)을 사용할 수 있나요?
3. 만약 Basic Auth가 불가능하다면, 다른 대안이 있나요?

감사합니다.
```

---

## 📊 비교표

| 항목 | mTLS (공식 방법) | Basic Auth (현재 프로젝트) |
|------|------------------|---------------------------|
| **토스 공식 문서** | ✅ 필수라고 명시 | ❌ 언급 없음 |
| **예제 코드** | ✅ 사용 중 | ❌ 사용 안 함 |
| **현재 프로젝트** | ❌ 사용 안 함 | ✅ 사용 중 |
| **Supabase Edge Functions** | ⚠️ 어려움 | ✅ 가능 |
| **보안** | ✅ 높음 (상호 인증) | ⚠️ 낮음 (단방향) |
| **구현 난이도** | ⚠️ 높음 | ✅ 낮음 |

---

## 💡 결론 및 권장사항

### 결론

**토스 공식 문서에 따르면 mTLS가 필수입니다.**  
하지만 현재 프로젝트가 Basic Auth를 사용하고 있다는 것은:

1. **아직 테스트되지 않았을 수 있음**
2. **또는 실제로 작동할 수 있음** (토스가 내부적으로 지원할 수 있음)

### 권장사항

#### 1단계: 현재 방식 테스트
```bash
# Basic Auth 값 설정 후 테스트
await window.testTossOAuth();
```

#### 2단계: 작동하지 않는다면
- **mTLS 인증서 발급** (앱인토스 콘솔)
- **중간 프록시 서버 구축** (mTLS 사용)
- 또는 **토스 고객지원 문의**

#### 3단계: 작동한다면
- **현재 Basic Auth 방식 계속 사용**
- 다만 토스 공식 문서와 다르므로 **토스 고객지원에 확인** 권장

---

## 🚨 주의사항

1. **공식 문서와 다름**: 현재 프로젝트가 Basic Auth를 사용하고 있지만, 공식 문서는 mTLS를 요구합니다.

2. **향후 변경 가능성**: 토스가 언제든지 Basic Auth 지원을 중단할 수 있습니다.

3. **보안 고려**: mTLS가 더 안전한 방법입니다 (상호 인증).

4. **테스트 필수**: 실제로 작동하는지 반드시 테스트해야 합니다.

---

## 📚 참고 문서

- [토스 API 사용하기 (mTLS)](https://developers-apps-in-toss.toss.im/development/integration-process.html) ⭐ **공식 문서**
- [토스 로그인 개발 가이드](https://developers-apps-in-toss.toss.im/login/develop.html)
- `docs/HOW_TO_FIND_CLIENT_ID_SECRET.md` - 인증 정보 찾기 가이드

---

## ✅ 체크리스트

- [ ] 현재 Basic Auth 방식이 작동하는지 테스트 완료
- [ ] 작동하지 않는다면 mTLS 인증서 발급 완료
- [ ] 토스 고객지원에 Basic Auth 지원 여부 문의 완료
- [ ] 최종 인증 방식 결정 및 문서화 완료

