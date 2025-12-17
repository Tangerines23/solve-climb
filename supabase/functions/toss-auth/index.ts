// 토스 사용자 정보로 Supabase 사용자 생성/업데이트 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

/**
 * AES-256-GCM 복호화 함수 (Web Crypto API 사용)
 * @param encryptedBase64 - 암호문 (Base64 인코딩, IV + 암호문 + 태그)
 * @param base64EncodedKey - AES 키 (Base64)
 * @param aad - AAD 문자열
 * @returns 복호화된 평문
 */
async function decryptUserData(
  encryptedBase64: string,
  base64EncodedKey: string,
  aad: string
): Promise<string> {
  try {
    const IV_LENGTH = 12;
    const TAG_LENGTH = 16;

    // Base64 디코딩
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const keyBytes = Uint8Array.from(atob(base64EncodedKey), c => c.charCodeAt(0));
    const aadBytes = new TextEncoder().encode(aad);

    // IV, 암호문, 태그 분리
    const iv = encryptedBytes.slice(0, IV_LENGTH);
    const ciphertextWithTag = encryptedBytes.slice(IV_LENGTH);
    const ciphertext = ciphertextWithTag.slice(0, ciphertextWithTag.length - TAG_LENGTH);
    const tag = ciphertextWithTag.slice(ciphertextWithTag.length - TAG_LENGTH);

    // 암호문 + 태그 결합 (Web Crypto API는 태그가 암호문 끝에 붙어있어야 함)
    const ciphertextWithTagCombined = new Uint8Array(ciphertext.length + tag.length);
    ciphertextWithTagCombined.set(ciphertext);
    ciphertextWithTagCombined.set(tag, ciphertext.length);

    // CryptoKey 생성
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 복호화
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: aadBytes,
      },
      cryptoKey,
      ciphertextWithTagCombined
    );

    // UTF-8 디코딩
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('[복호화] 실패:', {
      error: error instanceof Error ? error.message : String(error),
      encryptedPrefix: encryptedBase64.substring(0, 20) + '...',
    });
    // 복호화 실패 시 원본 반환 (암호화되지 않은 데이터일 수 있음)
    return encryptedBase64;
  }
}

/**
 * 사용자 정보 객체 복호화
 * @param userInfo - 토스 API에서 받은 사용자 정보
 * @param decryptionKey - 복호화 키 (Base64)
 * @param aad - AAD 문자열
 * @returns 복호화된 사용자 정보
 */
