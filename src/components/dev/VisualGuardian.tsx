import { useEffect } from 'react';

/**
 * 🛡️ Visual Guardian (시각적 감시자)
 *
 * 개발 모드에서 UI 레이아웃 깨짐(Overflow)을 실시간으로 감지하여 시각화합니다.
 * - 텍스트가 박스를 뚫고 나가는 경우 (scrollHeight > clientHeight)
 * - 가로 스크롤이 의도치 않게 생기는 경우 (scrollWidth > clientWidth)
 *
 * 감지된 요소에는 빨간색 점선 테두리가 표시됩니다.
 */
export function VisualGuardian() {
  useEffect(() => {
    // 프로덕션이나 테스트 환경에서는 실행하지 않음
    if (!import.meta.env.DEV) return;

    console.log('👁️ Visual Guardian is watching against overflows...');

    const scanInterval = setInterval(() => {
      const allElements = document.querySelectorAll<HTMLElement>('*');

      allElements.forEach((el) => {
        // SVG, Script, Style 등 제외
        if (
          ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'HEAD', 'META', 'TITLE', 'LINK'].includes(el.tagName)
        )
          return;

        // 의도된 스크롤(overflow: auto/scroll)은 무시
        const style = window.getComputedStyle(el);
        if (
          ['auto', 'scroll'].includes(style.overflow) ||
          ['auto', 'scroll'].includes(style.overflowX) ||
          ['auto', 'scroll'].includes(style.overflowY)
        ) {
          return;
        }

        // 1. 세로 넘침 감지
        // (약간의 오차 허용: 1px)
        const isVerticalOverflow = el.scrollHeight > el.clientHeight + 1;

        // 2. 가로 넘침 감지
        const isHorizontalOverflow = el.scrollWidth > el.clientWidth + 1;

        if (isVerticalOverflow || isHorizontalOverflow) {
          // 이미 감지된 경우 패스
          if (el.dataset.vgOverflow) return;

          // 시각적 표시
          el.dataset.vgOverflow = 'true';
          el.style.outline = '2px dashed var(--color-error)';
          el.style.outlineOffset = '-2px';

          // 툴팁 효과 (title 속성 활용)
          const originalTitle = el.title;
          el.title = `⚠️ Overflow Detected! (${isVerticalOverflow ? 'Vertical' : ''} ${isHorizontalOverflow ? 'Horizontal' : ''})`;

          console.warn('🚨 [Visual Guardian] Overflow detected:', el, {
            scroll: [el.scrollWidth, el.scrollHeight],
            client: [el.clientWidth, el.clientHeight],
          });

          // 디버깅 편의를 위해 클릭 시 로그 출력 이벤트 추가
          el.addEventListener(
            'click',
            (e) => {
              if (e.altKey) {
                // Alt+Click 시 스타일 초기화
                e.stopPropagation();
                el.style.outline = '';
                delete el.dataset.vgOverflow;
                el.title = originalTitle;
                console.log('✅ Visual Guardian reset for:', el);
              }
            },
            { once: true }
          );
        }
      });
    }, 2000); // 2초마다 스캔 (성능 부하 고려)

    return () => clearInterval(scanInterval);
  }, []);

  return null; // 화면에 직접 렌더링하지 않음 (Ghost Component)
}
