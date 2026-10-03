import { describe, it, expect, vi } from 'vitest';
import { ProgressRepository, DBProgressRecord } from '@/services/ProgressRepository';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn(),
}));

describe('ProgressRepository', () => {
  describe('fetchServerProgress', () => {
    it('returns data on success', async () => {
      const mockData: DBProgressRecord[] = [
        {
          world_id: 'world1',
          category_id: 'category1',
          subject_id: 'subject1',
          level: 1,
          mode_code: 1,
          best_score: 100,
          updated_at: '2023-10-01T00:00:00Z',
        },
      ];
      (safeSupabaseQuery as vi.Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await ProgressRepository.fetchServerProgress('user1');

      expect(result).toEqual({ data: mockData, error: null });
      expect(supabase.from).toHaveBeenCalledWith('user_level_records');
      expect(supabase.select).toHaveBeenCalledWith(
        'world_id, category_id, subject_id, level, mode_code, best_score, updated_at'
      );
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });

    it('returns error on failure', async () => {
      const mockError = new Error('Query failed');
      (safeSupabaseQuery as vi.Mock).mockResolvedValue({ data: null, error: mockError });

      const result = await ProgressRepository.fetchServerProgress('user1');

      expect(result).toEqual({ data: null, error: mockError });
      expect(supabase.from).toHaveBeenCalledWith('user_level_records');
      expect(supabase.select).toHaveBeenCalledWith(
        'world_id, category_id, subject_id, level, mode_code, best_score, updated_at'
      );
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });
  });

  describe('resetServerProgress', () => {
    it('returns success true on success', async () => {
      (safeSupabaseQuery as vi.Mock).mockResolvedValue({ data: null, error: null });

      const result = await ProgressRepository.resetServerProgress('user1');

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('user_level_records');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });

    it('returns success false and error on failure', async () => {
      const mockError = new Error('Delete failed');
      (safeSupabaseQuery as vi.Mock).mockResolvedValue({ data: null, error: mockError });

      const result = await ProgressRepository.resetServerProgress('user1');

      expect(result).toEqual({ success: false, error: mockError });
      expect(supabase.from).toHaveBeenCalledWith('user_level_records');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });
  });
});
