import { useState, useRef, useCallback, useEffect } from 'react';
import type { ClimbLevelData } from '../utils/climbPathUtils';

export interface UseClimbScrollParams {
  levelData: ClimbLevelData[];
  targetLevelId: number;
  svgHeight: number;
  clipOffset: number;
  scrollOffset: number;
  svgWidth: number;
  isReady?: boolean;
  mountain?: string;
  world: string;
  category: string;
  totalLevels: number;
}

export interface UseClimbScrollReturn {
  currentLevelRef: React.RefObject<HTMLButtonElement | null>;
  isScrollPositioned: boolean;
  scrollToCurrentLevel: (behavior?: 'auto' | 'smooth') => void;
}

/**
 * [useClimbScroll]
 * 산악 맵 내에서 현재 도전/타겟 레벨 노드로의 정밀 뷰포트 스크롤 제어를 전담하는 커스텀 훅입니다.
 * (DOM 접근 캡슐화, 프레임 안정성 가드, 100% Zero-Else)
 */
export function useClimbScroll({
  levelData,
  targetLevelId,
  svgHeight,
  clipOffset,
  scrollOffset,
  svgWidth,
  isReady,
  mountain,
  world,
  category,
  totalLevels,
}: UseClimbScrollParams): UseClimbScrollReturn {
  const currentLevelRef = useRef<HTMLButtonElement | null>(null);
  const lastScrolledKeyRef = useRef<string>('');
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScrollPositioned, setIsScrollPositioned] = useState(false);

  const scrollToCurrentLevel = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      let layoutAttempts = 0;
      let nodeAttempts = 0;

      const executeScroll = () => {
        const node = currentLevelRef.current;

        // [노드 가드] 노드 엘리먼트 레프가 마운트될 때까지 최대 120프레임 대기
        if (!node) {
          if (nodeAttempts < 120) {
            nodeAttempts++;
            requestAnimationFrame(executeScroll);
            return;
          }
          setIsScrollPositioned(true);
          return;
        }

        const scrollContainer = node.closest('.map-area') as HTMLElement;
        if (!scrollContainer) {
          if (typeof node.scrollIntoView === 'function') {
            node.scrollIntoView({
              behavior: behavior === 'auto' ? 'auto' : 'smooth',
              block: 'center',
            });
          }
          setIsScrollPositioned(true);
          return;
        }

        const currentScrollHeight = scrollContainer.scrollHeight;
        const currentClientWidth = scrollContainer.clientWidth;
        const currentClientHeight = scrollContainer.clientHeight;

        // [레이아웃 가드] 스크롤 영역 유효 높이 및 화면 너비/높이 검증
        const isLayoutReady =
          currentScrollHeight >= svgHeight - clipOffset - 50 &&
          currentClientWidth > 0 &&
          currentClientHeight > 0;

        if (!isLayoutReady && layoutAttempts < 120) {
          layoutAttempts++;
          requestAnimationFrame(executeScroll);
          return;
        }

        // 스크롤 컨테이너의 padding-top 동적 측정
        const computedStyle = window.getComputedStyle(scrollContainer);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

        // SVG 실제 렌더링 스케일 계산
        const currentLevelNode = levelData.find((l) => l.id === targetLevelId) || levelData[0];
        const svgElement = node.closest('.path-svg') || scrollContainer.querySelector('.path-svg');
        const svgClientWidth = svgElement ? svgElement.clientWidth : currentClientWidth;
        const scale = svgClientWidth / svgWidth;

        // preserveAspectRatio="xMidYMax meet" 하단 정렬 비율 매칭에 따른 상단 오프셋 보정
        const svgYOffset = svgHeight * (1 - scale);

        const nodeRelativeY =
          paddingTop +
          scrollOffset +
          svgYOffset +
          (currentLevelNode ? currentLevelNode.position.y : 0) * scale;

        // 기기 방향 및 가시 영역 중앙 정렬 보정
        const isPortrait = window.innerHeight > window.innerWidth;
        const bottomSheetVisibleHeight = isPortrait ? 160 : 140;
        const visibleHeight = Math.max(
          0,
          currentClientHeight - paddingTop - bottomSheetVisibleHeight
        );
        const visualCenterY = paddingTop + visibleHeight / 2;

        const targetScrollTop = nodeRelativeY - visualCenterY;
        const minScrollTop = scrollOffset + svgYOffset + clipOffset * scale;
        const clampedTargetScrollTop = Math.max(minScrollTop, targetScrollTop);

        scrollContainer.setAttribute('data-auto-scrolling', 'true');

        scrollContainer.scrollTo({
          top: clampedTargetScrollTop,
          behavior: behavior === 'auto' ? 'auto' : 'smooth',
        });

        setIsScrollPositioned(true);

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        const scrollDuration = behavior === 'auto' ? 50 : 800;
        scrollTimeoutRef.current = setTimeout(() => {
          scrollContainer.removeAttribute('data-auto-scrolling');
          scrollTimeoutRef.current = null;
        }, scrollDuration);
      };

      requestAnimationFrame(executeScroll);
    },
    [levelData, targetLevelId, svgHeight, clipOffset, scrollOffset, svgWidth]
  );

  useEffect(() => {
    if (isReady !== undefined && !isReady) return;
    if (totalLevels === 0) return;

    const currentScrollKey = `${mountain || ''}_${world}_${category}_${targetLevelId}`;

    if (lastScrolledKeyRef.current === currentScrollKey) {
      return;
    }

    const isFirstScroll = !lastScrolledKeyRef.current;
    const scrollMode = isFirstScroll ? 'auto' : 'smooth';

    lastScrolledKeyRef.current = currentScrollKey;

    if (isFirstScroll) {
      setIsScrollPositioned(false);
    }

    const timer = setTimeout(() => {
      scrollToCurrentLevel(scrollMode);
    }, 30);

    return () => {
      clearTimeout(timer);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [mountain, world, category, targetLevelId, isReady, totalLevels, scrollToCurrentLevel]);

  return {
    currentLevelRef,
    isScrollPositioned,
    scrollToCurrentLevel,
  };
}
