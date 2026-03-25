import { memo } from 'react';
import { MilestoneItem } from '@/types/roadmap';
import { HistoryStats } from '@/hooks/useHistoryData';
import { vibrateShort } from '@/utils/haptic';

interface NonLinearTierItemProps {
  m: MilestoneItem;
  idx: number;
  stats: HistoryStats;
  roadmapData: { currentIdx: number; cardIndices: number[] };
  isRoadmapActive: boolean;
  setIsLinearScale: (isLinear: boolean) => void;
  landmarkRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  currentMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
  nextMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
  topMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
  zeroMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const NonLinearTierItem = memo(
  ({
    m,
    idx,
    stats,
    roadmapData,
    isRoadmapActive,
    setIsLinearScale,
    landmarkRefs,
    currentMarkerRef,
    nextMarkerRef,
    topMarkerRef,
    zeroMarkerRef,
  }: NonLinearTierItemProps) => {
    const isZero = m.altitude === 0;
    const isCurrentNode = stats.totalAltitude === m.altitude;
    const isRefCurrent = idx === roadmapData.currentIdx;
    const isNext = idx === (roadmapData.currentIdx !== -1 ? roadmapData.currentIdx - 1 : -1);
    const isTop = idx === 0;
    const isPassed = stats ? stats.totalAltitude >= m.altitude : false;
    const isInCardView = roadmapData.cardIndices.includes(idx);

    return (
      <div
        className={`tier-group ${!isInCardView && !isRoadmapActive ? 'roadmap-extra-content' : ''}`}
      >
        <div
          className={`landmark-item ${isPassed ? 'is-passed' : ''} ${isCurrentNode ? 'is-current' : ''} ${m.type === 'tier' || isZero ? 'type-tier' : ''} clickable`}
          ref={(el) => {
            if (el) landmarkRefs.current.set(m.altitude, el);
          }}
          onClick={() => {
            setIsLinearScale(true);
            vibrateShort();
          }}
        >
          <div
            className="landmark-progress-marker"
            ref={(el) => {
              if (isRefCurrent) currentMarkerRef.current = el;
              if (isNext) nextMarkerRef.current = el;
              if (isTop) topMarkerRef.current = el;
              if (isZero) zeroMarkerRef.current = el;
            }}
          >
            <div className="landmark-dot">{isCurrentNode ? '🚶' : isZero ? '🏠' : m.icon}</div>
          </div>
          <div className="landmark-info">
            <div className="tier-label-row">
              <span className="landmark-label">{m.label}</span>
              <span className="landmark-altitude">{m.altitude.toLocaleString()}m</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
