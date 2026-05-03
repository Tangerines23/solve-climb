import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useMyPageStats } from './useMyPageStats';
import { useUserStore } from '../stores/useUserStore';
import { storageService, STORAGE_KEYS } from '../services';
import type { DebugSnapshot } from '../types/storage';
import { STATUS_TYPES, UI_MESSAGES } from '../constants/ui';
import { APP_CONFIG } from '../config/app';

export interface DataResetDebugBridge {
  stats: any;
  isResetting: boolean;
  message: { type: string; text: string } | null;
  isDeleting: boolean;
  isResettingProgress: boolean;
  executeResetProfile: (resetType: 'all' | 'score' | 'minerals' | 'tier') => Promise<void>;
  handleExportData: () => void;
  handleImportData: () => void;
  handleSaveSnapshot: () => void;
  handleRestoreSnapshot: () => Promise<void>;
  executeDeleteRecent: (count: number) => Promise<void>;
  executeDeleteAll: () => Promise<void>;
  executeDeleteByLevel: (level: number) => Promise<void>;
  executeResetLevelProgress: (category: string, subject: string) => Promise<void>;
  setMessage: (message: { type: string; text: string } | null) => void;
  getAvailableCategories: () => { id: string; name: string }[];
  getSubjectsForCategory: (category: string) => string[];
}

