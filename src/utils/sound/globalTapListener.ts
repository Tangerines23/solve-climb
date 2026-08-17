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

  // 중복 리스너 등록 방지
  if (window.__globalTapListenerActive) {
    return () => {};
  }
  window.__globalTapListenerActive = true;

  let lastTapTime = 0;

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. 디버그 페이지/UI 실험실 경로 및 디버그 요소는 사운드 중복 방지를 위해 자동 탭 사운드 제외
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

    // 2. 뒤로가기, 취소, 닫기 버튼 및 모달 오버레이 감지
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
      if (playBackCallback) {
        playBackCallback();
      } else {
        playTapCallback();
      }
      return;
    }

    // 3. 버튼, 탭, 링크, 카드, 인풋 등 일반 인터랙티브 요소 감지
    const clickable = target.closest(
      'button, [role="button"], a, input, select, textarea, .clickable, .tab-item, .level-node, .category-card, .menu-item, .my-page-settings-item'
    );

    if (clickable) {
      playTapCallback();
    } else if (playEmptyTapCallback) {
      playEmptyTapCallback();
    }
  };

  document.addEventListener('click', handleClick, { capture: true, passive: true });

  return () => {
    window.__globalTapListenerActive = false;
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
