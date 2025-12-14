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

    // Basic Auth 헤더 가져오기
    const basicAuth = Deno.env.get('TOSS_API_BASIC_AUTH');
    if (!basicAuth) {
      console.error('TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 토스 API로 AccessToken 요청
    const response = await fetch(
      `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          authorizationCode,
          referrer: referrer || 'DEFAULT',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[토스 OAuth] AccessToken 요청 실패:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get access token',
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


