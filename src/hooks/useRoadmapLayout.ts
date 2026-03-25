import { useMemo, useState, useEffect, useRef } from 'react';
import { HistoryStats } from '@/hooks/useHistoryData';
import { ALTITUDE_MILESTONES, MilestoneItem } from '@/constants/history';
import { ROADMAP_SCALE_CONFIG } from '@/types/roadmap';
import { ANIMATION_CONFIG } from '@/constants/game';

const VIRTUAL_RAIL_HEIGHT = 10000;

export function useRoadmapLayout(
  stats: HistoryStats | null,
  isLinearScale: boolean,
  isRoadmapActive: boolean
) {
  const [displayRatio, setDisplayRatio] = useState(5);
  const [isScaling, setIsScaling] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [visibleAltRange, setVisibleAltRange] = useState({ min: -1000, max: 20000 });
  const [gaugeHeight, setGaugeHeight] = useState('0%');

  const scrollProgressRef = useRef(0);
  const indicatorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPrunedAltRef = useRef(0);
  const cameraRef = useRef<HTMLDivElement>(null);
  const roadmapScrollRef = useRef<HTMLDivElement>(null);

  const getAltitudeY = (alt: number, ratio: number) => alt / ratio;

  const roadmapData = useMemo(() => {
    if (!stats) return { currentIdx: -1, cardIndices: [] };

    const currentIdx = ALTITUDE_MILESTONES.findIndex(
      (m, idx) =>
        stats.totalAltitude >= m.altitude &&
        (idx === 0 || stats.totalAltitude < ALTITUDE_MILESTONES[idx - 1].altitude)
    );

    const tierIndices = ALTITUDE_MILESTONES.map((mil, i) => ({
      type: mil.type,
      altitude: mil.altitude,
      originalIdx: i,
    }))
      .filter((mil) => mil.type === 'tier' || mil.altitude === 0)
      .sort((a, b) => a.altitude - b.altitude);

    const nextTier = tierIndices.find((m) => m.altitude > stats.totalAltitude);
    const prevTier = tierIndices
      .slice()
      .reverse()
      .find((m) => m.altitude <= stats.totalAltitude);

    const cardIndices = [nextTier?.originalIdx, prevTier?.originalIdx]
      .filter((val): val is number => val !== undefined && val !== -1)
      .filter((val, i, arr) => arr.indexOf(val) === i);

    return { currentIdx, cardIndices };
  }, [stats]);

  const layoutData = useMemo(() => {
    if (!isLinearScale || !stats) return null;

    const y0 = getAltitudeY(0, displayRatio);
    const absoluteZeroY = y0;
    const absoluteProgressY = getAltitudeY(stats.totalAltitude, displayRatio);
    const calculatedGaugeHeight = Math.round(Math.max(0, absoluteProgressY - absoluteZeroY));

    const nodes = ALTITUDE_MILESTONES.flatMap((m) => {
      const items = [];
      if (m.type === 'tier') {
        items.push({ ...m, isTier: true });
        m.subLandmarks?.forEach((sub: MilestoneItem) => {
          items.push({ ...sub, isTier: false, parentTierId: m.id });
        });
      }
      return items;
    })
      .map((item) => {
        const absoluteY = getAltitudeY(item.altitude, displayRatio);
        const bottom = Math.round(absoluteY - absoluteZeroY);
        return { ...item, bottom };
      })
      .sort((a, b) => b.altitude - a.altitude);

    const totalLogicalAltitude = ALTITUDE_MILESTONES[0].altitude + 10000;
    const BOTTOM_SAFETY_MARGIN = 4;

    return {
      gaugeHeight: calculatedGaugeHeight,
      nodes: nodes.map((n) => ({ ...n, bottom: n.bottom + BOTTOM_SAFETY_MARGIN })),
      absoluteZeroY,
      totalLogicalAltitude,
      BOTTOM_SAFETY_MARGIN,
    };
  }, [isLinearScale, stats, displayRatio]);

  // Scroll handler for linear scale
  useEffect(() => {
    const scrollContainer = roadmapScrollRef.current;
    if (!scrollContainer || !isLinearScale) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight } = scrollContainer;
      if (Math.abs(viewportHeight - clientHeight) > 5) {
        setViewportHeight(clientHeight);
      }

      const maxScroll = VIRTUAL_RAIL_HEIGHT - clientHeight;
      if (maxScroll <= 0) return;

      const scrollFromBottom = Math.max(0, maxScroll - scrollTop);
      const currentProgress = Math.min(1, Math.max(0, scrollFromBottom / maxScroll));
      scrollProgressRef.current = currentProgress;

      const totalHeight = layoutData ? layoutData.totalLogicalAltitude / displayRatio : 0;
      const offset = Math.max(0, totalHeight - clientHeight) * currentProgress;

      if (cameraRef.current) {
        cameraRef.current.style.setProperty('--camera-offset', `-${offset}px`);
      }

      const bottomAlt = layoutData ? layoutData.totalLogicalAltitude * currentProgress : 0;
      if (Math.abs(bottomAlt - lastPrunedAltRef.current) > 200) {
        lastPrunedAltRef.current = bottomAlt;
        const buffer = 500 * displayRatio;
        setVisibleAltRange({
          min: bottomAlt - buffer,
          max: bottomAlt + clientHeight * displayRatio + buffer,
        });
      }

      const approxAltitude = bottomAlt;
      const currentConfig = ROADMAP_SCALE_CONFIG.find((c) => c.ratio === displayRatio);
      let targetRatio = displayRatio;

      if (currentConfig) {
        if (currentConfig.upgrade && approxAltitude > currentConfig.upgrade) {
          const nextConfig = ROADMAP_SCALE_CONFIG.find((c) => c.ratio > displayRatio);
          if (nextConfig) targetRatio = nextConfig.ratio;
        } else if (currentConfig.downgrade && approxAltitude < currentConfig.downgrade) {
          const prevConfig = [...ROADMAP_SCALE_CONFIG]
            .reverse()
            .find((c) => c.ratio < displayRatio);
          if (prevConfig) targetRatio = prevConfig.ratio;
        }
      }

      if (Math.abs(targetRatio - displayRatio) > 0.1) {
        setIsScaling(true);
        setDisplayRatio(targetRatio);
        setShowZoomIndicator(true);
        if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
        indicatorTimerRef.current = setTimeout(
          () => setShowZoomIndicator(false),
          ANIMATION_CONFIG.TOAST_DURATION
        );
        setTimeout(() => setIsScaling(false), 850);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isLinearScale, isRoadmapActive, stats, displayRatio, viewportHeight, layoutData]);

  return {
    displayRatio,
    isScaling,
    showZoomIndicator,
    visibleAltRange,
    gaugeHeight,
    setGaugeHeight,
    roadmapData,
    layoutData,
    cameraRef,
    roadmapScrollRef,
    VIRTUAL_RAIL_HEIGHT,
    getAltitudeY,
  };
}