export function useDataResetDebugBridge(): DataResetDebugBridge {
  const { stats, refetch } = useMyPageStats();
  const { fetchUserData } = useUserStore();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  const executeResetProfile = async (resetType: 'all' | 'score' | 'minerals' | 'tier') => {
    try {
      setIsResetting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_reset_profile', {
        p_user_id: user.id,
        p_reset_type: resetType,
      });

      if (error) throw error;

      setMessage({ type: STATUS_TYPES.SUCCESS, text: '프로필이 초기화되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: STATUS_TYPES.ERROR,
        text: `초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solve-climb-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: STATUS_TYPES.SUCCESS, text: '데이터가 내보내졌습니다.' });
    } catch (err) {
      setMessage({
        type: STATUS_TYPES.ERROR,
        text: `내보내기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setIsResetting(true);
          setMessage(null);

          const data = JSON.parse(event.target?.result as string);

          if (!data.stats) {
            setMessage({ type: STATUS_TYPES.ERROR, text: '유효하지 않은 데이터 형식입니다.' });
            setIsResetting(false);
            return;
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
            setIsResetting(false);
            return;
          }
          const user = session.user;

          const updatePromises: Promise<unknown>[] = [];

          if (data.stats.totalMasteryScore !== undefined) {
            updatePromises.push(
              supabase.rpc('debug_set_mastery_score', {
                p_user_id: user.id,
                p_score: data.stats.totalMasteryScore,
              }) as unknown as Promise<unknown>
            );
          }

          if (data.stats.currentTierLevel !== undefined && data.stats.currentTierLevel !== null) {
            updatePromises.push(
              supabase.rpc('debug_set_tier', {
                p_user_id: user.id,
                p_level: data.stats.currentTierLevel,
              }) as unknown as Promise<unknown>
            );
          }

          const results = await Promise.allSettled(updatePromises);

          const errors = results.filter((r) => r.status === 'rejected');
          if (errors.length > 0) {
            const errorMessages = errors
              .map((e) => (e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''))
              .join(', ');
            setMessage({ type: 'error', text: `일부 데이터 적용 실패: ${errorMessages}` });
          } else {
            setMessage({ type: STATUS_TYPES.SUCCESS, text: '데이터가 가져와져 적용되었습니다.' });
            await Promise.all([refetch(), fetchUserData()]);
          }
        } catch (err) {
          setMessage({
            type: STATUS_TYPES.ERROR,
            text: `가져오기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
          });
        } finally {
          setIsResetting(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveSnapshot = () => {
    try {
      const snapshot = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      storageService.set(STORAGE_KEYS.DEBUG_SNAPSHOT, snapshot);
      setMessage({ type: STATUS_TYPES.SUCCESS, text: '스냅샷이 저장되었습니다.' });
    } catch (err) {
      setMessage({
        type: STATUS_TYPES.ERROR,
        text: `스냅샷 저장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  const handleRestoreSnapshot = async () => {
    try {
      setIsResetting(true);
      setMessage(null);

      const snapshot = storageService.get<DebugSnapshot>(STORAGE_KEYS.DEBUG_SNAPSHOT);
      if (!snapshot) {
        setMessage({ type: STATUS_TYPES.ERROR, text: '저장된 스냅샷이 없습니다.' });
        setIsResetting(false);
        return;
      }

      if (!snapshot.stats) {
        setMessage({ type: STATUS_TYPES.ERROR, text: '유효하지 않은 스냅샷 형식입니다.' });
        setIsResetting(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        setIsResetting(false);
        return;
      }
      const user = session.user;

      const updatePromises: Promise<unknown>[] = [];

      if (snapshot.stats.totalMasteryScore !== undefined) {
        updatePromises.push(
          supabase.rpc('debug_set_mastery_score', {
            p_user_id: user.id,
            p_score: snapshot.stats.totalMasteryScore,
          }) as unknown as Promise<unknown>
        );
      }

      if (
        snapshot.stats.currentTierLevel !== undefined &&
        snapshot.stats.currentTierLevel !== null
      ) {
        updatePromises.push(
          supabase.rpc('debug_set_tier', {
            p_user_id: user.id,
            p_level: snapshot.stats.currentTierLevel,
          }) as unknown as Promise<unknown>
        );
      }

      const results = await Promise.allSettled(updatePromises);

      const errors = results.filter((r) => r.status === 'rejected');
      if (errors.length > 0) {
        const errorMessages = errors
          .map((e) => (e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''))
          .join(', ');
        setMessage({ type: STATUS_TYPES.ERROR, text: `일부 데이터 복원 실패: ${errorMessages}` });
      } else {
        setMessage({ type: STATUS_TYPES.SUCCESS, text: '스냅샷이 복원되었습니다.' });
        await Promise.all([refetch(), fetchUserData()]);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `스냅샷 복원 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const executeDeleteRecent = async (count: number) => {
    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        return;
      }
      const user = session.user;

      const { data, error } = await supabase.rpc('debug_clear_game_records', {
        p_user_id: user.id,
        p_count: count,
      });

      if (error) throw error;

      const deletedCount = (data as { deleted_sessions?: number })?.deleted_sessions || 0;
      setMessage({ type: 'success', text: `${deletedCount}개의 게임 기록이 삭제되었습니다.` });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const executeDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_clear_game_records', {
        p_user_id: user.id,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '모든 게임 기록이 삭제되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const executeDeleteByLevel = async (level: number) => {
    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_clear_game_records', {
        p_user_id: user.id,
        p_level: level,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `레벨 ${level}의 게임 기록이 삭제되었습니다.` });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const executeResetLevelProgress = async (category: string, subject: string) => {
    try {
      setIsResettingProgress(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS_TYPES.ERROR, text: UI_MESSAGES.LOGIN_REQUIRED });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_reset_level_progress', {
        p_user_id: user.id,
        p_category_id: category,
        p_subject_id: subject,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '레벨 진행도가 초기화되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: STATUS_TYPES.ERROR,
        text: `초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResettingProgress(false);
    }
  };

  const getAvailableCategories = useCallback(() => {
    return Object.entries(APP_CONFIG.CATEGORY_MAP).map(([id, name]) => ({ id, name }));
  }, []);

  const getSubjectsForCategory = useCallback((category: string) => {
    const subTopics = APP_CONFIG.SUB_TOPICS[category as keyof typeof APP_CONFIG.SUB_TOPICS];
    if (!subTopics) return [];
    return subTopics.map((topic) => topic.id);
  }, []);

  return {
    stats,
    isResetting,
    message,
    isDeleting,
    isResettingProgress,
    executeResetProfile,
    handleExportData,
    handleImportData,
    handleSaveSnapshot,
    handleRestoreSnapshot,
    executeDeleteRecent,
    executeDeleteAll,
    executeDeleteByLevel,
    executeResetLevelProgress,
    setMessage,
    getAvailableCategories,
    getSubjectsForCategory,
  };
}
