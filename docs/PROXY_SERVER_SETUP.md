# 프록시 서버 설정 완료 가이드

프록시 서버가 구축되었습니다! 다음 단계를 따라 설정을 완료하세요.

## ✅ 완료된 작업

1. ✅ 프록시 서버 코드 작성 (`proxy-server/server.js`)
2. ✅ package.json 생성
3. ✅ Edge Function 수정 (프록시 서버 사용)
4. ✅ .gitignore 업데이트

## 📋 다음 단계

### Step 1: 인증서 파일 복사

프로젝트 루트의 `cert` 폴더에서 프록시 서버의 `cert` 폴더로 인증서 파일을 복사하세요:

```bash
# Windows (PowerShell)
Copy-Item cert\solve-climb-mtls_public.crt proxy-server\cert\
Copy-Item cert\solve-climb-mtls_private.key proxy-server\cert\

# Mac/Linux
cp cert/solve-climb-mtls_public.crt proxy-server/cert/
cp cert/solve-climb-mtls_private.key proxy-server/cert/
```

⚠️ **중요**: 인증서 파일 이름이 다를 수 있습니다. 실제 파일 이름을 확인하세요.

### Step 2: 프록시 서버 로컬 테스트

```bash
cd proxy-server
npm install
npm start
```

서버가 `http://localhost:3000`에서 실행되는지 확인하세요.

### Step 3: 프록시 서버 배포

#### 옵션 A: Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. `proxy-server` 폴더 선택
4. 배포 설정:
   - Framework Preset: "Other"
   - Root Directory: `proxy-server`
   - Build Command: (비워두기)
   - Output Directory: (비워두기)
5. "Deploy" 클릭

#### 옵션 B: 다른 호스팅 서비스

- Railway
- Render
- Fly.io
- 또는 자체 서버

### Step 4: Supabase Secrets 설정

프록시 서버 배포 후 URL을 Supabase Secrets에 설정:

```bash
# 프록시 서버 URL 설정 (예: https://your-proxy.vercel.app)
supabase secrets set PROXY_SERVER_URL="https://your-proxy-server.com"
```

### Step 5: Edge Function 재배포

```bash
supabase functions deploy toss-oauth
```

### Step 6: 테스트

브라우저 콘솔에서:

```javascript
await window.testTossOAuth();
```

## 🔍 문제 해결

### 인증서 파일을 찾을 수 없음

프록시 서버 실행 시 다음 오류가 발생하면:

```
❌ 인증서 파일을 찾을 수 없습니다!
```

**해결**: Step 1을 다시 확인하고 인증서 파일을 복사하세요.

### 프록시 서버가 시작되지 않음

**해결**:
```bash
cd proxy-server
npm install
npm start
```

### Edge Function에서 여전히 오류 발생

**확인 사항**:
1. 프록시 서버가 정상 실행 중인지 확인
2. `PROXY_SERVER_URL`이 올바르게 설정되었는지 확인:
   ```bash
   supabase secrets list
   ```
3. Edge Function이 재배포되었는지 확인

## 📚 참고 문서

- `proxy-server/README.md` - 프록시 서버 상세 가이드
- `docs/CERTIFICATE_REQUIRED_ERROR.md` - 오류 해결 가이드
- `docs/HOW_TO_USE_MTLS_CERTIFICATE.md` - mTLS 사용 방법

## ✅ 체크리스트

- [ ] 인증서 파일 복사 완료
- [ ] 프록시 서버 로컬 테스트 성공
- [ ] 프록시 서버 배포 완료
- [ ] `PROXY_SERVER_URL` Supabase Secrets 설정 완료
- [ ] Edge Function 재배포 완료
- [ ] 브라우저에서 테스트 성공

---

**다음**: Step 1부터 시작하세요!

