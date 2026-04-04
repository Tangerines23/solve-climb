import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { useDebugStore } from '@/stores/useDebugStore';

interface UseQuizSessionProps {
  showTipModal: boolean;
  worldParam: string | null;
  categoryParam: string | null;
  levelParam: number | null;
  modeParam: string | null;
  setGameSessionId: (id: string) => void;
}

export function useQuizSession({
  showTipModal,
  worldParam,
  categoryParam,
  levelParam,
  modeParam,
  setGameSessionId,
}: UseQuizSessionProps) {
  const [sessionCreated, setSessionCreated] = useState(false);
  const isCreatingSessionRef = useRef(false);

  useEffect(() => {
    if (
      !showTipModal &&
      worldParam &&
      categoryParam &&
      levelParam !== null &&
      modeParam &&
      modeParam !== 'base-camp' &&
      modeParam !== 'base-camp-result' &&
      !sessionCreated &&
      !isCreatingSessionRef.current
    ) {
      isCreatingSessionRef.current = true;
      (async () => {
        try {
          const mode = modeParam.includes('time') ? 'timeattack' : 'survival';
          const { infiniteStamina } = useDebugStore.getState();
          const { data } = await safeSupabaseQuery(
            supabase.rpc('create_game_session', {
              p_questions: [],
              p_category: categoryParam,
              p_subject: worldParam,
              p_level: levelParam,
              p_game_mode: mode,
              p_is_debug_session: infiniteStamina,
            })
          );
          if (data?.session_id) {
            setGameSessionId(data.session_id);
            setSessionCreated(true);
          }
        } finally {
          isCreatingSessionRef.current = false;
        }
      })();
    }
  }, [
    showTipModal,
    worldParam,
    categoryParam,
    levelParam,
    modeParam,
    sessionCreated,
    setGameSessionId,
  ]);

  return {
    sessionCreated,
    setSessionCreated,
  };
}
