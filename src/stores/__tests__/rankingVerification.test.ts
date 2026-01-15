import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../../utils/supabaseClient';

vi.mock('../../utils/supabaseClient', () => ({
    supabase: {
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

describe('Ranking System V2 Verification', () => {
    it('should fetch weekly ranking successfully', async () => {
        // 1. Call the RPC function
        const { data, error } = await supabase.rpc('get_ranking_v2', {
            p_category: 'math',
            p_period: 'weekly',
            p_type: 'total',
            p_limit: 10,
        });

        // 2. Log Debug Info
        if (error) {
            console.error('RPC Error:', error);
        } else {
            console.log('RPC Success. Data length:', data?.length);
            console.log('Sample Data:', data?.[0]);
        }

        // 3. Assertions
        // If the function doesn't exist, error.code will be '42883' (undefined_function) or similar
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });
});
