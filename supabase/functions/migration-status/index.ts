// 마이그레이션 상태 조회 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { hash } = await req.json();

    if (!hash || typeof hash !== 'string' || hash.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'hash is required' }),
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
      console.error('[마이그레이션 상태] Supabase 환경 변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // user_migrations 테이블에서 매핑 여부 조회
    // 테이블이 없으면 false 반환 (마이그레이션 필요)
    try {
      const { data, error } = await supabaseAdmin
        .from('user_migrations')
        .select('hash')
        .eq('hash', hash)
        .maybeSingle();

      if (error) {
        // 테이블이 없는 경우도 처리
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('[마이그레이션 상태] user_migrations 테이블이 없습니다. 마이그레이션 필요.');
          return new Response(
            JSON.stringify({ isMapped: false }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      const isMapped = data !== null && data !== undefined;

      console.log(`[마이그레이션 상태] hash=${hash.substring(0, 10)}... isMapped=${isMapped}`);

      return new Response(
        JSON.stringify({ isMapped }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (dbError) {
      console.error('[마이그레이션 상태] 데이터베이스 조회 오류:', dbError);
      
      // 테이블이 없는 경우 false 반환
      return new Response(
        JSON.stringify({ isMapped: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[마이그레이션 상태] 예외 발생:', error);
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
