import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { useDebugStore } from '../stores/useDebugStore';
import { useMyPageStats } from './useMyPageStats';
import { getPresetHistories, clearPresetHistory, debugPresets } from '../utils/debugPresets';
import { type CustomPreset, type DebugPreset, type PresetHistory } from '../types/debug';
import { useDebugActions } from './useDebugActions';
import { verifySync, type SyncResult } from '../utils/debugSync';

export type { PresetHistory, CustomPreset, SyncResult, DebugPreset };
export { debugPresets };

let _debugBridge: {
  setMinerals: (val: number) => Promise<void>;
  setStamina: (val: number) => Promise<void>;
  setTimeLimit: (val: number) => void;
  fetchUserData: () => Promise<void>;
} | null = null;

export const registerDebugBridge = (bridge: typeof _debugBridge): void => {
  _debugBridge = bridge;
};

export function useQuickActionsDebugBridge() {
  const { minerals, stamina, debugSetStamina, debugSetMinerals } = useUserStore();
  const {
    isAdminMode,
    toggleAdminMode,
    infiniteStamina,
    infiniteMinerals,
    infiniteTime,
    setInfiniteStamina,
    setInfiniteMinerals,
    setInfiniteTime,
  } = useDebugStore();
  const { refetch } = useMyPageStats();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [presetMessage, setPresetMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [presetHistories, setPresetHistories] = useState<PresetHistory[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isVerifyingSync, setIsVerifyingSync] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [debugUserInfo, setDebugUserInfo] = useState<{
    id: string;
    email?: string;
    hasProfile: boolean;
  } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', user.id);
        setDebugUserInfo({
          id: user.id,
          email: user.email,
          hasProfile: count !== null && count > 0,
        });
      } else {
        setDebugUserInfo(null);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser();
        useUserStore.getState().fetchUserData();
      } else {
        setDebugUserInfo(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const {
    applyPreset,
    getCustomPresets,
    saveCustomPreset,
    deleteCustomPreset,
    exportCustomPresets,
    importCustomPresets,
  } = useDebugActions();

  useEffect(() => {
    setPresetHistories(getPresetHistories());
    setCustomPresets(getCustomPresets());
  }, [getCustomPresets]);

  const handleStaminaUpdate = async (value: number) => {
    setIsUpdating(true);
    try {
      await debugSetStamina(value);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMineralsUpdate = async (value: number) => {
    setIsUpdating(true);
    try {
      await debugSetMinerals(value);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePresetApply = async (presetId: string) => {
    if (isApplyingPreset) return;
    try {
      setIsApplyingPreset(true);
      setPresetMessage(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous-debug-user';
      await applyPreset(presetId, userId, refetch);
      setPresetMessage({ type: 'success', text: '프리셋이 적용되었습니다.' });
      setPresetHistories(getPresetHistories());
    } catch (err) {
      setPresetMessage({
        type: 'error',
        text: `프리셋 적용 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
      setPresetHistories(getPresetHistories());
    } finally {
      setIsApplyingPreset(false);
    }
  };

  const handleClearHistory = () => {
    clearPresetHistory();
    setPresetHistories([]);
    setPresetMessage({ type: 'success', text: '히스토리가 삭제되었습니다.' });
  };

  const handleVerifySync = async () => {
    if (isVerifyingSync) return;
    try {
      setIsVerifyingSync(true);
      setSyncResult(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setPresetMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const result = await verifySync(session.user.id);
      setSyncResult(result);
      setPresetMessage({ type: 'success', text: '동기화 검증이 완료되었습니다.' });
    } catch (err) {
      setPresetMessage({
        type: 'error',
        text: `동기화 검증 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsVerifyingSync(false);
    }
  };

  const handleSaveCustomPreset = (preset: CustomPreset) => {
    saveCustomPreset(preset);
    setCustomPresets(getCustomPresets());
    setPresetMessage({ type: 'success', text: `프리셋 "${preset.name}"이 저장되었습니다.` });
  };

  const handleDeleteCustomPreset = (id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(getCustomPresets());
    setPresetMessage({ type: 'success', text: '프리셋이 삭제되었습니다.' });
  };

  const handleExportPresets = () => exportCustomPresets();
  const handleImportPresets = (json: string) => {
    importCustomPresets(json);
    setCustomPresets(getCustomPresets());
  };

  return {
    stamina,
    minerals,
    handleStaminaUpdate,
    handleMineralsUpdate,
    isAdminMode,
    toggleAdminMode,
    infiniteStamina,
    infiniteMinerals,
    infiniteTime,
    setInfiniteStamina,
    setInfiniteMinerals,
    setInfiniteTime,
    isUpdating,
    isApplyingPreset,
    presetMessage,
    setPresetMessage,
    presetHistories,
    handlePresetApply,
    handleClearHistory,
    syncResult,
    isVerifyingSync,
    handleVerifySync,
    customPresets,
    handleSaveCustomPreset,
    handleDeleteCustomPreset,
    handleExportPresets,
    handleImportPresets,
    debugUserInfo,
    debugPresets,
  };
}
