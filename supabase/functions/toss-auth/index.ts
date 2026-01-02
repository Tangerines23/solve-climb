// 토스 사용자 정보로 Supabase 사용자 생성/업데이트 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

/**
 * AES-256-GCM 복호화 함수
 */
async function decryptUserData(
  encryptedBase64: string,
  base64EncodedKey: string,
  aad: string
): Promise<string> {
  try {
    const IV_LENGTH = 12;
    const TAG_LENGTH = 16;

    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const keyBytes = Uint8Array.from(atob(base64EncodedKey), c => c.charCodeAt(0));
    const aadBytes = new TextEncoder().encode(aad);

    const iv = encryptedBytes.slice(0, IV_LENGTH);
    const ciphertextWithTag = encryptedBytes.slice(IV_LENGTH);
    const ciphertext = ciphertextWithTag.slice(0, ciphertextWithTag.length - TAG_LENGTH);
    const tag = ciphertextWithTag.slice(ciphertextWithTag.length - TAG_LENGTH);

    const ciphertextWithTagCombined = new Uint8Array(ciphertext.length + tag.length);
    ciphertextWithTagCombined.set(ciphertext);
    ciphertextWithTagCombined.set(tag, ciphertext.length);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: aadBytes,
      },
      cryptoKey,
      ciphertextWithTagCombined
    );

    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('[복호화] 실패:', {
      error: error instanceof Error ? error.message : String(error),
      encryptedPrefix: encryptedBase64.substring(0, 20) + '...',
    });
    return encryptedBase64;
  }
}

/**
 * 사용자 정보 객체 복호화
 */
async function decryptUserInfo(
  userInfo: Record<string, unknown>,
  decryptionKey: string,
  aad: string
): Promise<Record<string, string>> {
  const fields = ['ci', 'name', 'phone', 'gender', 'nationality', 'birthday', 'email'];
  const decrypted: Record<string, string> = {};

  for (const field of fields) {
    const value = userInfo[field];
    if (typeof value === 'string' && value.length > 0) {
      const isEncrypted = value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value);
      if (isEncrypted) {
        try {
          decrypted[field] = await decryptUserData(value, decryptionKey, aad);
          console.log(`[복호화] ${field}: 성공 (${value.substring(0, 20)}... → ${decrypted[field]})`);
        } catch (error) {
          console.error(`[복호화] ${field}: 실패`, error);
          decrypted[field] = value;
        }
      } else {
        decrypted[field] = value;
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

/**
 * 사용자 업데이트 헬퍼 함수 (중복 제거)
 */
async function updateSupabaseUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  password: string,
  userMetadata: Record<string, unknown>
) {
  console.log('[토스 Auth] 사용자 업데이트 시작:', { userId, email });
  
  const { data: { user: updatedUser }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      password: password,
      user_metadata: userMetadata,
    }
  );

  if (updateError) {
    console.error('[토스 Auth] 사용자 업데이트 실패:', {
      error: updateError.message,
      userId,
    });
    throw updateError;
  }
  
  console.log('[토스 Auth] 사용자 업데이트 성공:', {
    userId: updatedUser?.id,
    email: updatedUser?.email,
  });

  return updatedUser;
}

/**
 * 이메일로 사용자 찾기 (RPC 함수 사용 - 최적화됨)
 */
async function findUserByEmail(supabaseAdmin: ReturnType<typeof createClient>, email: string) {
  try {
    console.log('[사용자 검색] RPC 함수 호출:', { email });
    const startTime = Date.now();
    
    // 🚀 RPC 함수 사용: DB에서 1명만 가져옴 (listUsers 대신)
    const { data, error } = await supabaseAdmin
      .rpc('find_user_by_email', { target_email: email });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('[사용자 검색] RPC 실패:', {
        error: error.message,
        duration: `${duration}ms`,
      });
      return null;
    }
    
    console.log('[사용자 검색] RPC 성공:', {
      found: !!data && data.length > 0,
      duration: `${duration}ms`,
    });
    
    // RPC 함수는 배열을 반환하므로 첫 번째 항목 추출
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('[사용자 검색] 예외 발생:', error);
    return null;
  }
}

/**
 * 에러 응답 생성 헬퍼
 */
