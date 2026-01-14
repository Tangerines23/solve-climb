import React from 'react';
import { HistoryStats } from '../../hooks/useHistoryData';
import { LinearLandmarkItem, NonLinearTierItem } from './RoadmapItem';
import { ALTITUDE_MILESTONES } from '../../constants/history';

interface RoadmapOverlayProps {
    isMilestoneExpanded: boolean;
    isRoadmapActive: boolean;
    stats: HistoryStats;
    cardRect: DOMRect | null;
    displayRatio: number;
    isScaling: boolean;
    showZoomIndicator: boolean;
    isLinearScale: boolean;
    layoutData: any;
    visibleAltRange: { min: number; max: number };
    roadmapData: { currentIdx: number; cardIndices: number[] };
    roadmapRef: React.RefObject<HTMLDivElement>;
    roadmapScrollRef: React.RefObject<HTMLDivElement>;
    cameraRef: React.RefObject<HTMLDivElement>;
    currentMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
    nextMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
    zeroMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
    topMarkerRef: React.MutableRefObject<HTMLDivElement | null>;
    landmarkRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
    gaugeHeight: string;
    VIRTUAL_RAIL_HEIGHT: number;
    handleCloseRoadmap: () => void;
    setIsLinearScale: (val: boolean) => void;
    getAltitudeY: (alt: number, ratio: number) => number;
}

