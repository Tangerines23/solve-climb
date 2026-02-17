import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 7일 지난 로그 삭제 (auth.sessions, storage.objects 등은 제외하고 커스텀 로그 테이블만 대상)
    // 실제 운영 환경에서는 pg_cron을 쓰는 것이 좋지만, Edge Function으로 간단히 구현

    // 예시: game_activity 로그 중 30일 지난 것 삭제
    const { error: activityError } = await supabase
      .from('game_activity')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (activityError) throw activityError;

    return new Response(JSON.stringify({ message: 'Logs cleanup completed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
