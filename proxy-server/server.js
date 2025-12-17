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

// mTLS 인증서 로드 (환경 변수 우선, 없으면 파일 시스템에서)
let tlsOptions;

// 환경 변수에서 인증서 로드 시도
const certContent = process.env.TOSS_MTLS_CERT;
const keyContent = process.env.TOSS_MTLS_KEY;

if (certContent && keyContent) {
  // 환경 변수에서 로드
  console.log('📦 환경 변수에서 mTLS 인증서 로드 시도...');
  tlsOptions = {
    cert: certContent,
    key: keyContent,
    rejectUnauthorized: true,
  };
  console.log('✅ mTLS 인증서 로드 완료 (환경 변수에서)');
} else {
  // 파일 시스템에서 로드 (로컬 개발용)
  console.log('📁 파일 시스템에서 mTLS 인증서 로드 시도...');
  const certPath = path.join(__dirname, 'cert', 'solve-climb-mtls_public.crt');
  const keyPath = path.join(__dirname, 'cert', 'solve-climb-mtls_private.key');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('❌ 인증서 파일을 찾을 수 없습니다!');
    console.error(`인증서 경로: ${certPath}`);
    console.error(`키 경로: ${keyPath}`);
    console.error('');
    console.error('해결 방법:');
    console.error('1. 로컬 개발: cert 폴더에 인증서 파일을 복사하세요.');
    console.error('2. Vercel 배포: Environment Variables에 TOSS_MTLS_CERT와 TOSS_MTLS_KEY를 설정하세요.');
    process.exit(1);
  }

  tlsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: true,
  };
  console.log('✅ mTLS 인증서 로드 완료 (파일 시스템에서)');
}

// 프록시 엔드포인트: 토스 사용자 정보 조회
app.post('/api/toss-auth/user-info', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        error: 'accessToken is required' 
      });
    }

    console.log('[프록시] 토스 사용자 정보 조회 시작:', {
      accessTokenPrefix: accessToken.substring(0, 20) + '...',
      accessTokenLength: accessToken.length,
    });

    // 토스 API는 mTLS 인증서만 사용
    // Bearer 접두사가 있으면 제거 (토스 API는 Bearer 없이 accessToken만 요구)
    const cleanAccessToken = accessToken.replace(/^Bearer\s+/i, '');
    
    console.log('[프록시] Bearer 접두사 제거:', {
      hadBearerPrefix: accessToken !== cleanAccessToken,
      cleanTokenPrefix: cleanAccessToken.substring(0, 20) + '...',
    });
    
    const options = {
      hostname: 'apps-in-toss-api.toss.im',
      port: 443,
      path: '/api-partner/v1/apps-in-toss/user/oauth2/login-me',
      method: 'GET',
      headers: {
        'Authorization': cleanAccessToken, // Bearer 없이 accessToken만 전달 (토스 API 예제 참고)
        'Content-Type': 'application/json; charset=utf-8', // 토스 API 예제와 동일한 형식
      },
      ...tlsOptions,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('[프록시] 토스 사용자 정보 응답:', {
            status: proxyRes.statusCode,
            success: jsonData.resultType === 'SUCCESS',
          });
          res.status(proxyRes.statusCode || 200).json(jsonData);
        } catch (parseError) {
          console.error('[프록시] JSON 파싱 오류:', parseError);
          res.status(proxyRes.statusCode || 200).json({
            error: 'Failed to parse response',
            rawResponse: data,
          });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('[프록시] 토스 API 호출 실패:', error);
      res.status(500).json({ 
        error: 'Proxy request failed',
        message: error.message 
      });
    });

    proxyReq.end();
  } catch (error) {
    console.error('[프록시] 예외 발생:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

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

    // 토스 API는 mTLS 인증서만 사용 (Basic Auth 불필요)
    // 참고: 토스 커뮤니티에 따르면 client_id/client_secret은 따로 없음
    const options = {
      hostname: 'apps-in-toss-api.toss.im',
      port: 443,
      path: '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      method: 'POST',
      ...tlsOptions, // mTLS 인증서만 사용
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

