import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. 인증 검사 (Basic Auth)
    const authHeader = req.headers.get('Authorization');
    const mySecret = Deno.env.get('TOSS_AUTH_KEY'); 

    if (authHeader !== `Basic ${mySecret}`) {
      console.error(`⛔ 인증 실패!`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. 데이터 수신
    const { userKey, referrer } = await req.json();
    console.log(`✅ [요청 수신] userKey: ${userKey}, 사유: ${referrer}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. 비즈니스 로직
    switch (referrer) {
      case 'UNLINK':
        console.log("👉 단순 연결 해제 (DB 유지)");
        break;

      case 'WITHDRAWAL_TERMS':
      case 'WITHDRAWAL_TOSS':
        console.log("🚨 회원 탈퇴 요청 (DB 삭제 시도)");
        
        // [핵심 변경] Loop 함수 제거 -> DB 함수(RPC) 호출로 변경
        // 만들어주신 get_user_id_by_toss_key 함수를 실행합니다.
        const { data: targetUserId, error: rpcError } = await supabaseAdmin
          .rpc('get_user_id_by_toss_key', { toss_key: userKey });

        if (rpcError) {
          console.error(`❌ DB 검색 에러: ${rpcError.message}`);
          throw rpcError;
        }

        if (targetUserId) {
          // 유저 삭제 실행
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
          
          if (deleteError) {
             console.error(`❌ 삭제 실패: ${deleteError.message}`);
             throw deleteError;
          }
          console.log(`🗑️ 유저 삭제 완료 (ID: ${targetUserId})`);
        } else {
          console.log("⚠️ 유저를 찾을 수 없음 (이미 삭제됨 or 존재하지 않음)");
        }
        break;

      default:
        console.warn(`❓ 알 수 없는 사유(${referrer})입니다. 작업 건너뜀.`);
        break;
    }

    return new Response(JSON.stringify({ result: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("서버 에러:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})