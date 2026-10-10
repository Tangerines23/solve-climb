import { audioContextManager } from './audioContext';

declare global {
  interface Window {
    __globalTapListenerActive?: boolean;
  }
}

export function setupGlobalTapListener(
  playTapCallback: () => void,
  playEmptyTapCallback?: () => void,
  playBackCallback?: () => void
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (window.__globalTapListenerActive) {
    return () => {};
  }
  window.__globalTapListenerActive = true;

  let lastTapTime = 0;

  const handleClick = (e: MouseEvent) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (audioContextManager.isBackground() || audioContextManager.isTerminatedState()) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    const pathname = window?.location?.pathname ?? '';
    const hash = window?.location?.hash ?? '';
    const search = window?.location?.search ?? '';

    if (pathname.startsWith('/debug') || hash.includes('/debug') || search.includes('debug')) {
      return;
    }

    if (
      target.closest('.keypad-key') ||
      target.closest('[data-no-tap-sound]') ||
      target.closest('.debug-page') ||
      target.closest('.debug-panel') ||
      target.closest('.notification-playground') ||
      target.closest('.debug-section') ||
      target.closest('.debug-overlay') ||
      target.closest('.debug-return-floater')
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTapTime <= 80) return;
    lastTapTime = now;

    const matchedBackSelector = target.closest(
      '.header-back-button, .topic-back-button, .back-button, .btn-back, [aria-label*="뒤로"], [aria-label*="취소"], [aria-label*="닫기"], [data-action="back"], [data-action="cancel"], [data-action="close"], .cancel-button, .modal-close-button, .close-button, .btn-cancel, .btn-close, .modal-overlay, .bottom-sheet-overlay, .gt-checkbox-label'
    );

    const textContent = (target.textContent || '').trim();
    const hasBackText =
      (textContent.includes('뒤로') ||
        textContent.includes('취소') ||
        textContent.includes('닫기')) &&
      textContent.length <= 15;

    const isBackOrCancel = Boolean(matchedBackSelector || hasBackText);

    if (isBackOrCancel) {
      const callback = playBackCallback ?? playTapCallback;
      callback();
      return;
    }

    const clickable = target.closest(
      'button, [role="button"], a, input, select, textarea, .clickable, .tab-item, .level-node, .category-card, .menu-item, .my-page-settings-item'
    );

    if (clickable) {
      playTapCallback();
      return;
    }

    if (playEmptyTapCallback) {
      playEmptyTapCallback();
    }
  };

  document.addEventListener('click', handleClick, { capture: true, passive: true });

  return () => {
    window.__globalTapListenerActive = false;
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
