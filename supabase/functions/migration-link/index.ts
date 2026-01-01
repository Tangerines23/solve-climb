// 마이그레이션 링크 생성 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { hash, authorizationCode, referrer } = await req.json();

    if (!hash || typeof hash !== 'string' || hash.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'hash is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authorizationCode || typeof authorizationCode !== 'string' || authorizationCode.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'authorizationCode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey =
      Deno.env.get('SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[마이그레이션 링크] Supabase 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 토스 OAuth로 AccessToken 받기
    // Basic Auth 헤더 가져오기
    let basicAuth = Deno.env.get('TOSS_API_BASIC_AUTH');
    if (!basicAuth || basicAuth.trim() === '') {
      console.error('[마이그레이션 링크] TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'TOSS_API_BASIC_AUTH 환경 변수가 설정되지 않았습니다.',
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 환경 변수에 "Basic " 접두사가 이미 포함되어 있다면 제거
    basicAuth = basicAuth.trim();
    if (basicAuth.startsWith('Basic ')) {
      basicAuth = basicAuth.substring(6);
    }

    const authHeader = `Basic ${basicAuth}`;

    // 토스 API로 AccessToken 요청
    const tokenResponse = await fetch(
      `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          authorizationCode,
          referrer: referrer || 'DEFAULT',
        }),
      }
    );

    if (!tokenResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await tokenResponse.json();
      } catch {
        const text = await tokenResponse.text().catch(() => '');
        errorData = { message: text || `HTTP ${tokenResponse.status}` };
      }

      console.error('[마이그레이션 링크] 토스 AccessToken 요청 실패:', {
        status: tokenResponse.status,
        errorData,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get access token',
          message: `토스 API 요청 실패 (${tokenResponse.status})`,
          details: errorData,
        }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.resultType !== 'SUCCESS' || !tokenData.success?.accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Failed to get access token',
          details: tokenData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accessToken = tokenData.success.accessToken;

    // 2. 토스 API로 사용자 정보 조회 (userKey 얻기)
    const userInfoResponse = await fetch(
      `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/info`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userInfoResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await userInfoResponse.json();
      } catch {
        const text = await userInfoResponse.text().catch(() => '');
        errorData = { message: text || `HTTP ${userInfoResponse.status}` };
      }

      console.error('[마이그레이션 링크] 토스 사용자 정보 조회 실패:', {
        status: userInfoResponse.status,
        errorData,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get user info',
          message: `토스 API 요청 실패 (${userInfoResponse.status})`,
          details: errorData,
        }),
        { 
          status: userInfoResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userInfoData = await userInfoResponse.json();

    if (userInfoData.resultType !== 'SUCCESS' || !userInfoData.success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to get user info',
          details: userInfoData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tossUserKey = userInfoData.success.userKey;

    console.log(`[마이그레이션 링크] 사용자 정보 조회 성공: userKey=${tossUserKey}, hash=${hash.substring(0, 10)}...`);

    // 3. user_migrations 테이블에 매핑 저장
    try {
      const { error } = await supabaseAdmin
        .from('user_migrations')
        .upsert({
          hash: hash,
          toss_user_key: tossUserKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'hash',
        })
        .select()
        .single();

      if (error) {
        // 테이블이 없는 경우도 처리
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.error('[마이그레이션 링크] user_migrations 테이블이 없습니다. 데이터베이스 마이그레이션을 실행해주세요.');
          return new Response(
            JSON.stringify({
              error: 'Database table not found',
              message: 'user_migrations 테이블이 없습니다. 데이터베이스 마이그레이션을 실행해주세요.',
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      console.log(`[마이그레이션 링크] 매핑 저장 성공: hash=${hash.substring(0, 10)}..., userKey=${tossUserKey}`);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (dbError) {
      console.error('[마이그레이션 링크] 데이터베이스 저장 오류:', dbError);
      
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: dbError instanceof Error ? dbError.message : String(dbError),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[마이그레이션 링크] 예외 발생:', error);
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
