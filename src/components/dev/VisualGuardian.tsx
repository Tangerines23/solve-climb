import { useEffect } from 'react';

/** E2E/개발용 window 확장 타입 */
interface WindowWithGuardian extends Window {
  __ENABLE_VISUAL_GUARDIAN__?: boolean;
  isPlaywrightLocal?: boolean;
  __LAYOUT_ERRORS__?: Array<{
    element: string;
    className: string;
    path: string;
    error: string;
    details?: { scroll: number[]; client: number[] };
  }>;
  __LAYOUT_IGNORED__?: Array<{
    element: string;
    className: string;
    reason: string;
    details: { scroll: number[]; client: number[] };
  }>;
  __VG_INTENSIVE_MODE__?: boolean;
}

/**
 * 🛡️ Visual Guardian (시각적 감시자)
 *
 * 개발 모드에서 UI 레이아웃 깨짐(Overflow)을 실시간으로 감지하여 시각화합니다.
 * - 텍스트가 박스를 뚫고 나가는 경우 (scrollHeight > clientHeight)
 * - 가로 스크롤이 의도치 않게 생기는 경우 (scrollWidth > clientWidth)
 *
 * 감지된 요소에는 빨간색 점선 테두리가 표시됩니다.
 *
 * ## 의도적 무시(제외) 구분
 * - **자동 제외**: overflow:auto/scroll, text-overflow:ellipsis, .debug-panel-overlay
 * - **명시적 제외**: 요소 또는 조상에 `data-vg-ignore="true"`를 붙이면 해당 영역은
 *   overflow 검사에서 제외됩니다.
 *
 * ## 실수/오류 vs 고쳐야 할 것 vs 의도적
 * VG는 이걸 자동 구분하지 않습니다. "실수/오류"면 CSS로 수정, "의도적 허용"이면
 * data-vg-ignore 사용. 의도한 것 중에도 오류가 있을 수 있으므로 data-vg-ignore는
 * "VG 알림만 끄기"일 뿐 "오류 아님" 보장이 아닙니다.
 */
export function VisualGuardian() {
  useEffect(() => {
    const win = window as WindowWithGuardian;
    // 프로덕션, CI, 또는 자동화 환경에서는 기본적으로 실행하지 않음
    // 단, window.__ENABLE_VISUAL_GUARDIAN__ 플래그가 있으면 강제 실행 (E2E 테스트용)
    const forceEnable = win.__ENABLE_VISUAL_GUARDIAN__;
    const isCI =
      !!import.meta.env.VITE_CI ||
      window.navigator.userAgent.includes('Playwright') ||
      !!win.isPlaywrightLocal;

    if (!forceEnable && (!import.meta.env.DEV || isCI)) return;

    // 자동화/검증 환경에서는 로그를 찍지 않음 (검증 도구가 __LAYOUT_ERRORS__만 읽어서 사용)
    const isAutomation = forceEnable || isCI;
    if (!isAutomation) {
      console.log('👁️ Visual Guardian is watching against overflows...');
    }

    // 자동화 테스트를 위한 에러 저장소 초기화
    if (!win.__LAYOUT_ERRORS__) {
      win.__LAYOUT_ERRORS__ = [];
    }

    const scanInterval = setInterval(
      () => {
        const allElements = document.querySelectorAll<HTMLElement>('*');

        allElements.forEach((el) => {
          // SVG, Script, Style 등 및 루트 요소, PRE 태그 제외 (SVG 자식은 className이 객체라 제외)
          if (
            [
              'SCRIPT',
              'STYLE',
              'SVG',
              'PATH',
              'HEAD',
              'META',
              'TITLE',
              'LINK',
              'HTML',
              'BODY',
              'PRE',
            ].includes(el.tagName) ||
            el.id === 'root' ||
            el.closest('svg')
          )
            return;

          // SVG 등에서 className이 객체(SVGAnimatedString)인 경우 대비
          const classStr =
            typeof el.className === 'string' ? el.className : (el.getAttribute?.('class') ?? '');

          // 의도된 스크롤(overflow: auto/scroll)은 무시
          const style = window.getComputedStyle(el);
          const isScrollable = (val: string) => val.includes('auto') || val.includes('scroll');

          // 1. 세로 넘침 감지 (서브픽셀/반올림 노이즈 무시: 0.5px 허용으로 VG 테스트 안정화)
          const threshold = 0.5;
          const isVerticalOverflow = el.scrollHeight > el.clientHeight + threshold;

          // 2. 가로 넘침 감지
          const isHorizontalOverflow = el.scrollWidth > el.clientWidth + threshold;

          if (
            isScrollable(style.overflow) ||
            isScrollable(style.overflowX) ||
            isScrollable(style.overflowY) ||
            style.textOverflow === 'ellipsis' ||
            el.classList.contains('under-development-toast-icon') ||
            el.closest('.debug-panel-overlay') || // 🐛 디버그 패널 제외
            el.closest('[data-vg-ignore]') // 🛡️ 명시적 제외 속성 지원
          ) {
            // 디버깅: 무시된 요소도 기록 (자동화 모드일 때만)
            if (isAutomation && (isVerticalOverflow || isHorizontalOverflow)) {
              (window as WindowWithGuardian).__LAYOUT_IGNORED__ =
                (window as WindowWithGuardian).__LAYOUT_IGNORED__ || [];
              (window as WindowWithGuardian).__LAYOUT_IGNORED__?.push({
                element: el.tagName,
                className: classStr,
                reason: isScrollable(style.overflow) ? 'overflow:auto' : 'ignored',
                details: {
                  scroll: [el.scrollWidth, el.scrollHeight],
                  client: [el.clientWidth, el.clientHeight],
                },
              });
            }
            return;
          }

          if (isVerticalOverflow || isHorizontalOverflow) {
            // 이미 감지된 경우 패스
            if (el.dataset.vgOverflow) return;

            // 시각적 표시
            el.dataset.vgOverflow = 'true';
            el.style.outline = '2px dashed var(--color-error)';
            el.style.outlineOffset = '-2px';

            // 툴팁 효과 (title 속성 활용)
            const originalTitle = el.title;
            const errorMsg = `Overflow Detected! (${isVerticalOverflow ? 'Vertical' : ''} ${isHorizontalOverflow ? 'Horizontal' : ''}) in <${el.tagName.toLowerCase()} class="${classStr}">`;
            el.title = `⚠️ ${errorMsg}`;

            // 자동화 테스트를 위한 상태 업데이트
            document.body.dataset.layoutError = 'true';
            (window as WindowWithGuardian).__LAYOUT_ERRORS__?.push({
              element: el.tagName,
              className: classStr,
              path:
                el.tagName.toLowerCase() + (classStr ? '.' + classStr.split(' ').join('.') : ''),
              error: errorMsg,
              details: {
                scroll: [el.scrollWidth, el.scrollHeight],
                client: [el.clientWidth, el.clientHeight],
              },
            });

            if (!isAutomation) {
              console.warn('🚨 [Visual Guardian]', errorMsg, {
                scroll: [el.scrollWidth, el.scrollHeight],
                client: [el.clientWidth, el.clientHeight],
              });
            }

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
                  if (!isAutomation) {
                    console.log('✅ Visual Guardian reset for:', el);
                  }
                }
              },
              { once: true }
            );
          }
        });
      },
      (window as WindowWithGuardian).__VG_INTENSIVE_MODE__ ? 100 : 1000
    ); // 🏁 고강도 모드에선 100ms, 일반 개발에선 1s 스캔

    return () => clearInterval(scanInterval);
  }, []);

  return null; // 화면에 직접 렌더링하지 않음 (Ghost Component)
}