function createErrorResponse(status: number, error: string, message: string, details?: unknown) {
  return new Response(
    JSON.stringify({ error, message, details }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // POST 요청만 허용
    if (req.method !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', 'POST 요청만 허용됩니다.');
    }

    // 요청 본문 파싱 및 검증
    const { accessToken } = await req.json();

    if (!accessToken || accessToken.trim() === '') {
      return createErrorResponse(400, 'Invalid access token', 'accessToken이 필요합니다.');
    }

    // Supabase 환경 변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey =
      Deno.env.get('SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[토스 Auth] Supabase 환경 변수 누락');
      return createErrorResponse(
        500,
        'Server configuration error',
        'Supabase 환경 변수가 설정되지 않았습니다.'
      );
    }

    console.log('[토스 Auth] Supabase Admin 클라이언트 생성:', {
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      serviceKeyLength: supabaseServiceKey.length,
    });

    // Supabase Admin 클라이언트 생성
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

    // 프록시 서버 URL 확인
    let proxyServerUrl = Deno.env.get('PROXY_SERVER_URL');
    
    if (!proxyServerUrl) {
      console.error('[토스 Auth] PROXY_SERVER_URL 환경 변수 누락');
      return createErrorResponse(
        500,
        'Server configuration error',
        'PROXY_SERVER_URL 환경 변수가 설정되지 않았습니다.'
      );
    }

    proxyServerUrl = proxyServerUrl.replace(/\/+$/, '');
    const proxyEndpoint = `${proxyServerUrl}/api/toss-auth/user-info`;
    
    console.log('[토스 Auth] 프록시 서버를 통해 토스 API 호출:', {
      proxyEndpoint,
      targetUrl: `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
    });
    
    // 프록시 서버를 통해 사용자 정보 조회
    let userInfoResponse: Response;
    try {
      userInfoResponse = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });
    } catch (fetchError) {
      console.error('[토스 Auth] 프록시 서버 호출 실패:', fetchError);
      return createErrorResponse(
        500,
        'Proxy server request failed',
        fetchError instanceof Error ? fetchError.message : String(fetchError)
      );
    }

    // 프록시 응답 에러 처리
    if (!userInfoResponse.ok) {
      let errorData: unknown = {};
      try {
        const rawText = await userInfoResponse.text();
        errorData = JSON.parse(rawText);
      } catch {
        errorData = { message: `HTTP ${userInfoResponse.status}` };
      }

      console.error('[토스 Auth] 사용자 정보 조회 실패:', {
        status: userInfoResponse.status,
        errorData,
      });

      // 상태 코드별 상세 에러 메시지
      const errorMessages: { [key: number]: { error: string; message: string } } = {
        404: {
          error: 'Proxy endpoint not found',
          message: '프록시 서버 엔드포인트를 찾을 수 없습니다. 배포 상태를 확인하세요.',
        },
        500: {
          error: 'Proxy server error',
          message: '프록시 서버에서 내부 오류가 발생했습니다. mTLS 인증서를 확인하세요.',
        },
        401: {
          error: 'Authentication failed',
          message: 'accessToken이 유효하지 않거나 만료되었습니다.',
        },
      };

      const errorMsg = errorMessages[userInfoResponse.status] || {
        error: 'Failed to get user info',
        message: `토스 API 요청 실패 (${userInfoResponse.status})`,
      };

      return createErrorResponse(
        userInfoResponse.status,
        errorMsg.error,
        errorMsg.message,
        errorData
      );
    }

    const userInfoData = await userInfoResponse.json();

    console.log('[토스 Auth] API 응답 데이터:', {
      resultType: userInfoData.resultType,
      hasSuccess: !!userInfoData.success,
    });

    if (userInfoData.resultType !== 'SUCCESS' || !userInfoData.success) {
      return createErrorResponse(
        400,
        'Failed to get user info',
        '토스 API에서 사용자 정보를 가져올 수 없습니다.',
        userInfoData
      );
    }

    let tossUserInfo = userInfoData.success;
    const tossUserKey = tossUserInfo.userKey;

    console.log(`[토스 Auth] 사용자 정보 조회 성공: userKey=${tossUserKey}`);

    // 복호화 처리
    const decryptionKey = Deno.env.get('TOSS_DECRYPTION_KEY');
    const aadString = Deno.env.get('TOSS_AAD_STRING');

    if (decryptionKey && aadString) {
      console.log('[토스 Auth] 복호화 시작...');
      try {
        tossUserInfo = await decryptUserInfo(tossUserInfo, decryptionKey, aadString);
        console.log('[토스 Auth] 복호화 완료:', {
          userKey: tossUserKey,
          namePreview: tossUserInfo.name?.substring(0, 10) || 'N/A',
        });
      } catch (error) {
        console.error('[토스 Auth] 복호화 실패:', error);
      }
    }

    // 가상 이메일 및 패스워드 생성
    const virtualEmail = `toss_${tossUserKey}@toss.local`;
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

    // 기존 사용자 찾기
    console.log('[토스 Auth] 기존 사용자 찾기...');
    const existingUser = await findUserByEmail(supabaseAdmin, virtualEmail);

    let user;

    if (existingUser) {
      // 기존 사용자 업데이트
      console.log(`[토스 Auth] 기존 사용자 업데이트: ${existingUser.id}`);
      user = await updateSupabaseUser(
        supabaseAdmin,
        existingUser.id,
        existingUser.email,
        virtualPassword,
        { ...existingUser.user_metadata, ...userMetadata }
      );
    } else {
      // 새 사용자 생성
      console.log(`[토스 Auth] 새 사용자 생성: userKey=${tossUserKey}`);
      
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: virtualEmail,
        password: virtualPassword,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (createError) {
        console.error('[토스 Auth] 사용자 생성 실패:', createError.message);
        
        // 이메일 중복 에러인 경우 업데이트 시도
        if (createError.message?.includes('already registered')) {
          console.log('[토스 Auth] 이메일 중복, 업데이트로 전환');
          const retryUser = await findUserByEmail(supabaseAdmin, virtualEmail);
          if (retryUser) {
            user = await updateSupabaseUser(
              supabaseAdmin,
              retryUser.id,
              retryUser.email,
              virtualPassword,
              { ...retryUser.user_metadata, ...userMetadata }
            );
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

    // 사용자 정보 및 로그인 정보 반환
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
    return createErrorResponse(
      500,
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
});
