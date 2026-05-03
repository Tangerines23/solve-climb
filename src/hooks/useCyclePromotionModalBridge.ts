import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useCyclePromotionModalBridge = (onPromote: () => void) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromote = async () => {
    setIsPromoting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('promote_to_next_cycle');

      if (rpcError) {
        throw rpcError;
      }

      if (data && data.success) {
        onPromote();
      } else {
        setError(data?.error || '승급 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to promote:', err);
      setError('승급 처리 중 오류가 발생했습니다.');
    } finally {
      setIsPromoting(false);
    }
  };

  return {
    isPromoting,
    error,
    handlePromote
  };
};