async function decryptUserInfo(
  userInfo: any,
  decryptionKey: string,
  aad: string
): Promise<any> {
  const fields = ['ci', 'name', 'phone', 'gender', 'nationality', 'birthday', 'email'];
  const decrypted: any = {};

  for (const field of fields) {
    const value = userInfo[field];
    if (typeof value === 'string' && value.length > 0) {
      // 암호화된 데이터인지 확인 (Base64 형식이고 길이가 50자 이상)
      const isEncrypted = value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value);
      if (isEncrypted) {
        try {
          decrypted[field] = await decryptUserData(value, decryptionKey, aad);
          console.log(`[복호화] ${field}: 성공 (${value.substring(0, 20)}... → ${decrypted[field]})`);
        } catch (error) {
          console.error(`[복호화] ${field}: 실패`, error);
          decrypted[field] = value; // 복호화 실패 시 원본 사용
        }
      } else {
        decrypted[field] = value; // 암호화되지 않은 데이터
      }
    } else {
      decrypted[field] = value;
    }
  }

  return {
    ...userInfo,
    ...decrypted,
  };
}

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
      console.error('[토스 Auth] Supabase 환경 변수가 설정되지 않았습니다.', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!Deno.env.get('SERVICE_ROLE_KEY'),
        hasSupabaseServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        supabaseUrlLength: supabaseUrl.length,
        serviceKeyLength: supabaseServiceKey.length,
      });
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Supabase 환경 변수가 설정되지 않았습니다.',
          details: {
            hasSupabaseUrl: !!supabaseUrl,
            hasServiceRoleKey: !!Deno.env.get('SERVICE_ROLE_KEY'),
            hasSupabaseServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[토스 Auth] Supabase Admin 클라이언트 생성:', {
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      serviceKeyLength: supabaseServiceKey.length,
      serviceKeyPrefix: supabaseServiceKey.substring(0, 20) + '...',
      hasServiceRoleKey: !!Deno.env.get('SERVICE_ROLE_KEY'),
      hasSupabaseServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    });

    // Supabase Admin API를 사용하기 위해 Service Role Key를 명시적으로 헤더에 추가
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      },
    });

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
    let proxyServerUrl = Deno.env.get('PROXY_SERVER_URL');
    
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

    // URL 정규화: 끝에 슬래시 제거
    proxyServerUrl = proxyServerUrl.replace(/\/+$/, '');

    const authHeader = `Bearer ${accessToken}`;
    // 프록시 서버를 통해 토스 API 호출
    const proxyEndpoint = `${proxyServerUrl}/api/toss-auth/user-info`;
    
    console.log('[토스 Auth] 프록시 서버를 통해 토스 API 호출:', {
      proxyServerUrl: proxyServerUrl,
      proxyEndpoint: proxyEndpoint,
      targetUrl: `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader.length,
      authHeaderPrefix: authHeader.substring(0, 30) + '...',
    });
    
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
      let rawResponseText = '';
      try {
        rawResponseText = await userInfoResponse.text();
        errorData = JSON.parse(rawResponseText);
      } catch {
        errorData = { 
          message: rawResponseText || `HTTP ${userInfoResponse.status}`,
          rawResponse: rawResponseText.substring(0, 500),
        };
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
        rawResponse: rawResponseText.substring(0, 500),
        isMissingAuthHeader: isMissingAuthHeader,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        accessTokenPrefix: accessToken?.substring(0, 20) || '',
        proxyUrl: proxyEndpoint,
        proxyServerUrl: proxyServerUrl,
      });

      // 404 에러인 경우 프록시 서버 엔드포인트가 배포되지 않았을 수 있음
      if (userInfoResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Proxy endpoint not found',
            message: `프록시 서버 엔드포인트를 찾을 수 없습니다 (404). 프록시 서버에 /api/toss-auth/user-info 엔드포인트가 배포되었는지 확인하세요.`,
            details: {
              status: userInfoResponse.status,
              proxyUrl: proxyEndpoint,
              proxyServerUrl: proxyServerUrl,
              errorData: errorData,
              rawResponse: rawResponseText.substring(0, 500),
              hint: 'Vercel에 프록시 서버를 배포했는지 확인하세요. proxy-server/api/index.js에 엔드포인트가 추가되어 있어야 합니다.',
              solution: '1. Vercel Dashboard에서 solve-climb-proxy 프로젝트 확인\n2. 최신 배포 상태 확인\n3. 배포 완료 후 재시도',
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // 500 에러인 경우 프록시 서버 내부 오류일 수 있음
      if (userInfoResponse.status === 500) {
        return new Response(
          JSON.stringify({ 
            error: 'Proxy server error',
            message: `프록시 서버에서 내부 오류가 발생했습니다 (500). 프록시 서버 로그를 확인하세요.`,
            details: {
              status: userInfoResponse.status,
              proxyUrl: proxyEndpoint,
              proxyServerUrl: proxyServerUrl,
              errorData: errorData,
              rawResponse: rawResponseText.substring(0, 500),
              hint: 'Vercel Dashboard의 Function Logs를 확인하세요. mTLS 인증서 로드 실패일 수 있습니다.',
              solution: '1. Vercel Dashboard > solve-climb-proxy > Functions > Logs 확인\n2. TOSS_MTLS_CERT와 TOSS_MTLS_KEY 환경 변수 확인\n3. 인증서 형식 확인 (-----BEGIN CERTIFICATE----- 포함)',
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

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
          details: {
            ...errorData,
            proxyUrl: proxyEndpoint,
          }
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

    let tossUserInfo = userInfoData.success;
    const tossUserKey = tossUserInfo.userKey;

    // 암호화 여부 확인 로깅
    const isEncrypted = {
      ci: tossUserInfo.ci && typeof tossUserInfo.ci === 'string' && tossUserInfo.ci.length > 50,
      name: tossUserInfo.name && typeof tossUserInfo.name === 'string' && tossUserInfo.name.length > 50,
      phone: tossUserInfo.phone && typeof tossUserInfo.phone === 'string' && tossUserInfo.phone.length > 50,
    };
    
    console.log(`[토스 Auth] 사용자 정보 조회 성공: userKey=${tossUserKey}`, {
      isEncrypted,
      note: '필드가 50자 이상이면 암호화된 것으로 추정됩니다. 복호화를 시도합니다.',
    });

    // 복호화 키 가져오기
    const decryptionKey = Deno.env.get('TOSS_DECRYPTION_KEY');
    const aadString = Deno.env.get('TOSS_AAD_STRING');

    if (decryptionKey && aadString) {
      console.log('[토스 Auth] 복호화 키 발견, 사용자 정보 복호화 시작...');
      try {
        tossUserInfo = await decryptUserInfo(tossUserInfo, decryptionKey, aadString);
        console.log('[토스 Auth] 사용자 정보 복호화 완료:', {
          userKey: tossUserKey,
          hasName: !!tossUserInfo.name,
          nameLength: tossUserInfo.name?.length || 0,
          namePreview: tossUserInfo.name ? tossUserInfo.name.substring(0, 10) : 'N/A',
        });
      } catch (error) {
        console.error('[토스 Auth] 복호화 실패:', {
          error: error instanceof Error ? error.message : String(error),
          note: '복호화 실패 시 암호화된 데이터를 그대로 사용합니다.',
        });
      }
    } else {
      console.warn('[토스 Auth] 복호화 키가 설정되지 않았습니다. 암호화된 데이터를 그대로 사용합니다.', {
        hasDecryptionKey: !!decryptionKey,
        hasAadString: !!aadString,
        hint: 'Supabase Secrets에 TOSS_DECRYPTION_KEY와 TOSS_AAD_STRING을 설정하세요.',
      });
    }

    // 2. 기존 사용자 찾기 (user_metadata의 tossUserKey로)
    // Supabase Admin API로 모든 사용자를 검색할 수 없으므로,
    // RPC 함수를 사용하거나 직접 생성하는 방식을 사용합니다.
    
    // 토스 userKey를 기반으로 고유한 이메일 생성 (Supabase는 이메일이 필요)
    // 실제 이메일이 없으므로 가상의 이메일을 생성
    // 고정된 패스워드 사용 (Date.now() 제거 - 로그인 시 일관성 유지)
    const virtualPassword = `toss_${tossUserKey}_secret_key`;

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
      console.log('[토스 Auth] 기존 사용자 찾기 시작...');
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('[토스 Auth] 사용자 목록 조회 실패:', {
          error: listError.message,
          status: listError.status,
          name: listError.name,
        });
        throw listError;
      }
      
      if (users) {
        console.log(`[토스 Auth] 전체 사용자 수: ${users.length}`);
        // user_metadata의 tossUserKey로 사용자 찾기
        existingUser = users.find(u => 
          u.user_metadata?.tossUserKey === tossUserKey
        ) || null;
        
        if (existingUser) {
          console.log(`[토스 Auth] 기존 사용자 발견: ${existingUser.id}`);
        } else {
          console.log('[토스 Auth] 기존 사용자를 찾을 수 없음, 새 사용자 생성 필요');
        }
      }
    } catch (error) {
      console.error('[토스 Auth] 기존 사용자 찾기 실패:', {
        error: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // 에러가 발생해도 계속 진행 (새 사용자 생성)
    }

    let user;
    let session;

    if (existingUser) {
      // 4-1. 기존 사용자 업데이트
      console.log(`[토스 Auth] 기존 사용자 업데이트: ${existingUser.id}`);
      
      console.log('[토스 Auth] 사용자 업데이트 시작:', {
        userId: existingUser.id,
        email: existingUser.email,
      });
      
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
        console.error('[토스 Auth] 사용자 업데이트 실패:', {
          error: updateError.message,
          status: updateError.status,
          name: updateError.name,
          userId: existingUser.id,
        });
        throw updateError;
      }
      
      console.log('[토스 Auth] 사용자 업데이트 성공:', {
        userId: updatedUser?.id,
        email: updatedUser?.email,
      });

      user = updatedUser;

      // 세션 생성 (JWT 토큰 생성)
      // Supabase Admin API로 직접 세션을 생성할 수 없으므로,
      // 클라이언트에서 처리하도록 합니다.
    } else {
      // 4-2. 새 사용자 생성
      console.log(`[토스 Auth] 새 사용자 생성: userKey=${tossUserKey}`);
      
      console.log('[토스 Auth] 새 사용자 생성 시작:', {
        email: virtualEmail,
        userKey: tossUserKey,
      });
      
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: virtualEmail,
        password: virtualPassword,
        email_confirm: true, // 이메일 확인 없이 바로 활성화
        user_metadata: userMetadata,
      });

      if (createError) {
        console.error('[토스 Auth] 사용자 생성 실패:', {
          error: createError.message,
          status: createError.status,
          name: createError.name,
          email: virtualEmail,
        });
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

