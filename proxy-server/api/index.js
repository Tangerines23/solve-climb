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

    // mTLS 인증서 로드 (lazy loading)
    let tlsOptions;
    try {
      tlsOptions = getTlsOptions();
      console.log('[프록시] mTLS 인증서 로드 성공');
    } catch (tlsError) {
      console.error('[프록시] mTLS 인증서 로드 실패:', {
        error: tlsError.message,
        stack: tlsError.stack,
        hasCertEnv: !!process.env.TOSS_MTLS_CERT,
        hasKeyEnv: !!process.env.TOSS_MTLS_KEY,
      });
      return res.status(500).json({ 
        error: 'mTLS certificate loading failed',
        message: tlsError.message,
        hint: 'Vercel Environment Variables에 TOSS_MTLS_CERT와 TOSS_MTLS_KEY를 설정하세요.',
      });
    }

    // 토스 API는 mTLS 인증서만 사용
    // 참고: 토스 API 예제 코드에서 사용자 정보 조회 엔드포인트는 /api-partner/v1/apps-in-toss/user/oauth2/login-me
    const options = {
      hostname: 'apps-in-toss-api.toss.im',
      port: 443,
      path: '/api-partner/v1/apps-in-toss/user/oauth2/login-me',
      method: 'GET',
      headers: {
        'Authorization': accessToken, // Bearer 없이 accessToken만 전달 (토스 API 예제 참고)
        'Content-Type': 'application/json; charset=utf-8', // 토스 API 예제와 동일한 형식
      },
      ...tlsOptions,
    };

    console.log('[프록시] 토스 API 호출 옵션:', {
      hostname: options.hostname,
      path: options.path,
      method: options.method,
      hasCert: !!options.cert,
      hasKey: !!options.key,
      authHeaderPrefix: options.headers.Authorization.substring(0, 30) + '...',
    });

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
            statusText: proxyRes.statusText,
            resultType: jsonData.resultType,
            success: jsonData.resultType === 'SUCCESS',
            hasError: !!jsonData.error,
            errorMessage: jsonData.error || null,
            responseLength: data.length,
          });
          
          // 에러 응답인 경우 더 자세한 로깅
          if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
            console.error('[프록시] 토스 API 에러 응답:', {
              status: proxyRes.statusCode,
              statusText: proxyRes.statusText,
              response: jsonData,
              rawResponse: data.substring(0, 500), // 처음 500자만
            });
          }
          
          res.status(proxyRes.statusCode || 200).json(jsonData);
        } catch (parseError) {
          console.error('[프록시] JSON 파싱 오류:', {
            error: parseError.message,
            rawResponse: data.substring(0, 500),
            responseLength: data.length,
          });
          res.status(proxyRes.statusCode || 200).json({
            error: 'Failed to parse response',
            message: parseError.message,
            rawResponse: data.substring(0, 500),
          });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('[프록시] 토스 API 호출 실패:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        hostname: options.hostname,
        path: options.path,
      });
      res.status(500).json({ 
        error: 'Proxy request failed',
        message: error.message,
        code: error.code,
      });
    });

    proxyReq.end();
  } catch (error) {
    console.error('[프록시] 예외 발생:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      name: error.name,
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

    // mTLS 인증서 로드 (lazy loading)
    let tlsOptions;
    try {
      tlsOptions = getTlsOptions();
      console.log('[프록시] mTLS 인증서 로드 성공 (OAuth)');
    } catch (tlsError) {
      console.error('[프록시] mTLS 인증서 로드 실패 (OAuth):', {
        error: tlsError.message,
        stack: tlsError.stack,
        hasCertEnv: !!process.env.TOSS_MTLS_CERT,
        hasKeyEnv: !!process.env.TOSS_MTLS_KEY,
      });
      return res.status(500).json({ 
        error: 'mTLS certificate loading failed',
        message: tlsError.message,
        hint: 'Vercel Environment Variables에 TOSS_MTLS_CERT와 TOSS_MTLS_KEY를 설정하세요.',
      });
    }

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

// 루트 경로 핸들러
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'toss-oauth-proxy',
    message: 'Toss OAuth Proxy Server',
    endpoints: {
      health: '/health',
      generateToken: '/api/toss-oauth/generate-token',
      userInfo: '/api/toss-auth/user-info',
    },
    env: {
      hasCert: !!process.env.TOSS_MTLS_CERT,
      hasKey: !!process.env.TOSS_MTLS_KEY,
      certLength: process.env.TOSS_MTLS_CERT?.length || 0,
      keyLength: process.env.TOSS_MTLS_KEY?.length || 0,
    },
    timestamp: new Date().toISOString(),
  });
});

// Vercel serverless function으로 export
// Vercel은 Express 앱을 자동으로 감지하고 serverless function으로 변환합니다
module.exports = app;

