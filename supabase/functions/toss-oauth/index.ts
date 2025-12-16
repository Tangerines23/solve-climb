// 토스 OAuth AccessToken 받기 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // POST 요청만 허용
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 요청 본문 파싱
    const { authorizationCode, referrer } = await req.json();

    if (!authorizationCode) {
      return new Response(
        JSON.stringify({ error: 'authorizationCode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 프록시 서버 URL 가져오기
    const proxyServerUrl = Deno.env.get('PROXY_SERVER_URL');
    
    if (!proxyServerUrl) {
      console.error('[토스 OAuth] PROXY_SERVER_URL 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          message: 'PROXY_SERVER_URL 환경 변수가 설정되지 않았습니다. Supabase Secrets에서 설정해주세요.',
          hint: 'supabase secrets set PROXY_SERVER_URL=https://your-proxy-server.com'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 프록시 서버를 통해 토스 API 호출
    const proxyEndpoint = `${proxyServerUrl}/api/toss-oauth/generate-token`;
    console.log('[토스 OAuth] 프록시 서버를 통해 토스 API 호출:', {
      proxyUrl: proxyEndpoint,
      proxyServerUrl: proxyServerUrl,
      authorizationCode: authorizationCode?.substring(0, 20) + '...',
      referrer: referrer || 'DEFAULT',
    });

    let response: Response;
    try {
      response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorizationCode,
          referrer: referrer || 'DEFAULT',
        }),
      });
    } catch (fetchError) {
      console.error('[토스 OAuth] 프록시 서버 호출 실패:', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        proxyUrl: proxyEndpoint,
        proxyServerUrl: proxyServerUrl,
      });
      return new Response(
        JSON.stringify({
          error: 'Proxy server request failed',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          proxyUrl: proxyEndpoint,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // 응답 받은 후 즉시 로깅
    console.log('[토스 OAuth] 응답 받음:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      const text = await response.text().catch(() => '');
      data = { 
        error: 'Failed to parse response',
        rawResponse: text || `HTTP ${response.status} ${response.statusText}`
      };
    }

    if (!response.ok) {
      // 401 에러인 경우 상세 로깅 및 안내
      if (response.status === 401) {
        const errorMessage = data?.error || data?.message || JSON.stringify(data);
        const isMissingAuthHeader = errorMessage.toLowerCase().includes('missing authorization') || 
                                   errorMessage.toLowerCase().includes('authorization header');
        
        // 응답 헤더도 확인
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        console.error('[토스 OAuth] 401 인증 실패 상세 정보:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: data,
          responseHeaders: responseHeaders,
          errorMessage: errorMessage,
          isMissingAuthHeader: isMissingAuthHeader,
          proxyUrl: `${proxyServerUrl}/api/toss-oauth/generate-token`,
        });

        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed',
            message: '프록시 서버를 통한 토스 API 인증에 실패했습니다.',
            details: {
              status: response.status,
              statusText: response.statusText,
              proxyError: data,
              proxyUrl: `${proxyServerUrl}/api/toss-oauth/generate-token`,
              hint: '프록시 서버의 mTLS 인증서가 올바르게 설정되어 있는지 확인하세요.',
              checkProxyServer: 'Vercel Environment Variables에서 TOSS_MTLS_CERT와 TOSS_MTLS_KEY를 확인하세요.',
            }
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // 기타 HTTP 에러
      console.error('[토스 OAuth] AccessToken 요청 실패:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: data,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get access token',
          message: `토스 API 요청 실패 (${response.status})`,
          details: data 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 성공 응답
    if (data.resultType === 'SUCCESS' && data.success) {
      return new Response(
        JSON.stringify({
          success: true,
          accessToken: data.success.accessToken,
          refreshToken: data.success.refreshToken,
          tokenType: data.success.tokenType,
          expiresIn: data.success.expiresIn,
          scope: data.success.scope,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // 실패 응답
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || 'Unknown error',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[토스 OAuth] 예외 발생:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


