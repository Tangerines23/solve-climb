import { vi } from 'vitest';

/**
 * Supabase 통합 Mock
 * 주요 테이블 및 RPC 응답 시뮬레이션
 */
export const mockSupabaseData = {
    profile: {
        id: 'test-user-id',
        minerals: 1000,
        stamina: 5,
        last_ad_stamina_recharge: null,
    },
    inventory: [
        { quantity: 5, items: { id: 1, code: 'rope', name: 'Rope' } }
    ],
};

export const createMockSupabase = () => ({
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSupabaseData.profile, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockImplementation((name) => {
        if (name === 'consume_stamina') return { data: { success: true }, error: null };
        if (name === 'recover_stamina_ads') return { data: { success: true }, error: null };
        return { data: null, error: null };
    }),
});
