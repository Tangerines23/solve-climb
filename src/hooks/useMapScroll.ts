import { useEffect, RefObject } from 'react';
import { MAP_LAYOUT } from '@/constants/stages';

export function useMapScroll(containerRef: RefObject<HTMLElement | null>, levelsCount: number) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (container.getAttribute('data-auto-scrolling') === 'true') {
        return;
      }

      const { FIXED_MAX_LEVELS, NODE_SPACING, LIST_DISTANCE, SCROLL_OFFSET } = MAP_LAYOUT;
      const clipOffset = (FIXED_MAX_LEVELS - levelsCount) * NODE_SPACING;

      if (clipOffset > 0 && e.touches.length > 0) {
        const containerWidth = container.clientWidth || MAP_LAYOUT.SVG_WIDTH;
        const scale = containerWidth / MAP_LAYOUT.SVG_WIDTH;

        const lastNodeY = LIST_DISTANCE;
        const firstNodeY = lastNodeY + (FIXED_MAX_LEVELS - 1) * NODE_SPACING;
        const svgHeight = firstNodeY + 100;

        const svgYOffset = svgHeight * (1 - scale);
        const minScrollTop = SCROLL_OFFSET + svgYOffset + clipOffset * scale;

        const currentTouchY = e.touches[0].clientY;
        const isScrollingUp = currentTouchY > startTouchY;

        if (isScrollingUp && container.scrollTop <= minScrollTop + 1) {
          container.scrollTop = minScrollTop;
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (container.getAttribute('data-auto-scrolling') === 'true') {
        return;
      }

      const { FIXED_MAX_LEVELS, NODE_SPACING, LIST_DISTANCE, SCROLL_OFFSET } = MAP_LAYOUT;
      const clipOffset = (FIXED_MAX_LEVELS - levelsCount) * NODE_SPACING;

      if (clipOffset > 0) {
        const containerWidth = container.clientWidth || MAP_LAYOUT.SVG_WIDTH;
        const scale = containerWidth / MAP_LAYOUT.SVG_WIDTH;

        const lastNodeY = LIST_DISTANCE;
        const firstNodeY = lastNodeY + (FIXED_MAX_LEVELS - 1) * NODE_SPACING;
        const svgHeight = firstNodeY + 100;

        const svgYOffset = svgHeight * (1 - scale);
        const minScrollTop = SCROLL_OFFSET + svgYOffset + clipOffset * scale;

        const isScrollingUp = e.deltaY < 0;

        if (isScrollingUp && container.scrollTop <= minScrollTop + 1) {
          container.scrollTop = minScrollTop;
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, levelsCount]);
}
