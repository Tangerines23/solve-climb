# MSW game_config 미처리 요청 수정 보고

## 1. 원인 분석

### 증상
```
[MSW] Warning: intercepted a request without a matching request handler:
  • GET https://aekcjzxxjczqibxkoakg.supabase.co/rest/v1/game_config?select=value&key=eq.tier_cycle_cap
```

### 원인
MSW 2에서 `*/rest/v1/game_config` 패턴이 **Supabase 실제 URL과 매칭되지 않음**.

- **요청 URL**: `https://aekcjzxxjczqibxkoakg.supabase.co/rest/v1/game_config?select=value&key=eq.tier_cycle_cap`
- **기존 핸들러**: `http.get('*/rest/v1/game_config', ...)`
- MSW 2의 `*` 기반 패턴이 `https://...supabase.co` 같은 외부 도메인과 제대로 매칭되지 않는 것으로 추정
- MSW 문서: 다른 도메인/포트 요청은 **전체 URL** 또는 **RegExp** 사용 권장

### 영향받는 호출 경로
- `src/constants/tiers.ts` → `loadCycleCap()` → `supabase.from('game_config').select('value').eq('key', 'tier_cycle_cap')`
- `src/utils/tierUtils.ts` → `calculateTier()` / `calculateTierSync()` 내부에서 `loadCycleCap()` 호출
- `src/components/debug/AuthModeSection.tsx` → game_config 접근성 테스트
- 티어/레이아웃 관련 컴포넌트 렌더링 시 실제 Supabase 요청 발생

---

## 2. 수정 내용

**파일**: `src/mocks/handlers.ts`

```diff
  // 게임 설정 조회 (GET /rest/v1/game_config) - tiers.ts loadCycleCap, AuthModeSection 등
+ // RegExp 사용: MSW 2에서 */rest/v1 패턴이 다른 도메인(Supabase URL)과 매칭 안 되는 경우 대응
- http.get(`${SUPABASE_REST_URL}/game_config`, ({ request }) => {
+ http.get(/.*\/rest\/v1\/game_config/, ({ request }) => {
```

- **변경**: 문자열 패턴 `*/rest/v1/game_config` → RegExp `/.*\/rest\/v1\/game_config/`
- **효과**: 어떤 Supabase 프로젝트 URL에서도 `/rest/v1/game_config` 경로 매칭 가능

---

## 3. 검증 결과

| 항목 | 결과 |
|------|------|
| `npm run test:all --run` | ✅ 124 files, 1340 tests 통과 |
| game_config 미처리 경고 | ✅ 사라짐 |

---

## 4. 참고: 기타 미처리 요청

테스트 중 아래 요청들은 여전히 MSW 핸들러가 없음(별도 수정 필요 시 추가):

- `POST .../rpc/get_ranking_v2`
- `POST .../rpc/purchase_item`
- `POST .../rpc/get_leaderboard`
- `POST .../rpc/debug_set_inventory_quantity`

해당 테스트들은 기존 방식으로 동작(실제 Supabase 호출 또는 fallback) 중이며, game_config 관련 문제와는 별개입니다.
