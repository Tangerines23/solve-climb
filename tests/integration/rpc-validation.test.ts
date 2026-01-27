/**
 * RPC 응답 검증 테스트
 * Supabase RPC 함수의 응답이 예상된 스키마와 일치하는지 검증합니다.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
    RankingListSchema,
    ItemActionResponseSchema,
    CommonResponseSchema
} from '../../src/utils/rpcValidator';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase =
    supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

describe('RPC 응답 검증', () => {
    beforeAll(() => {
        if (!supabase) {
            console.warn('⚠️ Supabase credentials not found, skipping RPC tests');
        }
    });

    describe('랭킹 관련 RPC', () => {
        test('get_ranking_v2 응답 형식', async () => {
            if (!supabase) return;

            const { data, error } = await supabase.rpc('get_ranking_v2', {
                p_category: 'arithmetic',
                p_limit: 10,
                p_period: 'weekly',
                p_type: 'total',
            });

            expect(error).toBeNull();

            const result = RankingListSchema.safeParse(data);
            if (!result.success) {
                console.error('Schema validation failed:', result.error.format());
            }
            expect(result.success).toBe(true);
        });

        test('purchase_item 응답 형식', async () => {
            if (!supabase) return;

            // 실제로 구매가 이루어지지 않도록 존재하지 않는 아이템 ID 또는 실패를 유도하거나 단순히 형식만 체크
            // 여기서는 RPC를 호출하되 에러가 나더라도 '형식'이 스키마와 맞는지를 봅니다.
            const { data, error } = await supabase.rpc('purchase_item', {
                p_item_id: -999, // 존재하지 않는 아이템
            });

            // 에러가 나더라도 data가 온다면 검증 가능
            if (data) {
                const result = ItemActionResponseSchema.safeParse(data);
                expect(result.success).toBe(true);
            }
        });

        test('get_leaderboard 응답 형식', async () => {
            if (!supabase) return;

            const { data, error } = await supabase.rpc('get_leaderboard', {
                p_mode: 'total',
                p_limit: 10,
            });

            expect(error).toBeNull();

            const result = RankingListSchema.safeParse(data);
            if (!result.success) {
                console.error('Schema validation failed:', result.error.format());
            }
            expect(result.success).toBe(true);
        });
    });
});
