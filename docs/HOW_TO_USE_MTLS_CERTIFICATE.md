# mTLS 인증서 사용 방법 가이드

mTLS 인증서를 발급받으셨다면, 이제 이를 사용하는 방법을 안내합니다.

---

## 📁 발급받은 파일

- **인증서 파일**: `.crt` 또는 `.pem` 확장자
- **키 파일**: `.key` 또는 `.pem` 확장자

예시:
- `solve-climb-mtls_public.crt` (인증서 파일)
- `solve-climb-mtls_private.key` (키 파일)

---

## ⚠️ 현재 프로젝트 상황

현재 프로젝트는 **Supabase Edge Functions**를 사용하고 있습니다.

**문제점**:
- Supabase Edge Functions는 Deno 환경에서 실행됩니다
- 파일 시스템에 직접 접근하기 어렵습니다
- 인증서 파일을 업로드하는 방법이 제한적입니다

**해결 방법 3가지**:

---

## 방법 1: Supabase Secrets에 저장하여 사용 (권장) ⭐

### Step 1: 인증서 파일 내용 읽기

터미널에서 실행:

```bash
# Windows (PowerShell)
Get-Content solve-climb-mtls_public.crt -Raw
Get-Content solve-climb-mtls_private.key -Raw

# Mac/Linux
cat solve-climb-mtls_public.crt
cat solve-climb-mtls_private.key
```

### Step 2: Supabase Secrets에 저장

인증서와 키 파일의 전체 내용을 복사하여 Secrets에 저장:

```bash
# 인증서 파일 내용 저장 (전체 내용을 복사)
supabase secrets set TOSS_MTLS_CERT="-----BEGIN CERTIFICATE-----
MIIF... (전체 인증서 내용)
-----END CERTIFICATE-----"

# 키 파일 내용 저장 (전체 내용을 복사)
supabase secrets set TOSS_MTLS_KEY="-----BEGIN PRIVATE KEY-----
MIIE... (전체 키 내용)
-----END PRIVATE KEY-----"
```

⚠️ **주의**: 
- 전체 내용을 복사해야 합니다 (줄바꿈 포함)
- `-----BEGIN CERTIFICATE-----`부터 `-----END CERTIFICATE-----`까지 모두 포함
- `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 모두 포함

### Step 3: Edge Function 코드 수정

`supabase/functions/toss-oauth/index.ts` 파일을 수정하여 mTLS 사용:

```typescript
// Deno에서 TLS 사용
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

serve(async (req) => {
  // ... 기존 코드 ...

  // mTLS 인증서 가져오기
  const cert = Deno.env.get('TOSS_MTLS_CERT');
  const key = Deno.env.get('TOSS_MTLS_KEY');

  if (!cert || !key) {
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error',
        message: 'mTLS 인증서가 설정되지 않았습니다.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Deno의 fetch는 mTLS를 직접 지원하지 않으므로
  // 다른 방법 필요 (아래 방법 2 또는 3 참고)
});
```

⚠️ **문제**: Deno의 `fetch` API는 mTLS를 직접 지원하지 않습니다.

---

## 방법 2: 중간 프록시 서버 구축 (가장 확실한 방법) ⭐⭐⭐

Supabase Edge Functions에서 mTLS를 직접 사용하기 어려우므로, **중간 프록시 서버**를 구축하는 것이 가장 확실합니다.

### 구조

```
클라이언트 → Supabase Edge Function → 프록시 서버 (mTLS) → 토스 API
```

### Step 1: 프록시 서버 생성

예제 코드를 참고하여 Node.js 프록시 서버 생성:

**프로젝트 루트에 `proxy-server` 폴더 생성**

```bash
mkdir proxy-server
cd proxy-server
npm init -y
npm install express https
```

### Step 2: 프록시 서버 코드 작성

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
      res.status(500).json({ error: error.message });
    });

    proxyReq.write(JSON.stringify({ authorizationCode, referrer }));
    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
```

### Step 3: 인증서 파일 배치

```bash
# proxy-server 폴더에 cert 폴더 생성
mkdir proxy-server/cert

# 인증서 파일 복사
cp solve-climb-mtls_public.crt proxy-server/cert/
cp solve-climb-mtls_private.key proxy-server/cert/
```

### Step 4: 프록시 서버 배포

**옵션 A: Vercel/Netlify 등에 배포**

**옵션 B: 자체 서버에 배포**

**옵션 C: 로컬 개발용 (개발 중에만)**

### Step 5: Edge Function 수정

`supabase/functions/toss-oauth/index.ts`:

```typescript
// 프록시 서버 URL로 변경
const PROXY_SERVER_URL = 'https://your-proxy-server.com'; // 프록시 서버 URL

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

---

## 방법 3: 현재 Basic Auth 방식 계속 사용 (임시)

mTLS 설정이 복잡하다면, **현재 Basic Auth 방식이 작동하는지 먼저 테스트**해보세요.

### Step 1: Basic Auth 테스트

```bash
# Basic Auth 값 설정 (있다면)
supabase secrets set TOSS_API_BASIC_AUTH="Base64_인코딩된_값"

# Edge Function 배포
supabase functions deploy toss-oauth

# 브라우저 콘솔에서 테스트
await window.testTossOAuth();
```

### Step 2: 작동 여부 확인

- ✅ **작동한다면**: 일단 Basic Auth 사용, 나중에 mTLS로 전환
- ❌ **작동하지 않는다면**: 방법 2 (프록시 서버) 사용

---

## 📊 방법 비교

| 방법 | 난이도 | 안정성 | 권장도 |
|------|--------|--------|--------|
| **방법 1: Secrets 저장** | ⚠️ 높음 | ⚠️ 낮음 | ❌ Deno fetch 미지원 |
| **방법 2: 프록시 서버** | ⚠️ 중간 | ✅ 높음 | ✅ **권장** |
| **방법 3: Basic Auth** | ✅ 낮음 | ⚠️ 불확실 | ⚠️ 임시 |

---

## ✅ 권장 순서

### 1단계: Basic Auth 테스트 (빠른 확인)

```bash
await window.testTossOAuth();
```

### 2단계: 작동하지 않으면 프록시 서버 구축

방법 2를 따라 프록시 서버 구축

### 3단계: 프록시 서버 배포 및 Edge Function 수정

프록시 서버 URL로 변경

---

## 🔒 보안 주의사항

1. **인증서 파일 보관**
   - `.gitignore`에 추가하여 Git에 커밋하지 마세요
   - 안전한 위치에 보관하세요
   - 필요시 암호화하여 저장하세요

2. **프록시 서버 보안**
   - HTTPS 사용
   - 인증 추가 (API 키 등)
   - Rate limiting 적용

3. **Supabase Secrets**
   - Secrets는 암호화되어 저장됩니다
   - 하지만 민감한 정보이므로 주의하세요

---

## 📚 참고 자료

- [토스 API 사용하기 (mTLS)](https://developers-apps-in-toss.toss.im/development/integration-process.html)
- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- `apps-in-toss-examples-main/with-app-login/server` - 예제 코드

---

## 💡 다음 단계

1. **인증서 파일 안전하게 보관** ✅ (완료)
2. **Basic Auth 테스트** (빠른 확인)
3. **프록시 서버 구축** (필요시)
4. **프록시 서버 배포** (필요시)
5. **Edge Function 수정** (필요시)

**가장 빠른 방법**: 먼저 Basic Auth가 작동하는지 테스트해보세요!

