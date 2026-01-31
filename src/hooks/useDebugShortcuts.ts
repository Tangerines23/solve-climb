import { useCallback, useEffect } from 'react';
import { useDebugStore } from '../stores/useDebugStore';
import { useUserStore } from '../stores/useUserStore';
import { supabase } from '../utils/supabaseClient';

/**
 * 전역 디버그 단축키 훅
 * 모든 페이지에서 작동하며, 개발 환경에서만 활성화됩니다.
 *
 * 단축키:
 * - ` (백틱): Admin Mode 토글
 * - Ctrl+` / Cmd+`: Debug Panel 토글
 * - +/=: 선택된 리소스 증가
 * - -/_: 선택된 리소스 감소
 */
export function useDebugShortcuts() {
  const { isAdminMode, selectedResource, toggleAdminMode, toggleDebugPanel, setSelectedResource } =
    useDebugStore();

  const { stamina, minerals, debugSetStamina, rewardMinerals, fetchUserData } = useUserStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Level 1: 백틱(`) 단독 키: Admin Mode 토글
      if (e.key === '`' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        toggleAdminMode();
        return;
      }

      // Level 2: Ctrl + ` (백틱): 디버그 패널 열기/닫기
      if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleDebugPanel();
        return;
      }

      // Level 1: 리소스 조작 (Admin Mode 활성화 시)
      if (!isAdminMode || !selectedResource) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (selectedResource === 'stamina') {
          debugSetStamina(stamina + 1);
        }
        if (selectedResource === 'minerals') {
          rewardMinerals(100);
        }
        if (selectedResource === 'items') {
          const { debugAddItems } = useUserStore.getState();
          debugAddItems();
        }
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (selectedResource === 'stamina') {
          debugSetStamina(Math.max(0, stamina - 1));
        }
        if (selectedResource === 'minerals') {
          // 음수 처리를 위해 RPC 직접 호출
          const delta = -100;
          const currentMinerals = minerals;
          if (currentMinerals + delta < 0) {
            console.warn('[Debug] Cannot reduce minerals below 0');
            return;
          }
          supabase.rpc('add_minerals', { p_amount: delta }).then(({ error }) => {
            if (error) console.error(error);
            else fetchUserData();
          });
        }
        if (selectedResource === 'items') {
          const { debugRemoveItems } = useUserStore.getState();
          debugRemoveItems();
        }
      }

      // ESC: 선택 해제
      if (e.key === 'Escape') {
        setSelectedResource(null);
      }
    },
    [
      isAdminMode,
      selectedResource,
      stamina,
      minerals,
      toggleAdminMode,
      toggleDebugPanel,
      setSelectedResource,
      debugSetStamina,
      rewardMinerals,
      fetchUserData,
    ]
  );

  useEffect(() => {
    // 개발 환경에서만 활성화
    if (!import.meta.env.DEV) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
