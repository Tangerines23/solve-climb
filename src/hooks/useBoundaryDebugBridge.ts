import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { useMyPageStats } from './useMyPageStats';
import { STATUS, type StatusType } from '../constants/status';

export function useBoundaryDebugBridge() {
  const { debugSetMinerals, debugSetStamina } = useUserStore();
  const { refetch } = useMyPageStats();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: StatusType; text: string } | null>(null);

  const handleStaminaSet = useCallback(
    async (value: number) => {
      if (isUpdating) return;

      try {
        setIsUpdating(true);
        setMessage(null);
        await debugSetStamina(value);
        setMessage({ type: STATUS.SUCCESS, text: `스태미나가 ${value}로 설정되었습니다.` });
      } catch (err) {
        setMessage({
          type: STATUS.ERROR,
          text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, debugSetStamina]
  );

  const handleMineralsSet = useCallback(
    async (value: number) => {
      if (isUpdating) return;

      try {
        setIsUpdating(true);
        setMessage(null);
        await debugSetMinerals(value);
        setMessage({
          type: STATUS.SUCCESS,
          text: `미네랄이 ${value.toLocaleString()}로 설정되었습니다.`,
        });
      } catch (err) {
        setMessage({
          type: STATUS.ERROR,
          text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, debugSetMinerals]
  );

  const handleTierSet = useCallback(
    async (level: number) => {
      if (isUpdating) return;

      try {
        setIsUpdating(true);
        setMessage(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setMessage({ type: STATUS.ERROR, text: '로그인이 필요합니다.' });
          return;
        }
        const user = session.user;

        const { error } = await supabase.rpc('debug_set_tier', {
          p_user_id: user.id,
          p_level: level,
        });

        if (error) throw error;

        setMessage({ type: STATUS.SUCCESS, text: `티어가 레벨 ${level}로 설정되었습니다.` });
        await refetch();
      } catch (err) {
        setMessage({
          type: STATUS.ERROR,
          text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refetch]
  );

  const handleMasteryScoreSet = useCallback(
    async (score: number) => {
      if (isUpdating) return;

      try {
        setIsUpdating(true);
        setMessage(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setMessage({ type: STATUS.ERROR, text: '로그인이 필요합니다.' });
          return;
        }
        const user = session.user;

        const { error } = await supabase.rpc('debug_set_mastery_score', {
          p_user_id: user.id,
          p_score: score,
        });

        if (error) throw error;

        setMessage({
          type: STATUS.SUCCESS,
          text: `마스터리 점수가 ${score.toLocaleString()}로 설정되었습니다.`,
        });
        await refetch();
      } catch (err) {
        setMessage({
          type: STATUS.ERROR,
          text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refetch]
  );

  return {
    isUpdating,
    message,
    handleStaminaSet,
    handleMineralsSet,
    handleTierSet,
    handleMasteryScoreSet,
  };
}
