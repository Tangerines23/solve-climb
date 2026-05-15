import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

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
  __DESIGN_VIOLATIONS__?: Array<{
    element: string;
    className: string;
    path: string;
    property: string;
    value: string;
    type: 'color' | 'spacing' | 'typography' | 'radius';
  }>;
}

/**
 * 🛡️ Visual Guardian Excellence Suite
 */
export function VisualGuardian() {
  const [counts, setCounts] = useState({ layout: 0, design: 0 });
  const [lastScan, setLastScan] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const violationElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef<number>(-1);

  const extractTokens = useCallback(() => {
    const colors = new Set<string>();
    const spacings = new Set<string>();
    const typography = new Set<string>();
    const radius = new Set<string>();

    // 기본 허용 값
    spacings.add('0px');
    spacings.add('auto');
    spacings.add('0');
    typography.add('inherit');
    typography.add('initial');
    typography.add('normal');
    radius.add('0px');
    radius.add('0');
    radius.add('50%');
    radius.add('100%');

    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    const processedVars = new Set<string>();

    // 헬퍼: 변수값을 픽셀로 변환
    const tempEl = document.createElement('div');
    tempEl.style.display = 'none';
    document.body.appendChild(tempEl);

    const getPixelValue = (prop: string, value: string) => {
      if (value.includes('var(')) return value; // 중첩 변수는 나중에 처리되거나 건너뜀
      if (value.endsWith('px')) return value;
      if (value.endsWith('rem') || value.endsWith('em') || value.includes('calc')) {
        try {
          tempEl.style.setProperty(prop, value);
          const computed = getComputedStyle(tempEl).getPropertyValue(prop);
          return computed;
        } catch (e) {
          return value;
        }
      }
      return value;
    };

    const processVarsFromRule = (rule: CSSStyleRule) => {
      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style[i];
        if (prop.startsWith('--') && !processedVars.has(prop)) {
          processedVars.add(prop);
          const rawVal =
            rootStyle.getPropertyValue(prop).trim() || bodyStyle.getPropertyValue(prop).trim();
          if (rawVal) {
            if (
              prop.includes('spacing') ||
              prop.includes('gap') ||
              prop.includes('margin') ||
              prop.includes('padding')
            ) {
              const pxVal = getPixelValue('margin', rawVal);
              spacings.add(pxVal);
              if (pxVal.endsWith('px')) spacings.add(pxVal.replace('px', ''));
            } else if (prop.includes('font-size')) {
              const pxVal = getPixelValue('font-size', rawVal);
              typography.add(pxVal);
              if (pxVal.endsWith('px')) typography.add(pxVal.replace('px', ''));
            } else if (prop.includes('line-height')) {
              const pxVal = getPixelValue('line-height', rawVal);
              typography.add(pxVal);
              if (pxVal.endsWith('px')) typography.add(pxVal.replace('px', ''));
            } else if (prop.includes('rounded') || prop.includes('radius')) {
              const pxVal = getPixelValue('border-radius', rawVal);
              radius.add(pxVal);
              if (pxVal.endsWith('px')) radius.add(pxVal.replace('px', ''));
            } else if (
              rawVal.startsWith('#') ||
              rawVal.startsWith('rgb') ||
              rawVal.startsWith('hsl') ||
              rawVal.startsWith('rgba')
            ) {
              colors.add(rawVal);
            }
          }
        }
      }
    };

    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            if (
              rule instanceof CSSStyleRule &&
              (rule.selectorText === ':root' || rule.selectorText === 'body')
            ) {
              processVarsFromRule(rule);
            }
          }
        } catch (e) {
          // Cross-origin stylesheet access may fail, ignore it
        }
      }
    } catch (e) {
      // General error during stylesheet scanning, ignore it
    }

    document.body.removeChild(tempEl);

    // 기본 브라우저 폰트 사이즈 (16px) 추가
    typography.add('16px');
    typography.add('16');

    const fallbackColors = [
      'rgb(249, 250, 251)',
      'rgb(242, 244, 246)',
      'rgb(229, 232, 235)',
      'rgb(209, 214, 219)',
      'rgb(176, 184, 193)',
      'rgb(139, 149, 161)',
      'rgb(107, 118, 132)',
      'rgb(78, 89, 104)',
      'rgb(51, 61, 75)',
      'rgb(25, 31, 40)',
      'rgb(232, 243, 255)',
      'rgb(201, 226, 255)',
      'rgb(144, 194, 255)',
      'rgb(100, 168, 255)',
      'rgb(69, 147, 252)',
      'rgb(49, 130, 246)',
      'rgb(34, 114, 235)',
      'rgb(27, 100, 218)',
      'rgb(25, 87, 194)',
      'rgb(25, 74, 166)',
      'rgb(255, 238, 238)',
      'rgb(255, 212, 214)',
      'rgb(246, 101, 112)',
      'rgb(240, 68, 82)',
      'rgb(228, 41, 57)',
      'rgb(3, 178, 108)',
      'rgb(255, 255, 255)',
      'rgb(76, 217, 100)',
      'rgb(255, 204, 0)',
      'rgb(79, 172, 254)',
      'rgb(250, 250, 252)',
      'rgb(226, 226, 226)',
      'rgb(190, 190, 192)',
      'rgb(155, 155, 155)',
      'rgb(18, 18, 18)',
      'rgb(0, 212, 179)',
      'rgb(0, 191, 165)',
      'rgb(0, 105, 92)',
      'rgb(0, 137, 123)',
      'rgb(255, 107, 107)',
      'rgb(220, 38, 38)',
      'rgb(192, 57, 43)',
      'rgb(211, 47, 47)',
      'rgb(255, 82, 82)',
      'rgb(167, 139, 250)',
      'rgb(0, 0, 0)',
      'rgb(30, 30, 30)',
      'rgb(44, 44, 44)',
      'rgb(60, 60, 60)',
      'rgb(76, 76, 76)',
      'rgb(160, 167, 177)',
      'rgb(204, 204, 204)',
      'rgb(187, 187, 187)',
      'rgb(136, 136, 136)',
      'rgb(33, 150, 243)',
      'rgb(156, 39, 176)',
      'rgb(139, 92, 246)',
      'rgb(244, 63, 94)',
      'rgb(255, 215, 0)',
      'rgb(240, 240, 240)',
      'rgba(30, 31, 35, 0.85)',
      'rgba(30, 31, 35, 0.6)',
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0.2)',
      'rgba(255, 255, 255, 0.05)',
      'rgba(0, 0, 0, 0.9)',
      'rgba(18, 18, 18, 0.9)',
      'rgba(0, 212, 179, 0.1)',
      'rgba(0, 212, 179, 0.3)',
      'rgba(0, 0, 0, 0.1)',
      'rgba(0, 0, 0, 0.2)',
      'rgba(0, 0, 0, 0.3)',
      'rgba(0, 0, 0, 0.4)',
      'rgba(0, 0, 0, 0.5)',
      'rgba(0, 0, 0, 0.6)',
      'rgba(0, 0, 0, 0.7)',
      'rgba(0, 0, 0, 0.8)',
      'rgba(255, 255, 255, 0.08)',
      'rgba(255, 255, 255, 0.15)',
      'rgba(255, 255, 255, 0.3)',
      'rgba(255, 61, 0, 0.4)',
      'rgba(255, 196, 0, 0.4)',
    ];
    fallbackColors.forEach((c) => colors.add(c));

    // Browser Default & Scale Exceptions
    typography.add('13.3333px');
    typography.add('13.3333');
    typography.add('13.3px');
    typography.add('13.3');
    typography.add('16.8px');
    typography.add('16.8'); // 1.2 * 14
    typography.add('19.2px');
    typography.add('19.2'); // 1.2 * 16
    typography.add('21.6px');
    typography.add('21.6'); // 1.35 * 16
    typography.add('24px');
    typography.add('24'); // 1.5 * 16
    typography.add('25.6px');
    typography.add('25.6'); // 1.6 * 16
    typography.add('28.8px');
    typography.add('28.8'); // 1.8 * 16
    typography.add('14.4px');
    typography.add('14.4'); // 0.9 * 16
    typography.add('22.4px');
    typography.add('22.4'); // 1.4 * 16 or 1.6 * 14
    typography.add('25.2px');
    typography.add('25.2'); // 1.4 * 18
    typography.add('13.28px');
    typography.add('13.28'); // h2 margin fallback

    spacings.add('13.28px');
    spacings.add('13.28');
    spacings.add('13.3333px');
    spacings.add('13.3333');
    spacings.add('0.83rem');
    spacings.add('0.83');
    spacings.add('16px');
    spacings.add('16');
    spacings.add('1.2px');
    spacings.add('1px');
    spacings.add('2px');
    spacings.add('6px');
    spacings.add('8px');
    return {
      colors: Array.from(colors),
      spacings: Array.from(spacings),
      typography: Array.from(typography),
      radius: Array.from(radius),
    };
  }, []);

  const tokens = useMemo(() => extractTokens(), [extractTokens]);

  const getSelector = (el: HTMLElement): string => {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/)[0];
      if (cls) return `.${cls}`;
    }
    return el.tagName.toLowerCase();
  };

  const scan = useCallback(() => {
    const win = window as WindowWithGuardian;
    win.__LAYOUT_ERRORS__ = [];
    win.__DESIGN_VIOLATIONS__ = [];
    violationElementsRef.current = [];

    const allElements = document.querySelectorAll('*');
    let layoutCount = 0;
    let designCount = 0;

    allElements.forEach((el) => {
      const element = el as HTMLElement;
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
        ].includes(element.tagName) ||
        element.id === 'root' ||
        element.closest('.vg-hud')
      )
        return;

      const classStr = typeof element.className === 'string' ? element.className : '';
      const path = getSelector(element);
      const style = window.getComputedStyle(element);

      const isElementVisible = (el: HTMLElement): boolean => {
        let current: HTMLElement | null = el;
        while (current) {
          const s = window.getComputedStyle(current);
          if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
          current = current.parentElement;
        }
        return true;
      };

      if (!isElementVisible(element)) return;

      const isIntensive = win.__VG_INTENSIVE_MODE__;

      let violationText = '';
      let violationType:
        | 'none'
        | 'layout'
        | 'color'
        | 'spacing'
        | 'typography'
        | 'radius'
        | 'multiple' = 'none';

      if (isIntensive) {
        const normalizeColor = (c: string) => c.replace(/\s+/g, '').toLowerCase();

        const checkColor = (prop: string) => {
          const val = style.getPropertyValue(prop);
          if (
            !val ||
            val === 'transparent' ||
            val === 'rgba(0, 0, 0, 0)' ||
            val === 'inherit' ||
            val === 'initial'
          )
            return;

          const normalizedVal = normalizeColor(val);
          const isAllowed = tokens.colors.some((c) => normalizeColor(c) === normalizedVal);

          if (!isAllowed) {
            designCount++;
            violationText += `[Color: ${prop}=${val}] `;
            violationType = violationType === 'none' ? 'color' : 'multiple';
            win.__DESIGN_VIOLATIONS__?.push({
              element: element.tagName,
              className: classStr,
              path,
              property: prop,
              value: val,
              type: 'color',
            });
          }
        };

        const checkSpacing = (prop: string) => {
          const val = style.getPropertyValue(prop);
          if (!val || val === 'auto' || val === 'normal') return;

          // Ignore large symmetrical horizontal margins (likely 'margin: auto' centering)
          if (prop === 'margin' || prop === 'margin-left' || prop === 'margin-right') {
            const mLeft = parseFloat(style.marginLeft);
            const mRight = parseFloat(style.marginRight);
            if (mLeft > 40 && Math.abs(mLeft - mRight) < 2) return;
          }

          const parts = val.split(/\s+/);
          const invalid = parts.some((p) => {
            if (p === '0' || p === '0px' || p === 'auto' || p.includes('%')) return false;
            const pNum = parseFloat(p);
            return !tokens.spacings.some((s) => {
              const sNum = parseFloat(s);
              return Math.abs(sNum - pNum) < 1.1; // Allow slight rounding
            });
          });

          if (invalid) {
            designCount++;
            violationText += `[Spacing: ${prop}=${val}] `;
            violationType = violationType === 'none' ? 'spacing' : 'multiple';
            win.__DESIGN_VIOLATIONS__?.push({
              element: element.tagName,
              className: classStr,
              path,
              property: prop,
              value: val,
              type: 'spacing',
            });
          }
        };

        const checkTypography = (prop: string) => {
          const val = style.getPropertyValue(prop);
          if (!val || val === 'normal' || val === '0px' || val === '0') return;

          const vNum = parseFloat(val);
          if (isNaN(vNum)) return;

          // 픽셀 값 오차 허용 (0.6px 내외)
          const isAllowed = tokens.typography.some((t) => {
            const tNum = parseFloat(t);
            return Math.abs(vNum - tNum) < 0.6;
          });

          if (!isAllowed) {
            designCount++;
            violationText += `[Typography: ${prop}=${val}] `;
            violationType = violationType === 'none' ? 'typography' : 'multiple';
            win.__DESIGN_VIOLATIONS__?.push({
              element: element.tagName,
              className: classStr,
              path,
              property: prop,
              value: val,
              type: 'typography',
            });
          }
        };

        const checkRadius = (prop: string) => {
          const val = style.getPropertyValue(prop);
          if (!val || val === '0px' || val === '0' || val === '50%' || val === '100%') return;
          const parts = val.split(/\s+/);
          const invalid = parts.some((p) => {
            const pNum = parseFloat(p);
            return !tokens.radius.some((r) => {
              const rNum = parseFloat(r);
              return Math.abs(pNum - rNum) < 0.6;
            });
          });
          if (invalid) {
            designCount++;
            violationText += `[Radius: ${prop}=${val}] `;
            violationType = violationType === 'none' ? 'radius' : 'multiple';
            win.__DESIGN_VIOLATIONS__?.push({
              element: element.tagName,
              className: classStr,
              path,
              property: prop,
              value: val,
              type: 'radius',
            });
          }
        };

        checkColor('color');
        checkColor('background-color');
        checkSpacing('margin');
        checkSpacing('padding');
        checkSpacing('gap');
        checkTypography('font-size');
        checkTypography('line-height');
        checkRadius('border-radius');
      }

      const threshold = 5.0; // Increased to handle dynamic content and layout scaling
      const isOverflow =
        element.scrollHeight > element.clientHeight + threshold ||
        element.scrollWidth > element.clientWidth + threshold;
      const isScrollable = (v: string) => v.includes('auto') || v.includes('scroll');
      const isActuallyOverflowing =
        isOverflow && !isScrollable(style.overflow) && !element.closest('[data-vg-ignore]');

      if (isActuallyOverflowing) {
        layoutCount++;
        violationType =
          violationType === 'none' || violationType === 'layout' ? 'layout' : 'multiple';
        const errorMsg = `Overflow!`;
        element.title = `⚠️ ${errorMsg} ${violationText}`;
        element.dataset.vgViolation = violationType;
        win.__LAYOUT_ERRORS__?.push({
          element: element.tagName,
          className: classStr,
          path,
          error: errorMsg,
        });
        violationElementsRef.current.push(element);
      } else if (violationText) {
        element.title = `🎨 Design: ${violationText}`;
        element.dataset.vgViolation = violationType;
        violationElementsRef.current.push(element);
      } else if (element.dataset.vgViolation) {
        delete element.dataset.vgViolation;
        element.title = '';
      }
    });

    setCounts({ layout: layoutCount, design: designCount });
    setLastScan(new Date().toLocaleTimeString());
  }, [tokens]);

  useEffect(() => {
    const win = window as WindowWithGuardian;
    if (import.meta.env.PROD && !win.__ENABLE_VISUAL_GUARDIAN__) return;
    const observer = new MutationObserver(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(scan, 200);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    scan();
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scan]);

  const cycleFocus = () => {
    const elements = violationElementsRef.current;
    if (elements.length === 0) return;
    currentFocusIndex.current = (currentFocusIndex.current + 1) % elements.length;
    const target = elements[currentFocusIndex.current];
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('🛡️ [VG] Focused on:', target, target.title);
  };

  const showHUD = !(window as any).isPlaywrightLocal && (counts.layout > 0 || counts.design > 0);

  return (
    <>
      <style>{`
        [data-vg-violation="layout"] { outline: 2px dashed #f04452 !important; outline-offset: -2px !important; } /* 고정값 허용 */
        [data-vg-violation="color"] { outline: 2px dashed #9c27b0 !important; outline-offset: -2px !important; } /* 고정값 허용 */
        [data-vg-violation="spacing"] { outline: 2px dashed #ff9800 !important; outline-offset: -2px !important; } /* 고정값 허용 */
        [data-vg-violation="typography"] { outline: 2px dashed #00bcd4 !important; outline-offset: -2px !important; } /* 고정값 허용 */
        [data-vg-violation="radius"] { outline: 2px dashed #4caf50 !important; outline-offset: -2px !important; } /* 고정값 허용 */
        [data-vg-violation="multiple"] { outline: 3px solid #f04452 !important; box-shadow: inset 0 0 0 2px #9c27b0 !important; } /* 고정값 허용 */
        /* 고정값 허용: 디버그 HUD 전용 스타일 */
        .vg-hud { position: fixed; bottom: var(--spacing-lg); right: var(--spacing-lg); z-index: 99999; display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm); pointer-events: auto; cursor: pointer; }
        .vg-hud-item { background: var(--adaptiveRed500); color: white; padding: var(--spacing-tiny) var(--spacing-md); border-radius: var(--rounded-sm); font-size: 11px; font-weight: bold; box-shadow: 0 4px 12px rgba(240,68,82,0.4); display: flex; align-items: center; gap: var(--spacing-tiny); }
        .vg-hud-design { background: #9c27b0; } /* 고정값 허용 */
      `}</style>
      {showHUD && (
        <div className="vg-hud" onClick={cycleFocus}>
          {counts.layout > 0 && <div className="vg-hud-item">🚨 Layout {counts.layout}</div>}
          {counts.design > 0 && (
            <div className="vg-hud-item vg-hud-design">🎨 Design {counts.design}</div>
          )}
          <div style={{ fontSize: '9px', color: 'var(--color-tier-base)' }}>
            Click to Focus Next • {lastScan}
          </div>
        </div>
      )}
    </>
  );
}
