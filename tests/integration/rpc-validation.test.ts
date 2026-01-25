/**
 * RPC 응답 검증 테스트
 * Supabase RPC 함수의 응답이 예상된 스키마와 일치하는지 검증합니다.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
    getRankingV2Schema,
    getLeaderboardSchema,
} from '../../src/lib/rpc-schemas';

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
                p_category: 'math',
                p_period: 'weekly',
                p_type: 'score',
                p_limit: 10,
            });

            expect(error).toBeNull();

            const result = getRankingV2Schema.safeParse(data);
            if (!result.success) {
                console.error('Schema validation failed:', result.error.format());
            }
            expect(result.success).toBe(true);
        });

        test('get_leaderboard 응답 형식', async () => {
            if (!supabase) return;

            const { data, error } = await supabase.rpc('get_leaderboard', {
                p_mode: 'score',
                p_limit: 10,
            });

            expect(error).toBeNull();

            const result = getLeaderboardSchema.safeParse(data);
            if (!result.success) {
                console.error('Schema validation failed:', result.error.format());
            }
            expect(result.success).toBe(true);
        });
    });
});

describe('RPC 스키마 유효성', () => {
    test('모든 스키마가 정의되어 있음', async () => {
        const { rpcSchemas } = await import('../../src/lib/rpc-schemas');

        const requiredRpcs = [
            'create_game_session',
            'submit_game_result',
            'calculate_tier',
            'consume_stamina',
            'purchase_item',
            'get_ranking_v2',
        ];

        for (const rpc of requiredRpcs) {
            expect(rpcSchemas).toHaveProperty(rpc);
        }
    });
});
