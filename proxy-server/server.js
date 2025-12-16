const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// mTLS 인증서 로드
const certPath = path.join(__dirname, 'cert', 'solve-climb-mtls_public.crt');
const keyPath = path.join(__dirname, 'cert', 'solve-climb-mtls_private.key');

// 인증서 파일 존재 확인
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('❌ 인증서 파일을 찾을 수 없습니다!');
  console.error(`인증서 경로: ${certPath}`);
  console.error(`키 경로: ${keyPath}`);
  console.error('cert 폴더에 인증서 파일을 복사해주세요.');
  process.exit(1);
}

const tlsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
  rejectUnauthorized: true,
};

console.log('✅ mTLS 인증서 로드 완료');

// 프록시 엔드포인트: 토스 OAuth AccessToken 받기
app.post('/api/toss-oauth/generate-token', async (req, res) => {
  try {
    const { authorizationCode, referrer } = req.body;

    if (!authorizationCode) {
      return res.status(400).json({ 
        error: 'authorizationCode is required' 
      });
    }

    console.log('[프록시] 토스 API 호출 시작:', {
      authorizationCode: authorizationCode.substring(0, 20) + '...',
      referrer: referrer || 'DEFAULT',
    });

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
      
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('[프록시] 토스 API 응답:', {
            status: proxyRes.statusCode,
            success: jsonData.resultType === 'SUCCESS',
          });
          
          res.status(proxyRes.statusCode).json(jsonData);
        } catch (parseError) {
          console.error('[프록시] JSON 파싱 오류:', parseError);
          res.status(proxyRes.statusCode).json({
            error: 'Failed to parse response',
            rawResponse: data,
          });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('[프록시] 요청 오류:', error);
      res.status(500).json({ 
        error: 'Proxy request failed',
        message: error.message 
      });
    });

    proxyReq.write(JSON.stringify({
      authorizationCode,
      referrer: referrer || 'DEFAULT',
    }));
    
    proxyReq.end();
  } catch (error) {
    console.error('[프록시] 예외 발생:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'toss-oauth-proxy',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 토스 OAuth 프록시: http://localhost:${PORT}/api/toss-oauth/generate-token`);
});

