import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useUserStore } from '@/features/auth';
import { useDebugStore } from '../stores/useDebugStore';
import { useMyPageStats } from '@/features/mypage';
import {
  getPresetHistories,
  clearPresetHistory,
  DEBUG_PRESETS as debugPresets,
} from '../utils/debugPresets';
import { type CustomPreset, type DebugPreset, type PresetHistory } from '../types/debug';
import { useDebugActions } from './useDebugActions';
import { verifySync, type SyncResult } from '../utils/debugSync';
import { STATUS, type StatusType } from '@/constants/status';

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
    type: StatusType;
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
      setPresetMessage({ type: STATUS.SUCCESS, text: '?꾨━?뗭씠 ?곸슜?섏뿀?듬땲??' });
      setPresetHistories(getPresetHistories());
    } catch (err) {
      setPresetMessage({
        type: STATUS.ERROR,
        text: `?꾨━???곸슜 ?ㅽ뙣: ${err instanceof Error ? err.message : '?????녿뒗 ?ㅻ쪟'}`,
      });
      setPresetHistories(getPresetHistories());
    } finally {
      setIsApplyingPreset(false);
    }
  };

  const handleClearHistory = () => {
    clearPresetHistory();
    setPresetHistories([]);
    setPresetMessage({ type: STATUS.SUCCESS, text: '?덉뒪?좊━媛 ??젣?섏뿀?듬땲??' });
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
        setPresetMessage({ type: STATUS.ERROR, text: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' });
        return;
      }
      const result = await verifySync(session.user.id);
      setSyncResult(result);
      setPresetMessage({ type: STATUS.SUCCESS, text: '?숆린??寃利앹씠 ?꾨즺?섏뿀?듬땲??' });
    } catch (err) {
      setPresetMessage({
        type: STATUS.ERROR,
        text: `?숆린??寃利??ㅽ뙣: ${err instanceof Error ? err.message : '?????녿뒗 ?ㅻ쪟'}`,
      });
    } finally {
      setIsVerifyingSync(false);
    }
  };

  const handleSaveCustomPreset = (preset: CustomPreset) => {
    saveCustomPreset(preset);
    setCustomPresets(getCustomPresets());
    setPresetMessage({ type: STATUS.SUCCESS, text: `?꾨━??"${preset.name}"????λ릺?덉뒿?덈떎.` });
  };

  const handleDeleteCustomPreset = (id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(getCustomPresets());
    setPresetMessage({ type: STATUS.SUCCESS, text: '?꾨━?뗭씠 ??젣?섏뿀?듬땲??' });
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
