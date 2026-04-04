import { memo } from 'react';
import { MilestoneItem } from '@/types/roadmap';
import { HistoryStats } from '@/hooks/useHistoryData';

interface LinearLandmarkItemProps {
  item: MilestoneItem;
  stats: HistoryStats;
  isRefCurrent: boolean;
  isNext: boolean;
  currentMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
  nextMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const LinearLandmarkItem = memo(
  ({
    item,
    stats,
    isRefCurrent,
    isNext,
    currentMarkerRef,
    nextMarkerRef,
  }: LinearLandmarkItemProps) => {
    const isPassed = stats.totalAltitude >= item.altitude;
    const isTier = item.isTier;
    const isCurrent = isTier && stats.totalAltitude === item.altitude;

    return (
      <div
        className={`landmark-item ${isTier ? 'type-tier' : 'type-landmark'} ${isCurrent ? 'is-current' : ''} ${isPassed ? 'is-passed' : ''} landmark-item-bottom`}
      >
        <div
          className="landmark-progress-marker"
          ref={isRefCurrent ? currentMarkerRef : isNext ? nextMarkerRef : null}
        >
          <div className={isTier ? 'landmark-dot' : 'landmark-dot sub-dot'}>
            {isTier ? (isCurrent ? '🚶' : item.icon) : null}
          </div>
        </div>
        <div className="landmark-info">
          <div className={isTier ? 'tier-label-row' : 'landmark-label-row'}>
            <span className={`landmark-label ${!isTier ? 'sub' : ''}`}>{item.label}</span>
            <span className={`landmark-altitude ${!isTier ? 'sub' : ''}`}>
              {item.altitude.toLocaleString()}m
            </span>
          </div>
        </div>
      </div>
    );
  }
);
