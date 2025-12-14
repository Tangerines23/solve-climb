# 토스 로그인 "fail to fetch" 오류 원인 분석 및 해결 방법

## 🔍 오류 원인 분석

토스 로그인 시 "fail to fetch" 오류가 발생하는 주요 원인은 다음과 같습니다:

### 1. Edge Function 미배포 ⚠️ (가장 흔한 원인)

**증상:**
- `Failed to fetch` 또는 `NetworkError` 발생
- Edge Function URL에 접근할 수 없음

**원인:**
- Supabase Edge Function이 로컬에만 있고 실제 Supabase 프로젝트에 배포되지 않음

**해결 방법:**
```bash
# Edge Function 배포
supabase functions deploy toss-oauth
supabase functions deploy toss-auth
```

### 2. 401 인증 실패 오류 ⚠️

**증상:**
- `401 Unauthorized` 에러 발생
- "액세스 토큰 요청 실패" 또는 "Authentication failed" 메시지
- Edge Function은 정상 작동하지만 토스 API 인증 실패

**원인:**
- `TOSS_API_BASIC_AUTH` 환경 변수가 Supabase Secrets에 설정되지 않음
- `TOSS_API_BASIC_AUTH` 값이 잘못되었거나 만료됨
- Basic Auth 형식이 올바르지 않음 (Base64 인코딩 필요)

**해결 방법:**

1. **토스 콘솔에서 인증 정보 확인**
   - [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) 접속
   - 앱 설정에서 `client_id`와 `client_secret` 확인

2. **Basic Auth 값 생성**
   - 형식: `client_id:client_secret`을 Base64로 인코딩
   - 예시:
     ```bash
     # Node.js에서 생성
     node -e "console.log(Buffer.from('your_client_id:your_client_secret').toString('base64'))"
     
     # 또는 온라인 Base64 인코더 사용
     # 입력: your_client_id:your_client_secret
     # 출력: eW91cl9jbGllbnRfaWQ6eW91cl9jbGllbnRfc2VjcmV0
     ```

3. **Supabase Secrets에 설정**
   ```bash
   # Supabase CLI 사용
   supabase secrets set TOSS_API_BASIC_AUTH=your_base64_encoded_value
   
   # 또는 Supabase 대시보드에서 설정
   # Edge Functions > Secrets 메뉴에서 추가
   ```

4. **설정 확인**
   ```bash
   # Secrets 목록 확인
   supabase secrets list
   
   # Edge Function 로그 확인 (401 에러 발생 시)
   supabase functions logs toss-oauth
   ```

**주의사항:**
- `TOSS_API_BASIC_AUTH` 값은 Base64로 인코딩된 문자열이어야 합니다
- `client_id:client_secret` 형식으로 콜론(`:`)을 포함해야 합니다
- 값에 공백이나 줄바꿈이 포함되지 않도록 주의하세요

### 3. 환경 변수 미설정

**필수 환경 변수:**
- 클라이언트: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Edge Function: `TOSS_API_BASIC_AUTH`, `SUPABASE_SERVICE_ROLE_KEY`

**확인 방법:**
```bash
# .env 파일 확인
cat .env

# Supabase 환경 변수 확인
supabase secrets list
```

**설정 방법:**
```bash
# Edge Function 환경 변수 설정
supabase secrets set TOSS_API_BASIC_AUTH=your_basic_auth_token
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Supabase URL 오류

**확인 사항:**
- `VITE_SUPABASE_URL`이 올바른 형식인지 확인 (`https://xxxxx.supabase.co`)
- 프로젝트 URL이 변경되었는지 확인

**해결 방법:**
1. Supabase 대시보드에서 프로젝트 URL 확인
2. `.env` 파일의 `VITE_SUPABASE_URL` 업데이트
3. 앱 재시작

### 5. CORS 문제

**증상:**
- 브라우저 콘솔에 CORS 관련 오류
- 특정 도메인에서만 발생

**해결 방법:**
- Edge Function의 CORS 헤더 확인 (이미 설정되어 있음)
- Supabase 대시보드에서 CORS 설정 확인

### 6. 네트워크 연결 문제

**증상:**
- 인터넷 연결 불안정
- 방화벽 또는 프록시 설정 문제

**해결 방법:**
- 네트워크 연결 확인
- 다른 네트워크에서 테스트
- VPN 사용 중인 경우 비활성화 후 테스트

## 🛠️ 디버깅 방법

### 1. 브라우저 개발자 도구 확인

1. **Network 탭 확인:**
   - Edge Function 호출이 실패하는지 확인
   - HTTP 상태 코드 확인 (404, 500 등)
   - 요청 URL이 올바른지 확인

2. **Console 탭 확인:**
   - 자세한 에러 메시지 확인
   - 환경 변수 값 확인

### 2. Edge Function 로그 확인

```bash
# Edge Function 로그 확인
supabase functions logs toss-oauth
supabase functions logs toss-auth
```

### 3. 환경 변수 확인

```typescript
// 개발자 도구 콘솔에서 실행
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '미설정');
```

### 4. Edge Function 직접 테스트

```bash
# curl로 Edge Function 테스트
curl -X POST https://your-project.supabase.co/functions/v1/toss-oauth \
  -H "Content-Type: application/json" \
  -H "apikey: your-anon-key" \
  -d '{"authorizationCode":"test","referrer":"DEFAULT"}'
```

## 📋 체크리스트

로그인 오류 발생 시 다음을 확인하세요:

- [ ] Edge Function이 배포되어 있는가?
  ```bash
  supabase functions list
  ```

- [ ] 환경 변수가 설정되어 있는가?
  - 클라이언트: `.env` 파일 확인
  - Edge Function: `supabase secrets list` 확인
  - **특히 `TOSS_API_BASIC_AUTH`가 올바르게 설정되어 있는지 확인 (401 에러 발생 시 필수)**

- [ ] Supabase URL이 올바른가?
  - Supabase 대시보드에서 프로젝트 URL 확인
  - `.env` 파일의 URL과 일치하는지 확인

- [ ] Edge Function이 정상 작동하는가?
  - `supabase functions logs`로 로그 확인
  - 직접 API 호출 테스트

- [ ] 네트워크 연결이 정상인가?
  - 다른 네트워크에서 테스트
  - 브라우저 개발자 도구 Network 탭 확인

## 🔧 개선된 에러 메시지

코드 개선으로 이제 더 자세한 에러 메시지가 표시됩니다:

- **환경 변수 미설정:** 어떤 환경 변수가 누락되었는지 표시
- **Edge Function 미배포:** 배포 명령어 안내
- **401 인증 실패:** 토스 API 인증 문제 시 구체적인 안내 메시지
  - TOSS_API_BASIC_AUTH 설정 안내
  - 토스 콘솔에서 인증 정보 확인 방법
  - Base64 인코딩 필요 여부 안내
- **네트워크 오류:** 구체적인 원인 제시
- **HTTP 오류:** 상태 코드와 상세 메시지 표시

## 📞 추가 지원

문제가 지속되면 다음 정보를 수집하여 문의하세요:

1. 브라우저 콘솔의 전체 에러 메시지
2. Network 탭의 실패한 요청 정보
3. Edge Function 로그 (`supabase functions logs`)
4. 환경 변수 설정 상태 (민감한 값 제외)
