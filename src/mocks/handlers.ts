import { http, HttpResponse } from 'msw';

// Supabase API URL 패턴 (와일드카드를 사용하여 모든 호스트 대응)
const SUPABASE_REST_URL = '*/rest/v1';

export const handlers = [
  // --------------------------------------------------------
  // Auth 핸들러
  // --------------------------------------------------------
  http.post(/.*\/auth\/v1\/signup/, () => {
    return HttpResponse.json({
      access_token: 'fake-anonymous-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'anon-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: '',
        is_anonymous: true,
      },
    });
  }),
  http.post(/.*\/auth\/v1\/token/, () => {
    return HttpResponse.json({
      access_token: 'fake-anonymous-token',
      token_type: 'bearer',
      expires_in: 3600,
    });
  }),
  http.get(/.*\/auth\/v1\/user/, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // --------------------------------------------------------
  // DB(Rest) 핸들러
  // --------------------------------------------------------
  // 프로필 조회 (GET /rest/v1/profiles)
  http.get(`${SUPABASE_REST_URL}/profiles`, ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const userId =
      url.searchParams.get('user_id')?.replace('eq.', '') ||
      url.searchParams.get('id')?.replace('eq.', '');

    return HttpResponse.json({
      user_id: userId || 'test-user-id',
      nickname: '테스트유저',
      minerals: 1000,
      stamina: 5,
      tier_level: 2,
      experience: 0,
      created_at: new Date().toISOString(),
    });
  }),

  // 프로필 업데이트 (PATCH /rest/v1/profiles)
  http.patch(`${SUPABASE_REST_URL}/profiles`, async ({ request }: { request: Request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(body); // 업데이트된 내용 반환 (단일 객체)
  }),

  // --------------------------------------------------------
  // RPC 핸들러
  // --------------------------------------------------------
  // 게임 결과 제출 (POST /rest/v1/rpc/submit_game_result)
  http.post(
    `${SUPABASE_REST_URL}/rpc/submit_game_result`,
    async ({ request }: { request: Request }) => {
      const body = (await request.json()) as { p_minerals_earned: number };
      return HttpResponse.json({
        success: true,
        new_minerals: 1000 + (body.p_minerals_earned || 0),
        new_experience: 100,
        level_up: false,
      });
    }
  ),

  // 스태미나 소모 (POST /rest/v1/rpc/consume_stamina)
  http.post(`${SUPABASE_REST_URL}/rpc/consume_stamina`, async () => {
    return HttpResponse.json({ success: true, current_stamina: 4 });
  }),

  // 광고 보상 스태미나 (POST /rest/v1/rpc/recover_stamina_ads)
  http.post(`${SUPABASE_REST_URL}/rpc/recover_stamina_ads`, async () => {
    return HttpResponse.json({ success: true, current_stamina: 5 });
  }),

  // 미네랄 지급 (POST /rest/v1/rpc/add_minerals)
  http.post(`${SUPABASE_REST_URL}/rpc/add_minerals`, async ({ request }: { request: Request }) => {
    const body = (await request.json()) as {
      p_minerals_earned?: number;
      p_amount?: number;
    };
    const amount = body.p_minerals_earned ?? body.p_amount ?? 0;
    return HttpResponse.json({
      success: true,
      minerals: amount, // 테스트 환경에서는 더하지 않고 요청값 그대로 반환하거나 적절히 처리
      message: `${amount} 미네랄 획득! 💎`,
    });
  }),

  // 인벤토리 조회 (GET /rest/v1/inventory)
  http.get(`${SUPABASE_REST_URL}/inventory`, () => {
    return HttpResponse.json([]);
  }),

  // 게임 설정 조회 (GET /rest/v1/game_config) - tiers.ts loadCycleCap, AuthModeSection 등
  // RegExp: MSW 2에서 */rest/v1 패턴이 다른 도메인(Supabase URL)과 매칭되지 않는 경우 대응
  http.get(/.*\/rest\/v1\/game_config/, ({ request }) => {
    const url = new URL(request.url);
    const keyParam = url.searchParams.get('key') ?? '';
    const key = keyParam.replace(/^eq\./, '');
    if (key === 'tier_cycle_cap') {
      return HttpResponse.json({ value: '250000' });
    }
    return HttpResponse.json({ value: null });
  }),

  // 티어 정의 조회 (GET /rest/v1/tier_definitions) - tiers.ts loadTierDefinitions
  http.get(/.*\/rest\/v1\/tier_definitions/, () => {
    return HttpResponse.json([
      { level: 0, name: '베이스캠프', icon: '⛺', min_score: 0, color_var: '--color-tier-base' },
      { level: 1, name: '등산로', icon: '🥾', min_score: 1000, color_var: '--color-tier-trail' },
      { level: 2, name: '중턱', icon: '⛰️', min_score: 5000, color_var: '--color-tier-mid' },
      { level: 3, name: '고지대', icon: '🏔️', min_score: 20000, color_var: '--color-tier-high' },
      { level: 4, name: '봉우리', icon: '🦅', min_score: 50000, color_var: '--color-tier-peak' },
      { level: 5, name: '정상', icon: '🚩', min_score: 100000, color_var: '--color-tier-summit' },
      { level: 6, name: '전설', icon: '👑', min_score: 250000, color_var: '--color-tier-legend' },
    ]);
  }),

  // 랭킹 조회 (POST /rest/v1/rpc/get_ranking_v2)
  http.post(`${SUPABASE_REST_URL}/rpc/get_ranking_v2`, () => {
    return HttpResponse.json([
      {
        user_id: 'user-1',
        nickname: '테스트유저1',
        score: 1000,
        rank: 1,
        tier_level: 2,
        tier_stars: 1,
      },
      {
        user_id: 'user-2',
        nickname: '테스트유저2',
        score: 800,
        rank: 2,
        tier_level: 1,
        tier_stars: 3,
      },
    ]);
  }),

  // 아이템 구매 (POST /rest/v1/rpc/purchase_item)
  http.post(`${SUPABASE_REST_URL}/rpc/purchase_item`, async ({ request }) => {
    const body = (await request.json()) as { p_item_id?: number };
    return HttpResponse.json({
      success: body.p_item_id === -999 ? false : true,
      remaining_minerals: 900,
      new_quantity: 1,
    });
  }),

  // 리더보드 조회 (POST /rest/v1/rpc/get_leaderboard)
  http.post(`${SUPABASE_REST_URL}/rpc/get_leaderboard`, () => {
    return HttpResponse.json([
      { user_id: 'user-1', nickname: '리더1', score: 50000, rank: 1, tier_level: 4, tier_stars: 2 },
      { user_id: 'user-2', nickname: '리더2', score: 45000, rank: 2, tier_level: 4, tier_stars: 0 },
    ]);
  }),
];
