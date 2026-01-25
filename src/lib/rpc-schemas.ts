/**
 * RPC 응답 스키마 정의
 * Supabase RPC 함수의 응답 형식을 Zod로 검증합니다.
 */

import { z } from 'zod';

// ============================================================================
// 공통 스키마
// ============================================================================

/** 기본 응답 스키마 (success, error) */
export const baseResponseSchema = z.object({
    success: z.boolean(),
    error: z.string().optional(),
});

/** 티어 정보 스키마 */
export const tierSchema = z.object({
    level: z.number(),
    name: z.string(),
    min_score: z.number(),
    max_score: z.number().nullable(),
});

/** 뱃지 정보 스키마 */
export const badgeSchema = z.object({
    badge_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
});

// ============================================================================
// 게임 관련 RPC 스키마
// ============================================================================

/** create_game_session 응답 */
export const createGameSessionSchema = z.object({
    session_id: z.string().uuid(),
    questions: z.array(z.object({
        id: z.string().uuid(),
        question: z.string(),
        answer: z.number(),
        choices: z.array(z.number()),
    })),
});

/** submit_game_result 응답 */
export const submitGameResultSchema = baseResponseSchema.extend({
    minerals_earned: z.number(),
    tier_updated: z.boolean(),
    new_tier_level: z.number().optional(),
    badges_earned: z.array(z.string()).optional(),
    mastery_score: z.number().optional(),
});

/** validate_game_session 응답 */
export const validateGameSessionSchema = z.boolean();

/** calculate_tier 응답 */
export const calculateTierSchema = tierSchema;

/** check_and_award_badges 응답 */
export const checkAndAwardBadgesSchema = baseResponseSchema.extend({
    awarded_badges: z.array(badgeSchema).optional(),
});

/** promote_to_next_cycle 응답 */
export const promoteToNextCycleSchema = baseResponseSchema.extend({
    new_level: z.number().optional(),
});

// ============================================================================
// 유저 관련 RPC 스키마
// ============================================================================

/** consume_stamina 응답 */
export const consumeStaminaSchema = z.object({
    success: z.boolean(),
    remaining_stamina: z.number(),
    next_recovery_at: z.string().datetime().optional(),
});

/** check_and_recover_stamina 응답 */
export const checkAndRecoverStaminaSchema = z.object({
    current_stamina: z.number(),
    max_stamina: z.number(),
    recovered: z.number().optional(),
    next_recovery_at: z.string().datetime().optional(),
});

/** handle_daily_login 응답 */
export const handleDailyLoginSchema = baseResponseSchema.extend({
    minerals_reward: z.number().optional(),
    streak_days: z.number().optional(),
    is_first_login: z.boolean().optional(),
});

/** update_profile_nickname 응답 */
export const updateProfileNicknameSchema = z.void();

/** add_minerals 응답 */
export const addMineralsSchema = baseResponseSchema.extend({
    new_balance: z.number().optional(),
});

// ============================================================================
// 아이템 관련 RPC 스키마
// ============================================================================

/** purchase_item 응답 */
export const purchaseItemSchema = baseResponseSchema.extend({
    new_minerals: z.number().optional(),
    item_quantity: z.number().optional(),
});

/** consume_item 응답 */
export const consumeItemSchema = baseResponseSchema.extend({
    remaining_quantity: z.number().optional(),
    effect_applied: z.boolean().optional(),
});

/** recover_stamina_ads 응답 */
export const recoverStaminaAdsSchema = z.object({
    success: z.boolean(),
    new_stamina: z.number(),
    recovered_amount: z.number().optional(),
});

// ============================================================================
// 랭킹 관련 RPC 스키마
// ============================================================================

/** 랭킹 아이템 스키마 */
const rankingItemSchema = z.object({
    rank: z.number(),
    user_id: z.string().uuid(),
    nickname: z.string().nullable(),
    score: z.number(),
    tier_level: z.number().optional(),
});

/** get_ranking 응답 */
export const getRankingSchema = z.array(rankingItemSchema);

/** get_ranking_v2 응답 */
export const getRankingV2Schema = z.array(rankingItemSchema);

/** get_leaderboard 응답 */
export const getLeaderboardSchema = z.array(rankingItemSchema);

// ============================================================================
// 스키마 맵 (함수명 -> 스키마)
// ============================================================================

export const rpcSchemas = {
    // 게임 관련
    create_game_session: createGameSessionSchema,
    submit_game_result: submitGameResultSchema,
    validate_game_session: validateGameSessionSchema,
    calculate_tier: calculateTierSchema,
    check_and_award_badges: checkAndAwardBadgesSchema,
    promote_to_next_cycle: promoteToNextCycleSchema,

    // 유저 관련
    consume_stamina: consumeStaminaSchema,
    check_and_recover_stamina: checkAndRecoverStaminaSchema,
    handle_daily_login: handleDailyLoginSchema,
    add_minerals: addMineralsSchema,

    // 아이템 관련
    purchase_item: purchaseItemSchema,
    consume_item: consumeItemSchema,
    recover_stamina_ads: recoverStaminaAdsSchema,

    // 랭킹 관련
    get_ranking: getRankingSchema,
    get_ranking_v2: getRankingV2Schema,
    get_leaderboard: getLeaderboardSchema,
} as const;

export type RpcName = keyof typeof rpcSchemas;
