import { useCallback, useEffect } from 'react';
import { useDebugStore } from '../stores/useDebugStore';
import { useUserStore } from '../stores/useUserStore';

/**
 * 전역 디버그 단축키 훅
 * 모든 페이지에서 작동하며, 개발 환경에서만 활성화됩니다.
 *
 * 단축키:
 * - ` (백틱): Simple Dev (스태미너/미네랄 즉시 획득)
 * - Ctrl+` / Cmd+`: Debug Panel 토글
 * - +/=: 선택된 리소스 증가 (디버그 패널 활성 시)
 * - -/_: 선택된 리소스 감소 (디버그 패널 활성 시)
 */
export function useDebugShortcuts() {
  const { isAdminMode, selectedResource, toggleDebugPanel, setSelectedResource } = useDebugStore();

  const { stamina, minerals, debugSetStamina, debugSetMinerals } = useUserStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Level 1: 백틱(`) 단독 키: Simple Dev (스태미너/미네랄 즉시 충전)
      if (e.key === '`' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        // 스태미너 가득 채우고 minerals 1000 추가
        debugSetStamina(5);
        debugSetMinerals(minerals + 1000);
        console.log('[DEBUG] Simple Dev triggered: Stamina=5, Minerals+=1000');
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
          debugSetMinerals(minerals + 100);
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
          const delta = -100;
          const currentMinerals = minerals;
          if (currentMinerals + delta < 0) {
            console.warn('[Debug] Cannot reduce minerals below 0');
            return;
          }
          debugSetMinerals(currentMinerals + delta);
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
      toggleDebugPanel,
      setSelectedResource,
      debugSetStamina,
      debugSetMinerals,
    ]
  );

  useEffect(() => {
    // 개발 환경에서만 활성화
    if (!import.meta.env.DEV) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
