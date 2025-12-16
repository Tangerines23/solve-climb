// 토스 사용자 정보로 Supabase 사용자 생성/업데이트 Edge Function
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
    const { accessToken } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'accessToken is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // 환경 변수 이름 변경 대응: SERVICE_ROLE_KEY 우선, 없으면 기존 이름도 검사
    const supabaseServiceKey =
      Deno.env.get('SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 토스 API로 사용자 정보 조회
    // Authorization 헤더 검증
    if (!accessToken || accessToken.trim() === '') {
      console.error('[토스 Auth] accessToken이 비어있습니다.');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid access token',
          message: 'accessToken이 비어있거나 유효하지 않습니다.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 프록시 서버 URL 가져오기
    const proxyServerUrl = Deno.env.get('PROXY_SERVER_URL');
    
    if (!proxyServerUrl) {
      console.error('[토스 Auth] PROXY_SERVER_URL 환경 변수가 설정되지 않았습니다.');
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

    const authHeader = `Bearer ${accessToken}`;
    console.log('[토스 Auth] 프록시 서버를 통해 토스 API 호출:', {
      proxyServerUrl: proxyServerUrl,
      targetUrl: `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/info`,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader.length,
      authHeaderPrefix: authHeader.substring(0, 30) + '...',
    });

    // 프록시 서버를 통해 토스 API 호출
    const proxyEndpoint = `${proxyServerUrl}/api/toss-auth/user-info`;
    
    let userInfoResponse: Response;
    try {
      userInfoResponse = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
        }),
      });
    } catch (fetchError) {
      console.error('[토스 Auth] 프록시 서버 호출 실패:', {
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

    if (!userInfoResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await userInfoResponse.json();
      } catch {
        const text = await userInfoResponse.text().catch(() => '');
        errorData = { message: text || `HTTP ${userInfoResponse.status}` };
      }

      const errorMessage = errorData?.error || errorData?.message || JSON.stringify(errorData);
      const errorMessageStr = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      const isMissingAuthHeader = errorMessageStr.toLowerCase().includes('missing authorization') || 
                                 errorMessageStr.toLowerCase().includes('authorization header');

      console.error('[토스 Auth] 사용자 정보 조회 실패:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        errorData: errorData,
        errorMessage: errorMessageStr,
        isMissingAuthHeader: isMissingAuthHeader,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        proxyUrl: proxyEndpoint,
      });

      // "missing authorization header" 오류인 경우 특별 처리
      if (isMissingAuthHeader || userInfoResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed',
            message: '토스 API 인증에 실패했습니다. accessToken이 유효하지 않거나 만료되었을 수 있습니다.',
            details: {
              status: userInfoResponse.status,
              statusText: userInfoResponse.statusText,
              tossApiError: errorData,
              errorMessage: errorMessageStr,
              hint: 'accessToken이 올바르게 전달되었는지 확인하세요.',
            }
          }),
          { 
            status: userInfoResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get user info',
          message: `토스 API 요청 실패 (${userInfoResponse.status})`,
          details: errorData 
        }),
        { 
          status: userInfoResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userInfoData = await userInfoResponse.json();

    // API 응답 상세 로깅 (암호화 여부 확인용)
    console.log('[토스 Auth] API 응답 데이터:', {
      resultType: userInfoData.resultType,
      hasSuccess: !!userInfoData.success,
      successKeys: userInfoData.success ? Object.keys(userInfoData.success) : [],
      sampleData: userInfoData.success ? {
        userKey: userInfoData.success.userKey,
        ci: userInfoData.success.ci ? (typeof userInfoData.success.ci === 'string' ? userInfoData.success.ci.substring(0, 20) + '...' : userInfoData.success.ci) : null,
        name: userInfoData.success.name ? (typeof userInfoData.success.name === 'string' ? userInfoData.success.name.substring(0, 20) + '...' : userInfoData.success.name) : null,
        phone: userInfoData.success.phone ? (typeof userInfoData.success.phone === 'string' ? userInfoData.success.phone.substring(0, 20) + '...' : userInfoData.success.phone) : null,
      } : null,
    });

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

    const tossUserInfo = userInfoData.success;
    const tossUserKey = tossUserInfo.userKey;

    // 암호화 여부 확인 로깅
    const isEncrypted = {
      ci: tossUserInfo.ci && typeof tossUserInfo.ci === 'string' && tossUserInfo.ci.length > 50,
      name: tossUserInfo.name && typeof tossUserInfo.name === 'string' && tossUserInfo.name.length > 50,
      phone: tossUserInfo.phone && typeof tossUserInfo.phone === 'string' && tossUserInfo.phone.length > 50,
    };
    
    console.log(`[토스 Auth] 사용자 정보 조회 성공: userKey=${tossUserKey}`, {
      isEncrypted,
      note: '필드가 50자 이상이면 암호화된 것으로 추정됩니다. 복호화가 필요할 수 있습니다.',
    });

    // 2. 기존 사용자 찾기 (user_metadata의 tossUserKey로)
    // Supabase Admin API로 모든 사용자를 검색할 수 없으므로,
    // RPC 함수를 사용하거나 직접 생성하는 방식을 사용합니다.
    
    // 토스 userKey를 기반으로 고유한 이메일 생성 (Supabase는 이메일이 필요)
    // 실제 이메일이 없으므로 가상의 이메일을 생성
    const virtualPassword = `toss_${tossUserKey}_${Date.now()}`;

    // user_metadata 준비
    const userMetadata = {
      tossUserKey: tossUserKey,
      tossCi: tossUserInfo.ci || null,
      tossName: tossUserInfo.name || null,
      tossPhone: tossUserInfo.phone || null,
      tossBirthday: tossUserInfo.birthday || null,
      tossGender: tossUserInfo.gender || null,
      tossNationality: tossUserInfo.nationality || null,
      loginType: 'toss',
    };

    // 3. 기존 사용자 찾기 시도
    // 토스 userKey를 기반으로 가상 이메일 생성 (일관성 유지)
    const virtualEmail = `toss_${tossUserKey}@toss.local`;
    
    let existingUser = null;
    try {
      // 가상 이메일로 사용자 찾기 시도
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!listError && users) {
        // user_metadata의 tossUserKey로 사용자 찾기
        existingUser = users.find(u => 
          u.user_metadata?.tossUserKey === tossUserKey
        ) || null;
      }
    } catch (error) {
      console.warn('[토스 Auth] 기존 사용자 찾기 실패:', error);
    }

    let user;
    let session;

    if (existingUser) {
      // 4-1. 기존 사용자 업데이트
      console.log(`[토스 Auth] 기존 사용자 업데이트: ${existingUser.id}`);
      
      const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            ...userMetadata,
          },
        }
      );

      if (updateError) {
        throw updateError;
      }

      user = updatedUser;

      // 세션 생성 (JWT 토큰 생성)
      // Supabase Admin API로 직접 세션을 생성할 수 없으므로,
      // 클라이언트에서 처리하도록 합니다.
    } else {
      // 4-2. 새 사용자 생성
      console.log(`[토스 Auth] 새 사용자 생성: userKey=${tossUserKey}`);
      
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: virtualEmail,
        password: virtualPassword,
        email_confirm: true, // 이메일 확인 없이 바로 활성화
        user_metadata: userMetadata,
      });

      if (createError) {
        // 이미 존재하는 사용자일 수 있음 (이메일 중복)
        if (createError.message?.includes('already registered')) {
          // 기존 사용자로 처리
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          existingUser = users?.find(u => u.email === virtualEmail) || null;
          if (existingUser) {
            // 기존 사용자 업데이트
            const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              {
                user_metadata: {
                  ...existingUser.user_metadata,
                  ...userMetadata,
                },
              }
            );
            if (updateError) throw updateError;
            user = updatedUser;
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else {
        user = newUser;
      }
    }

    // 5. 사용자 정보 및 로그인 정보 반환
    // 클라이언트에서 signInWithPassword를 사용할 수 있도록 비밀번호 반환
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
        loginInfo: {
          email: virtualEmail,
          password: virtualPassword,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[토스 Auth] 예외 발생:', error);
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

