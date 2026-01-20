import { http, HttpResponse } from 'msw';

// Supabase API URL 패턴 (와일드카드를 사용하여 모든 호스트 대응)
const SUPABASE_REST_URL = '*/rest/v1';
const SUPABASE_AUTH_URL = '*/auth/v1';

export const handlers = [
  // --------------------------------------------------------
  // Auth 핸들러
  // --------------------------------------------------------
  http.get(`${SUPABASE_AUTH_URL}/user`, () => {
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
    const body = (await request.json()) as any;
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

  // 인벤토리 조회 (GET /rest/v1/inventory)
  http.get(`${SUPABASE_REST_URL}/inventory`, () => {
    return HttpResponse.json([]);
  }),
];
