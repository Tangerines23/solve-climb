import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface GameLog {
  id: string;
  game_mode: string;
  world_id: string;
  category_id: string;
  level: number;
  score: number;
  correct_count: number;
  total_questions: number;
  avg_solve_time: number;
  wrong_answers: Array<{
    question: string;
    wrong_answer: number;
    correct_answer: number;
  }>;
  created_at: string;
}

export function useGrowthJournal() {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_recent_game_logs', { p_limit: 20 });

      if (rpcError) throw rpcError;

      setLogs(data || []);
      setError(null);
    } catch (err: unknown) {
      console.error('[useGrowthJournal] Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
