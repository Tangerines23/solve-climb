# CertificateRequired 오류 해결 가이드

## 🚨 문제

`window.testTossOAuth()` 실행 시 다음 오류 발생:

```
500 Internal Server Error
message: "received fatal alert: CertificateRequired"
```

## 🔍 원인

**토스 API가 mTLS 인증서를 요구하고 있습니다!**

오류 메시지 `CertificateRequired`는 토스 API 서버가 클라이언트 인증서(mTLS)를 요구하고 있다는 의미입니다.

현재 상황:
- ✅ Edge Function은 정상 작동 (401 → 500으로 변경됨 = 인증 통과)
- ❌ 토스 API 호출 시 mTLS 인증서가 없어서 실패
- ✅ 이미 mTLS 인증서를 발급받으셨습니다 (`cert/solve-climb-mtls_public.crt`)

## ✅ 해결 방법

### 방법 1: 프록시 서버 구축 (권장) ⭐⭐⭐

Supabase Edge Functions는 mTLS를 직접 사용하기 어려우므로, **중간 프록시 서버**를 구축해야 합니다.

#### 구조

```
브라우저 → Supabase Edge Function → 프록시 서버 (mTLS) → 토스 API
```

#### Step 1: 프록시 서버 생성

프로젝트 루트에 `proxy-server` 폴더 생성:

```bash
mkdir proxy-server
cd proxy-server
npm init -y
npm install express https
```

#### Step 2: 프록시 서버 코드 작성

`proxy-server/server.js`:

```javascript
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// mTLS 인증서 로드
const certPath = path.join(__dirname, 'cert', 'solve-climb-mtls_public.crt');
const keyPath = path.join(__dirname, 'cert', 'solve-climb-mtls_private.key');

const tlsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
  rejectUnauthorized: true,
};

// 프록시 엔드포인트
app.post('/api/toss-oauth/generate-token', async (req, res) => {
  try {
    const { authorizationCode, referrer } = req.body;

    const options = {
      hostname: 'apps-in-toss-api.toss.im',
      port: 443,
      path: '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      method: 'POST',
      ...tlsOptions, // mTLS 인증서 사용
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => (data += chunk));
      proxyRes.on('end', () => {
        res.json(JSON.parse(data));
      });
    });

    proxyReq.on('error', (error) => {
      console.error('프록시 오류:', error);
      res.status(500).json({ error: error.message });
    });

    proxyReq.write(JSON.stringify({ authorizationCode, referrer }));
    proxyReq.end();
  } catch (error) {
    console.error('프록시 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
```

#### Step 3: 인증서 파일 복사

```bash
# proxy-server 폴더에 cert 폴더 생성
mkdir proxy-server/cert

# 인증서 파일 복사
cp cert/solve-climb-mtls_public.crt proxy-server/cert/
cp cert/solve-climb-mtls_private.key proxy-server/cert/
```

#### Step 4: 프록시 서버 배포

**옵션 A: Vercel에 배포**

1. Vercel에 로그인
2. `proxy-server` 폴더를 새 프로젝트로 추가
3. 배포

**옵션 B: 다른 호스팅 서비스 사용**

- Railway
- Render
- Fly.io
- 또는 자체 서버

#### Step 5: Edge Function 수정

`supabase/functions/toss-oauth/index.ts`:

```typescript
// 프록시 서버 URL (환경 변수로 설정)
const PROXY_SERVER_URL = Deno.env.get('PROXY_SERVER_URL') || 'https://your-proxy-server.com';

// 토스 API 대신 프록시 서버 호출
const response = await fetch(
  `${PROXY_SERVER_URL}/api/toss-oauth/generate-token`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorizationCode,
      referrer: referrer || 'DEFAULT',
    }),
  }
);
```

#### Step 6: Supabase Secrets 설정

```bash
supabase secrets set PROXY_SERVER_URL="https://your-proxy-server.com"
```

---

### 방법 2: Deno에서 mTLS 사용 시도 (실험적)

Deno의 `fetch`는 mTLS를 직접 지원하지 않지만, `Deno.connectTls`를 사용할 수 있습니다.

하지만 복잡하고 권장하지 않습니다.

---

## 📊 현재 상황 정리

| 단계 | 상태 | 설명 |
|------|------|------|
| Edge Function 배포 | ✅ 완료 | 정상 작동 |
| Edge Function 인증 | ✅ 통과 | 401 → 500으로 변경됨 |
| 토스 API 호출 | ❌ 실패 | mTLS 인증서 필요 |
| mTLS 인증서 발급 | ✅ 완료 | `cert/solve-climb-mtls_public.crt` |

---

## 💡 빠른 해결 방법

가장 빠른 방법은 **프록시 서버를 구축**하는 것입니다:

1. `proxy-server` 폴더 생성
2. 프록시 서버 코드 작성
3. Vercel 등에 배포
4. Edge Function 수정

---

## 📚 참고 문서

- `docs/HOW_TO_USE_MTLS_CERTIFICATE.md` - mTLS 인증서 사용 방법
- `docs/MTLS_CERTIFICATE_QUICK_START.md` - 빠른 시작 가이드

---

## ✅ 다음 단계

1. **프록시 서버 구축** (방법 1 참고)
2. **프록시 서버 배포**
3. **Edge Function 수정**
4. **테스트**

**결론**: 토스 API는 mTLS 인증서가 필수입니다. 프록시 서버를 구축해야 합니다!

