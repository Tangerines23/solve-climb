import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { verifySync, type SyncResult } from '../utils/debugSync';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export interface BadgeDebugBridge {
  badgeDefinitions: BadgeDefinition[];
  userBadges: Set<string>;
  isLoading: boolean;
  isUpdating: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  isVerifyingSync: boolean;
  syncResult: SyncResult | null;
  earnedBadges: BadgeDefinition[];
  selectedBadgeId: string;
  toastMessage: string;
  isToastOpen: boolean;
  setSelectedBadgeId: (id: string) => void;
  setIsToastOpen: (isOpen: boolean) => void;
  loadBadges: () => Promise<void>;
  handleBadgeToggle: (badgeId: string) => Promise<void>;
  handleResetAllBadges: () => Promise<void>;
  handleSeedBadges: () => Promise<void>;
  handleVerifySync: () => Promise<void>;
  handleShowBadgeNotification: () => void;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
}

export function useBadgeDebugBridge(): BadgeDebugBridge {
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isVerifyingSync, setIsVerifyingSync] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // 뱃지 알림 테스트 상태
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // 획득한 뱃지 목록 (earnedBadges) - 파생 상태
  const earnedBadges = badgeDefinitions.filter((badge) => userBadges.has(badge.id));

  const loadBadges = useCallback(async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // 뱃지 정의 조회
      const { data: definitions, error: defError } = await supabase
        .from('badge_definitions')
        .select('id, name, description, emoji')
        .order('id');

      if (defError) throw defError;
      setBadgeDefinitions(definitions || []);

      // 사용자 뱃지 조회
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      setUserBadges(new Set(badges?.map((b) => b.badge_id) || []));
    } catch (err) {
      setMessage({
        type: 'error',
        text: `뱃지 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleBadgeToggle = async (badgeId: string) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const isEarned = userBadges.has(badgeId);

      if (isEarned) {
        // 뱃지 제거 (RPC 함수 사용)
        const { data, error } = await supabase.rpc('debug_remove_badge', {
          p_user_id: user.id,
          p_badge_id: badgeId,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || '뱃지 제거 실패');

        setUserBadges((prev) => {
          const next = new Set(prev);
          next.delete(badgeId);
          return next;
        });
        setMessage({ type: 'success', text: '뱃지가 제거되었습니다.' });
      } else {
        // 뱃지 부여
        const { data, error } = await supabase.rpc('debug_grant_badge', {
          p_user_id: user.id,
          p_badge_id: badgeId,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || '뱃지 부여 실패');

        setUserBadges((prev) => new Set([...prev, badgeId]));
        setMessage({ type: 'success', text: '뱃지가 부여되었습니다.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `뱃지 조작 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetAllBadges = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase.from('user_badges').delete().eq('user_id', user.id);

      if (error) throw error;
      setUserBadges(new Set());
      setMessage({ type: 'success', text: '모든 뱃지가 제거되었습니다.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `뱃지 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSeedBadges = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { BADGE_DEFINITIONS } = await import('../constants/badges');

      // theme_id가 required이므로, 임의의 유효한 theme_id 하나를 가져옴
      const { data: themes } = await supabase
        .from('theme_mapping')
        .select('theme_id')
        .limit(1);

      const defaultThemeId = themes?.[0]?.theme_id;

      if (!defaultThemeId) {
        throw new Error('유효한 Theme ID를 찾을 수 없습니다. (theme_mapping 확인 필요)');
      }

      // RPC를 통한 일괄 설치 (권한 문제 해결)
      const { error } = await supabase.rpc('debug_seed_badge_definitions', {
        p_badges: BADGE_DEFINITIONS.map((def) => ({
          id: def.id,
          name: def.name,
          description: def.description,
          emoji: def.emoji,
          theme_id: defaultThemeId,
        })),
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '기본 뱃지 설치 완료!' });
      loadBadges(); // Reload list
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: `뱃지 설치 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
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
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const result = await verifySync(user.id);
      setSyncResult(result);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `동기화 검증 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsVerifyingSync(false);
    }
  };

  const handleShowBadgeNotification = () => {
    if (!selectedBadgeId) return;

    const badge = badgeDefinitions.find((b) => b.id === selectedBadgeId);
    if (badge) {
      const badgeEmoji = badge.emoji || '🎖️';
      setToastMessage(`${badgeEmoji} ${badge.name} 뱃지를 획득했습니다!`);
      setIsToastOpen(true);
    }
  };

  return {
    badgeDefinitions,
    userBadges,
    isLoading,
    isUpdating,
    message,
    isVerifyingSync,
    syncResult,
    earnedBadges,
    selectedBadgeId,
    toastMessage,
    isToastOpen,
    setSelectedBadgeId,
    setIsToastOpen,
    loadBadges,
    handleBadgeToggle,
    handleResetAllBadges,
    handleSeedBadges,
    handleVerifySync,
    handleShowBadgeNotification,
    setMessage,
  };
}
