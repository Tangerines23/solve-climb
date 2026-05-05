import { useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { useQuizStore, useGameStore, calculateScoreForTier, type TimeLimit } from '@/features/quiz';
import { storageService, STORAGE_KEYS } from '../services';
import { useDailyRewardStore } from '../stores/useDailyRewardStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useDebugStore } from '../stores/useDebugStore';
import { urls } from '../utils/navigation';
import { type DebugAction, type CustomPreset } from '../types/debug';
import { debugPresets, getCustomPresets, savePresetHistory } from '../utils/debugPresets';

/**
 * 디버그 액션 및 프리셋 실행을 위한 훅
 * 아키텍처 규칙 준수를 위해 utils에서 hook 레이어로 이동됨
 */
export function useDebugActions() {
  const { fetchUserData, debugSetMinerals, debugSetStamina } = useUserStore();
  const { setTimeLimit } = useQuizStore();
  const { setCombo } = useGameStore();
  const { checkDailyLogin } = useDailyRewardStore();
  const { markAllAsRead, setNotifications } = useNotificationStore();
  const {
    setShowReturnFloater,
    showReturnFloater,
    bypassLevelLock,
    setBypassLevelLock,
    showSafeAreaGuide,
    showComponentBorders,
    setShowSafeAreaGuide,
    setShowComponentBorders,
    networkLatency,
    forceNetworkError,
    setNetworkLatency,
    setForceNetworkError,
  } = useDebugStore();

  /**
   * 개별 디버그 액션 실행
   */
  const executeDebugAction = useCallback(
    async (action: DebugAction, targetUserId: string): Promise<void> => {
      switch (action.type) {
        case 'reset': {
          const resetType = (action.target || 'all') as 'all' | 'score' | 'minerals' | 'tier';
          const { error } = await supabase.rpc('debug_reset_profile', {
            p_user_id: targetUserId,
            p_reset_type: resetType,
          });
          if (error) throw error;
          break;
        }

        case 'setTier': {
          if (action.level === undefined) {
            throw new Error('setTier action requires level');
          }
          const { error } = await supabase.rpc('debug_set_tier', {
            p_user_id: targetUserId,
            p_level: action.level,
          });
          if (error) throw error;
          break;
        }

        case 'setMasteryScore': {
          if (action.value === undefined) {
            throw new Error('setMasteryScore action requires value');
          }
          const { error } = await supabase.rpc('debug_set_mastery_score', {
            p_user_id: targetUserId,
            p_score: action.value,
          });
          if (error) throw error;
          break;
        }

        case 'setMinerals': {
          if (action.value === undefined) {
            throw new Error('setMinerals action requires value');
          }
          await debugSetMinerals(action.value);
          break;
        }

        case 'setStamina': {
          if (action.value === undefined) {
            throw new Error('setStamina action requires value');
          }
          await debugSetStamina(action.value);
          break;
        }

        case 'grantAllItems': {
          const { data: items, error: itemsError } = await supabase.from('items').select('id');
          if (itemsError) throw itemsError;

          const quantity = action.quantity || 99;
          for (const item of items || []) {
            await supabase.rpc('debug_set_inventory_quantity', {
              p_user_id: targetUserId,
              p_item_id: item.id,
              p_quantity: quantity,
            });
          }
          break;
        }

        case 'grantAllBadges': {
          const { data: badges, error: badgesError } = await supabase
            .from('badge_definitions')
            .select('id');

          if (badgesError) throw badgesError;

          const badgePromises = (badges || []).map((badge) =>
            supabase
              .rpc('debug_grant_badge', {
                p_user_id: targetUserId,
                p_badge_id: badge.id,
              })
              .then(
                (result) => ({ success: true, badgeId: badge.id, result }),
                (error) => ({ success: false, badgeId: badge.id, error })
              )
          );

          const results = await Promise.allSettled(badgePromises);
          const failures = results
            .map((result, index) => {
              if (result.status === 'rejected') {
                const badgeId = badges?.at(index)?.id;
                return { badgeId: badgeId ?? 'unknown', error: result.reason };
              }
              if (result.status === 'fulfilled' && !result.value.success) {
                return {
                  badgeId: result.value.badgeId,
                  error: (result.value as { error: unknown }).error,
                };
              }
              return null;
            })
            .filter((f): f is { badgeId: string; error: unknown } => f !== null);

          if (failures.length > 0) {
            console.warn(`${failures.length} badges failed to grant:`, failures);
          }
          break;
        }

        case 'setGameTime': {
          const seconds = action.seconds || 5;
          const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('status', 'playing')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sessionError && sessionError.code !== 'PGRST116') {
            throw sessionError;
          }

          if (session) {
            const { error: updateError } = await supabase.rpc('debug_set_session_timer', {
              p_session_id: session.id,
              p_seconds: seconds,
            });
            if (updateError) throw updateError;
          } else {
            const mappedTime: TimeLimit =
              seconds <= 10
                ? 10
                : seconds <= 15
                  ? 15
                  : seconds <= 60
                    ? 60
                    : seconds <= 120
                      ? 120
                      : 180;
            setTimeLimit(mappedTime);
          }
          break;
        }

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    },
    [debugSetMinerals, debugSetStamina, setTimeLimit]
  );

  /**
   * 프리셋 전체 적용
   */
  const applyPreset = useCallback(
    async (
      presetId: string,
      targetUserId?: string,
      refetch?: () => Promise<void>
    ): Promise<void> => {
      let finalUserId = targetUserId;

      if (!finalUserId) {
        const { data } = await supabase.auth.getUser();
        finalUserId = data.user?.id;
      }

      if (!finalUserId) throw new Error('User ID is required');

      const preset =
        debugPresets.find((p) => p.id === presetId) ||
        getCustomPresets().find((p) => p.id === presetId);

      if (!preset) {
        throw new Error(`Preset not found: ${presetId}`);
      }

      const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();

      try {
        for (let i = 0; i < preset.actions.length; i++) {
          const actionOrUndefined = preset.actions.at(i);
          if (!actionOrUndefined) continue;
          let action = actionOrUndefined;

          if (action.type === 'setMasteryScore' && action.value === -1) {
            if (presetId === 'veteran') {
              const calculatedScore = await calculateScoreForTier(6, 10, 100000);
              action = { ...action, value: calculatedScore };
            } else {
              throw new Error(`setMasteryScore with value -1 is only supported for veteran preset`);
            }
          }

          await executeDebugAction(action, finalUserId);
        }

        await fetchUserData();
        if (refetch) await refetch();

        savePresetHistory({
          id: historyId,
          presetId: preset.id,
          presetName: preset.name,
          appliedAt: startTime,
          userId: finalUserId,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        savePresetHistory({
          id: historyId,
          presetId: preset.id,
          presetName: preset.name,
          appliedAt: startTime,
          userId: finalUserId,
          success: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [fetchUserData, executeDebugAction]
  );

  return {
    executeDebugAction,
    applyPreset,
    getCustomPresets,
    saveCustomPreset: (preset: CustomPreset) => {
      const presets = getCustomPresets();
      const existingIndex = presets.findIndex((p) => p.id === preset.id);
      if (existingIndex >= 0) {
        presets.splice(existingIndex, 1, preset);
      } else {
        presets.push(preset);
      }
      storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, presets);
    },
    deleteCustomPreset: (presetId: string) => {
      const presets = getCustomPresets();
      const filtered = presets.filter((p) => p.id !== presetId);
      storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, filtered);
    },
    exportCustomPresets: () => {
      try {
        const presets = getCustomPresets();
        return JSON.stringify(presets, null, 2);
      } catch (error) {
        console.error('Failed to export custom presets:', error);
        throw error;
      }
    },
    importCustomPresets: (json: string) => {
      try {
        const presets = JSON.parse(json) as CustomPreset[];
        if (!Array.isArray(presets)) {
          throw new Error('Invalid preset format: must be an array');
        }
        for (const preset of presets) {
          if (!preset.id || !preset.name || !Array.isArray(preset.actions)) {
            throw new Error(`Invalid preset format: ${preset.id || 'unknown'}`);
          }
          preset.isCustom = true;
        }
        const existing = getCustomPresets();
        const existingIds = new Set(existing.map((p) => p.id));
        const merged = [...existing];
        for (const preset of presets) {
          if (!existingIds.has(preset.id)) {
            merged.push(preset);
          }
        }
        storageService.set(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, merged);
      } catch (error) {
        console.error('Failed to import custom presets:', error);
        throw error;
      }
    },
    // Daily Reward
    checkDailyLogin,
    triggerManualReward: () => {
      useDailyRewardStore.setState({
        showModal: true,
        rewardResult: {
          success: true,
          reward_minerals: 250,
          streak: 5,
          message: '매뉴얼 테스트 보상입니다!',
        },
      });
    },
    // Notifications
    clearNotifications: () => {
      markAllAsRead();
    },
    testNotification: () => {
      const mockNotification = {
        id: `test-${Date.now()}`,
        type: 'record_broken' as const,
        title: '테스트 알림',
        message: '디버그 패널에서 생성된 테스트 알림입니다.',
        timestamp: new Date(),
        read: false,
      };
      const current = useNotificationStore.getState().notifications;
      setNotifications([mockNotification, ...current]);
    },
    // Visual Debug
    showSafeAreaGuide,
    showComponentBorders,
    setShowSafeAreaGuide,
    setShowComponentBorders,
    // Network Simulation
    networkLatency,
    forceNetworkError,
    setNetworkLatency,
    setForceNetworkError,
    // Store accessors
    setShowReturnFloater,
    showReturnFloater,
    bypassLevelLock,
    setBypassLevelLock,
    // Navigation
    urls,
    // Game Controls (Visual Debug)
    setGameCombo: setCombo,
    setFeverLevel: (level: 0 | 1 | 2) => useGameStore.setState({ feverLevel: level }),
  };
}
