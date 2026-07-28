import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { useDebugStore } from '@/stores/useDebugStore';
import { generateQuestion } from '@/utils/quizGenerator';
import { Mountain, World, Topic, QuizQuestion } from '../types/quiz';

interface UseQuizSessionProps {
  showTipModal: boolean;
  worldParam: string | null;
  categoryParam: string | null;
  levelParam: number | null;
  modeParam: string | null;
  mountainParam: string | null;
  setGameSessionId: (id: string) => void;
}

export function useQuizSession({
  showTipModal,
  worldParam,
  categoryParam,
  levelParam,
  modeParam,
  mountainParam,
  setGameSessionId,
}: UseQuizSessionProps) {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [preGeneratedQuestions, setPreGeneratedQuestions] = useState<QuizQuestion[]>([]);
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

          // Pre-generate questions to satisfy server-side validation
          const preGenerated = [];
          const numToGen = mode === 'timeattack' ? 10 : 20;
          for (let i = 0; i < numToGen; i++) {
            const q = generateQuestion(
              (mountainParam as Mountain) || 'math',
              (worldParam as World) || 'World1',
              (categoryParam as Topic) || '기초',
              levelParam || 1,
              'medium'
            );
            q.id = crypto.randomUUID();
            preGenerated.push(q);
          }

          const { data, error } = await safeSupabaseQuery(
            supabase.rpc('create_game_session', {
              p_questions: preGenerated,
              p_category: categoryParam,
              p_subject: worldParam,
              p_level: levelParam,
              p_game_mode: mode,
              p_is_debug_session: infiniteStamina,
            })
          );
          if (error || !data?.session_id) {
            if (data?.message === 'Not authenticated') {
              console.log(
                '[useQuizSession] Local guest session mode active (unauthenticated user).'
              );
            } else {
              console.warn('[useQuizSession] create_game_session response:', { error, data });
            }
          }
          if (data?.session_id) {
            setGameSessionId(data.session_id);
            setPreGeneratedQuestions(preGenerated);
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
    mountainParam,
    sessionCreated,
    setGameSessionId,
  ]);

  return {
    sessionCreated,
    setSessionCreated,
    preGeneratedQuestions,
  };
}
