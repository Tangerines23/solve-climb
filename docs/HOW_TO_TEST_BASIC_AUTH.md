# Basic Auth 테스트 방법 가이드

Basic Auth가 작동하는지 테스트하는 방법을 단계별로 안내합니다.

---

## 🎯 테스트 목표

토스 로그인 API가 Basic Auth로 작동하는지 확인합니다.

---

## 📍 테스트 위치

**브라우저 개발자 도구 콘솔**에서 테스트합니다.

---

## 🚀 테스트 방법

### 방법 1: 브라우저 콘솔에서 직접 테스트 (가장 빠름)

#### Step 1: 개발 서버 실행

터미널에서:

```bash
npm run dev
```

#### Step 2: 브라우저에서 앱 열기

1. 브라우저에서 앱 열기 (예: `http://localhost:5173`)
2. **F12** 키를 눌러 개발자 도구 열기
3. **Console** 탭 선택

#### Step 3: 테스트 함수 실행

콘솔에 다음 명령어 입력:

```javascript
// toss-oauth Edge Function 테스트
await window.testTossOAuth();
```

**결과 확인**:

✅ **성공 예시**:
```javascript
{
  success: true,
  status: 200,
  duration: 1234,
  response: {
    success: true,
    accessToken: "eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ..."
  }
}
```

❌ **실패 예시 (401 에러)**:
```javascript
{
  success: false,
  status: 401,
  duration: 567,
  response: {
    error: "Authentication failed",
    message: "토스 API 인증에 실패했습니다..."
  }
}
```

❌ **실패 예시 (Edge Function 미배포)**:
```javascript
{
  success: false,
  status: 404,
  duration: 234,
  response: "Not Found"
}
```

---

### 방법 2: 전체 로그인 플로우 체크

더 자세한 정보를 확인하려면:

```javascript
// 전체 로그인 플로우 체크 (환경 변수, 엔드포인트 등)
await window.checkTossLoginFlow();
```

이 함수는 다음을 확인합니다:
- ✅ 환경 변수 설정 여부
- ✅ Edge Function 엔드포인트 접근 가능 여부
- ✅ 토스 앱 환경 여부

---

### 방법 3: 실제 로그인 버튼 클릭 (가장 확실)

#### Step 1: 마이페이지로 이동

브라우저에서 앱의 **마이페이지**로 이동

#### Step 2: 토스 로그인 버튼 클릭

"토스 로그인" 또는 "로그인" 버튼 클릭

#### Step 3: 결과 확인

**성공하면**:
- 로그인 성공 메시지 표시
- 사용자 정보 표시
- 콘솔에 성공 로그 출력

**실패하면**:
- 에러 메시지 표시
- 콘솔에 에러 로그 출력
- 에러 내용 확인

---

## 🔍 테스트 결과 해석

### ✅ 성공 (Basic Auth 작동)

```
✅ 테스트 결과: {
  status: 200,
  response: { success: true, accessToken: "..." }
}
```

**의미**: Basic Auth가 작동합니다! 계속 사용 가능합니다.

**다음 단계**: 
- 현재 Basic Auth 방식 계속 사용
- mTLS는 나중에 필요시 전환

---

### ❌ 401 에러 (인증 실패)

```
❌ 테스트 결과: {
  status: 401,
  response: { error: "Authentication failed" }
}
```

**의미**: Basic Auth가 작동하지 않거나, `TOSS_API_BASIC_AUTH` 값이 잘못되었습니다.

**해결 방법**:
1. `TOSS_API_BASIC_AUTH` 값 확인
2. Base64 인코딩이 올바른지 확인
3. 토스 고객지원에 Basic Auth 지원 여부 문의
4. 또는 mTLS 프록시 서버 구축

---

### ❌ 404 에러 (Edge Function 미배포)

```
❌ 테스트 결과: {
  status: 404,
  response: "Not Found"
}
```

**의미**: Edge Function이 배포되지 않았습니다.

**해결 방법**:
```bash
# Edge Function 배포
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
```

---

### ❌ 500 에러 (서버 오류)

```
❌ 테스트 결과: {
  status: 500,
  response: { error: "Server configuration error" }
}
```

**의미**: Edge Function 설정 오류입니다.

**해결 방법**:
1. `TOSS_API_BASIC_AUTH` 값이 설정되어 있는지 확인
2. `SERVICE_ROLE_KEY` 값이 설정되어 있는지 확인
3. Edge Function 로그 확인:
   ```bash
   supabase functions logs toss-oauth
   ```

---

## 🛠️ 디버깅 팁

### 환경 변수 확인

브라우저 콘솔에서:

```javascript
// Supabase URL 확인
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);

// Supabase Anon Key 확인 (일부만 표시)
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

### Edge Function 로그 확인

터미널에서:

```bash
# 실시간 로그 확인
supabase functions logs toss-oauth --follow

# 최근 로그 확인
supabase functions logs toss-oauth --limit 50
```

### 네트워크 요청 확인

브라우저 개발자 도구:
1. **Network** 탭 열기
2. 테스트 함수 실행
3. `toss-oauth` 요청 확인
4. 요청/응답 헤더 및 본문 확인

---

## 📋 테스트 체크리스트

- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 브라우저에서 앱 열기
- [ ] 개발자 도구 콘솔 열기 (F12)
- [ ] `await window.testTossOAuth()` 실행
- [ ] 결과 확인 및 해석
- [ ] 필요시 `await window.checkTossLoginFlow()` 실행
- [ ] 필요시 실제 로그인 버튼 클릭 테스트

---

## 💡 빠른 테스트 명령어

브라우저 콘솔에 복사해서 붙여넣기:

```javascript
// 빠른 테스트
await window.testTossOAuth();

// 자세한 체크
await window.checkTossLoginFlow();

// 환경 변수 확인
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

## 📚 참고 문서

- `docs/MTLS_CERTIFICATE_QUICK_START.md` - mTLS 인증서 빠른 시작
- `docs/HOW_TO_USE_MTLS_CERTIFICATE.md` - mTLS 인증서 사용 방법
- `docs/TOSS_LOGIN_TROUBLESHOOTING.md` - 문제 해결 가이드

---

## 🎯 다음 단계

테스트 결과에 따라:

1. **✅ 성공**: Basic Auth 작동 → 계속 사용
2. **❌ 실패**: mTLS 프록시 서버 구축 또는 토스 고객지원 문의

