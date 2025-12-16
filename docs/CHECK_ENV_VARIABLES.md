# 환경 변수 확인 및 401 오류 해결

## 🔍 401 오류 원인 확인

401 오류가 계속 발생하는 경우, 다음을 확인해야 합니다:

### 1. 환경 변수 확인

브라우저 콘솔에서 실행:

```javascript
// 환경 변수 확인
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

// ENV 객체 확인
console.log('ENV.SUPABASE_URL:', window.ENV?.SUPABASE_URL);
console.log('ENV.SUPABASE_ANON_KEY:', window.ENV?.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

### 2. .env 파일 확인

프로젝트 루트에 `.env` 파일이 있는지 확인하고, 다음 형식으로 작성:

```env
VITE_SUPABASE_URL=https://aekcjzxxjczqibxkoakg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx...또는 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**주의사항**:
- `VITE_` 접두사가 필요합니다
- 값에 공백이나 따옴표가 없어야 합니다
- Supabase Anon Key는 최소 100자 이상이어야 합니다

### 3. Supabase Anon Key 확인 방법

1. [Supabase 대시보드](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. Settings > API 메뉴
4. **Project API keys** 섹션에서:
   - **anon** "public" 키 복사
   - 또는 **service_role** 키 (하지만 이건 서버에서만 사용)

### 4. Edge Function 인증 설정 확인

Supabase Edge Function은 기본적으로 인증이 필요합니다. 

**확인 방법**:
1. Supabase 대시보드 접속
2. Edge Functions > toss-oauth 선택
3. Settings에서 인증 설정 확인

**해결 방법**:
- Edge Function이 인증 없이 호출 가능하도록 설정되어 있는지 확인
- 또는 올바른 Anon Key를 사용하고 있는지 확인

### 5. 응답 본문 확인

401 오류의 응답 본문을 확인하여 정확한 오류 메시지를 확인:

```javascript
await window.testTossOAuth();
// 콘솔에서 response 객체의 response 필드 확인
```

---

## ✅ 체크리스트

- [ ] `.env` 파일이 프로젝트 루트에 있는지 확인
- [ ] `VITE_SUPABASE_URL` 값이 올바른지 확인 (https://로 시작)
- [ ] `VITE_SUPABASE_ANON_KEY` 값이 올바른지 확인 (100자 이상)
- [ ] 브라우저 콘솔에서 환경 변수 확인
- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] 브라우저 강력 새로고침 (Ctrl+Shift+R)

---

## 🚨 문제 해결

### 문제 1: 환경 변수가 undefined

**원인**: `.env` 파일이 없거나 잘못된 위치에 있음

**해결**:
1. 프로젝트 루트에 `.env` 파일 생성
2. 올바른 형식으로 작성
3. 개발 서버 재시작

### 문제 2: Anon Key가 너무 짧음

**원인**: 잘못된 키를 사용하거나 일부만 복사함

**해결**:
1. Supabase 대시보드에서 전체 키 복사
2. `.env` 파일에 붙여넣기
3. 공백이나 줄바꿈 제거

### 문제 3: Edge Function 인증 설정

**원인**: Edge Function이 인증을 요구하는 설정

**해결**:
1. Supabase 대시보드에서 Edge Function 설정 확인
2. 인증 없이 호출 가능하도록 설정 변경
3. 또는 올바른 인증 헤더 사용

---

## 💡 빠른 확인 명령어

브라우저 콘솔에서:

```javascript
// 환경 변수 확인
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY 길이:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);

// 테스트 (응답 본문 확인)
const result = await window.testTossOAuth();
console.log('응답 본문:', result.response);
```

