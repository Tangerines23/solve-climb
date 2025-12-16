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

// mTLS 인증서 로드 함수 (lazy loading)
function getTlsOptions() {
  try {
    const certContent = process.env.TOSS_MTLS_CERT;
    const keyContent = process.env.TOSS_MTLS_KEY;

    // 환경 변수 확인
    if (certContent && keyContent) {
      // 값이 비어있지 않은지 확인
      const trimmedCert = certContent.trim();
      const trimmedKey = keyContent.trim();
      
      if (trimmedCert && trimmedKey && 
          trimmedCert.includes('BEGIN CERTIFICATE') && 
          trimmedKey.includes('BEGIN')) {
        console.log('📦 환경 변수에서 mTLS 인증서 로드');
        console.log(`인증서 길이: ${trimmedCert.length}, 키 길이: ${trimmedKey.length}`);
        return {
          cert: trimmedCert,
          key: trimmedKey,
          rejectUnauthorized: true,
        };
      } else {
        console.warn('⚠️ 환경 변수에 인증서가 있지만 형식이 올바르지 않습니다.');
        console.log(`인증서 시작: ${trimmedCert.substring(0, 50)}...`);
        console.log(`키 시작: ${trimmedKey.substring(0, 50)}...`);
      }
    } else {
      console.log('⚠️ 환경 변수에서 인증서를 찾을 수 없습니다.');
      console.log(`TOSS_MTLS_CERT 존재: ${!!certContent}`);
      console.log(`TOSS_MTLS_KEY 존재: ${!!keyContent}`);
    }

    // 파일 시스템에서 로드 시도 (로컬 개발용)
    console.log('📁 파일 시스템에서 mTLS 인증서 로드 시도...');
    const possiblePaths = [
      path.join(__dirname, '..', 'cert', 'solve-climb-mtls_public.crt'),
      path.join(process.cwd(), 'cert', 'solve-climb-mtls_public.crt'),
      path.join('/var/task', 'cert', 'solve-climb-mtls_public.crt'),
    ];
    
    for (const testCertPath of possiblePaths) {
      const testKeyPath = testCertPath.replace('_public.crt', '_private.key');
      if (fs.existsSync(testCertPath) && fs.existsSync(testKeyPath)) {
        console.log(`✅ 파일 시스템에서 인증서 발견: ${testCertPath}`);
        return {
          cert: fs.readFileSync(testCertPath),
          key: fs.readFileSync(testKeyPath),
          rejectUnauthorized: true,
        };
      }
    }

    // 인증서를 찾을 수 없음
    const errorMsg = 'mTLS 인증서를 찾을 수 없습니다. Environment Variables를 확인하세요.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('❌ 인증서 로드 중 오류:', error.message);
    throw error;
  }
}

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

    // mTLS 인증서 로드 (lazy loading)
    const tlsOptions = getTlsOptions();

    // Basic Auth 헤더 가져오기
    const basicAuth = process.env.TOSS_API_BASIC_AUTH;
    if (!basicAuth) {
      console.error('[프록시] TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다.');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다.',
        hint: 'Vercel Environment Variables에서 TOSS_API_BASIC_AUTH를 설정하세요.',
      });
    }

    // Basic Auth 값 검증 및 처리
    let authHeader = basicAuth.trim();
    if (!authHeader.startsWith('Basic ')) {
      authHeader = `Basic ${authHeader}`;
    }

    const options = {
      hostname: 'apps-in-toss-api.toss.im',
      port: 443,
      path: '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      method: 'POST',
      ...tlsOptions, // mTLS 인증서 사용
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Basic Auth 헤더 추가
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

// 루트 경로 핸들러
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'toss-oauth-proxy',
    message: 'Toss OAuth Proxy Server',
    endpoints: {
      health: '/health',
      generateToken: '/api/toss-oauth/generate-token',
    },
    env: {
      hasCert: !!process.env.TOSS_MTLS_CERT,
      hasKey: !!process.env.TOSS_MTLS_KEY,
      hasBasicAuth: !!process.env.TOSS_API_BASIC_AUTH,
      certLength: process.env.TOSS_MTLS_CERT?.length || 0,
      keyLength: process.env.TOSS_MTLS_KEY?.length || 0,
      basicAuthLength: process.env.TOSS_API_BASIC_AUTH?.length || 0,
    },
    timestamp: new Date().toISOString(),
  });
});

// Vercel serverless function으로 export
// Vercel은 Express 앱을 자동으로 감지하고 serverless function으로 변환합니다
module.exports = app;