export const RoadmapOverlay: React.FC<RoadmapOverlayProps> = ({
    isMilestoneExpanded,
    isRoadmapActive,
    stats,
    cardRect,
    displayRatio,
    isScaling,
    showZoomIndicator,
    isLinearScale,
    layoutData,
    visibleAltRange,
    roadmapData,
    roadmapRef,
    roadmapScrollRef,
    cameraRef,
    currentMarkerRef,
    nextMarkerRef,
    zeroMarkerRef,
    topMarkerRef,
    landmarkRefs,
    gaugeHeight,
    VIRTUAL_RAIL_HEIGHT,
    handleCloseRoadmap,
    setIsLinearScale,
    getAltitudeY,
}) => {
    if (!isMilestoneExpanded || !stats || !cardRect) return null;

    return (
        <div
            className={`history-roadmap-overlay ${isRoadmapActive ? 'fade-in' : ''}`}
            style={{
                ['--start-top' as string]: `${cardRect.top}px`,
                ['--start-left' as string]: `${cardRect.left}px`,
                ['--start-width' as string]: `${cardRect.width}px`,
                ['--start-height' as string]: `${cardRect.height}px`,
            }}
        >
            <div className="roadmap-backdrop" onClick={handleCloseRoadmap} />
            <div ref={roadmapRef} className={`roadmap-container ${isRoadmapActive ? 'is-active' : ''}`}>
                <header className="roadmap-header">
                    <div className="roadmap-title-group">
                        <h2 className="roadmap-title">등반 일지</h2>
                        <span className="roadmap-subtitle">{stats.userTitle}</span>
                    </div>
                    <button
                        className="roadmap-close-button"
                        onClick={handleCloseRoadmap}
                        aria-label="로드맵 닫기"
                    >
                        ✕
                    </button>
                </header>

                <div className={`roadmap-zoom-indicator ${showZoomIndicator ? 'visible' : ''}`}>
                    Zoom 1:{displayRatio}
                </div>

                <div
                    className="roadmap-content"
                    style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
                >
                    <div
                        ref={roadmapScrollRef}
                        className="roadmap-scroll-ghost"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            overflowY: isLinearScale ? 'auto' : 'hidden',
                            zIndex: isLinearScale ? 2 : 0,
                            pointerEvents: isLinearScale ? 'auto' : 'none',
                        }}
                    >
                        <div style={{ height: `${VIRTUAL_RAIL_HEIGHT}px`, width: '1px' }} />
                    </div>

                    <div
                        className="roadmap-virtual-viewport"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1,
                            pointerEvents: 'none',
                            overflow: isLinearScale ? 'hidden' : 'auto',
                        }}
                    >
                        <div
                            ref={cameraRef}
                            className={`roadmap-mountain-path ${isScaling ? 'is-scaling' : ''}`}
                            style={{
                                position: 'absolute',
                                pointerEvents: 'auto',
                                left: 0,
                                right: 0,
                                bottom: isLinearScale && layoutData ? 'var(--camera-offset, 0px)' : '0px',
                                height: isLinearScale
                                    ? `${getAltitudeY(ALTITUDE_MILESTONES[0].altitude + 10000, displayRatio)}px`
                                    : 'auto',
                            }}
                        >
                            <div
                                className="roadmap-dotted-line"
                                style={{
                                    bottom: isLinearScale
                                        ? layoutData?.BOTTOM_SAFETY_MARGIN || 0
                                        : 'var(--gauge-bottom, 36px)',
                                    height:
                                        isLinearScale && layoutData
                                            ? `${layoutData.nodes[0].bottom - layoutData.BOTTOM_SAFETY_MARGIN + 100}px`
                                            : 'var(--dotted-height, 100%)',
                                    top: isLinearScale ? 'auto' : 'var(--dotted-top, 118px)',
                                }}
                            />
                            <div
                                className="path-line-fill"
                                style={{
                                    bottom: isLinearScale
                                        ? layoutData?.BOTTOM_SAFETY_MARGIN || 0
                                        : 'var(--gauge-bottom, 36px)',
                                    height:
                                        isLinearScale && layoutData ? `${layoutData.gaugeHeight}px` : gaugeHeight,
                                    top: 'auto',
                                }}
                            />

                            <div
                                className="current-position-floating-marker"
                                style={{
                                    bottom: `calc(${isLinearScale ? (layoutData?.BOTTOM_SAFETY_MARGIN || 0) + 'px' : 'var(--gauge-bottom, 36px)'} + ${isLinearScale && layoutData ? layoutData.gaugeHeight + 'px' : gaugeHeight})`,
                                    ['--current-alt-text' as string]: `"${stats.totalAltitude.toLocaleString()}m"`,
                                }}
                            >
                                <div
                                    className="landmark-progress-marker"
                                    style={{ position: 'relative', left: '0' }}
                                >
                                    <div className="landmark-dot">🚶</div>
                                </div>
                            </div>

                            <div
                                className={`path-landmarks ${isLinearScale ? 'is-linear' : ''}`}
                                style={
                                    isLinearScale
                                        ? {
                                            height: `${getAltitudeY(ALTITUDE_MILESTONES[0].altitude + 10000, displayRatio)}px`,
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                        }
                                        : undefined
                                }
                            >
                                <div
                                    className="roadmap-scroll-spacer bottom-spacer"
                                    style={{ height: isLinearScale ? '100px' : '0px' }}
                                />
                                {isLinearScale && layoutData ? (
                                    layoutData.nodes
                                        .filter((item: any) => item.altitude >= visibleAltRange.min && item.altitude <= visibleAltRange.max)
                                        .map((item: any) => {
                                            const isTier = item.isTier;
                                            const isRefCurrent =
                                                isTier &&
                                                roadmapData.currentIdx !== -1 &&
                                                ALTITUDE_MILESTONES[roadmapData.currentIdx].id === item.id;
                                            const isNext =
                                                isTier &&
                                                roadmapData.currentIdx > 0 &&
                                                ALTITUDE_MILESTONES[roadmapData.currentIdx - 1].id === item.id;

                                            return (
                                                <LinearLandmarkItem
                                                    key={isTier ? item.id : `${item.parentTierId}-sub-${item.label}`}
                                                    item={item}
                                                    stats={stats}
                                                    isRefCurrent={isRefCurrent}
                                                    isNext={isNext}
                                                    currentMarkerRef={currentMarkerRef}
                                                    nextMarkerRef={nextMarkerRef}
                                                />
                                            );
                                        })
                                ) : (
                                    <>
                                        {ALTITUDE_MILESTONES.map((m, idx) => {
                                            const isZero = m.altitude === 0;
                                            if (m.type !== 'tier' && !isZero) return null;

                                            return (
                                                <NonLinearTierItem
                                                    key={m.id || idx}
                                                    m={m}
                                                    idx={idx}
                                                    stats={stats}
                                                    roadmapData={roadmapData}
                                                    isRoadmapActive={isRoadmapActive}
                                                    setIsLinearScale={setIsLinearScale}
                                                    landmarkRefs={landmarkRefs}
                                                    currentMarkerRef={currentMarkerRef}
                                                    nextMarkerRef={nextMarkerRef}
                                                    topMarkerRef={topMarkerRef}
                                                    zeroMarkerRef={zeroMarkerRef}
                                                />
                                            );
                                        })}
                                        <div
                                            className="roadmap-scroll-spacer top-spacer"
                                            style={{ height: isLinearScale ? '100px' : '4px' }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isLinearScale && (
                    <div className="roadmap-scale-indicator">
                        <span className="scale-prefix">1px : </span>
                        <span className="scale-value">{Math.round(displayRatio)}m</span>
                    </div>
                )}

                <div className="roadmap-footer roadmap-extra-content">
                    <div className="roadmap-footer-row">
                        <span className="footer-label">현재 고도</span>
                        <span className="footer-value">{stats.totalAltitude.toLocaleString()}m</span>
                    </div>
                    <div className="roadmap-footer-row">
                        <span className="footer-label">다음 목표 정상까지</span>
                        <span className="footer-value">
                            {(stats.nextTierGoal - stats.totalAltitude).toLocaleString()}m
                        </span>
                    </div>
                </div>
            </div>
        </div >
    );
};
