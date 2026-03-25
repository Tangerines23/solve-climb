import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './RoadmapPage.css';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { useHistoryData } from '../hooks/useHistoryData';
import { ALTITUDE_MILESTONES } from '../constants/history';
import { vibrateShort } from '../utils/haptic';
import { MilestoneItem } from '../types/roadmap';
import { BadgeCollection } from '../components/BadgeSlot';
import { supabase } from '../utils/supabaseClient';
import { useBadgeChecker } from '../hooks/useBadgeChecker';
import { HistoryTab } from '../components/my/HistoryTab';
import { storageService, STORAGE_KEYS } from '../services';
import { LocalSession } from '../types/storage';
import { UI_MESSAGES } from '@/constants/ui';

// Extracted Components & Hooks
import { LinearLandmarkItem } from '../components/roadmap/LinearLandmarkItem';
import { NonLinearTierItem } from '../components/roadmap/NonLinearTierItem';
import { useRoadmapLayout } from '../hooks/useRoadmapLayout';

export function RoadmapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'summary' | 'history') || 'summary';

  const setActiveTab = (tab: 'summary' | 'history') => {
    setSearchParams({ tab }, { replace: true });
  };

  const { stats, loading, error } = useHistoryData();
  const [isMilestoneExpanded, setIsMilestoneExpanded] = useState(false);
  const [isRoadmapActive, setIsRoadmapActive] = useState(false);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [isLinearScale, setIsLinearScale] = useState(false);
  const [targetScrollAltitude, setTargetScrollAltitude] = useState<number | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const landmarkRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const currentMarkerRef = useRef<HTMLDivElement | null>(null);
  const nextMarkerRef = useRef<HTMLDivElement | null>(null);
  const zeroMarkerRef = useRef<HTMLDivElement | null>(null);
  const topMarkerRef = useRef<HTMLDivElement | null>(null);

  const {
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
  } = useRoadmapLayout(stats, isLinearScale, isRoadmapActive);

  /* --- Badge Logic --- */
  const [userId, setUserId] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const { checkAndAwardBadges } = useBadgeChecker();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        return;
      }
      try {
        const localSession = storageService.get<LocalSession>(STORAGE_KEYS.LOCAL_SESSION);
        if (localSession?.userId) {
          setUserId(localSession.userId);
        }
      } catch (e) {
        console.warn('Failed to parse local session:', e);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (userId && stats) {
      checkAndAwardBadges(userId, stats);
    }
  }, [userId, stats, checkAndAwardBadges]);

  useEffect(() => {
    if (!isRoadmapActive || !stats) {
      setGaugeHeight('0%');
      return;
    }

    const updateGauge = () => {
      const pathContainer = document.querySelector('.roadmap-mountain-path') as HTMLElement;
      if (!pathContainer || !stats) return;

      if (isLinearScale) return;

      const currentMarker = currentMarkerRef.current;
      const nextMarker = nextMarkerRef.current;
      const zeroMarker = zeroMarkerRef.current;
      const topMarker = topMarkerRef.current;

      if (!zeroMarker) return;

      const containerRect = pathContainer.getBoundingClientRect();
      const zeroRect = zeroMarker.getBoundingClientRect();
      const zeroCenterY = zeroRect.top + zeroRect.height / 2;

      const bottomOffset = containerRect.bottom - zeroCenterY;
      pathContainer.style.setProperty('--gauge-bottom', `${Math.round(bottomOffset)}px`);

      let targetY = zeroCenterY;
      if (currentMarker) {
        const currentRect = currentMarker.getBoundingClientRect();
        const currentCenterY = currentRect.top + currentRect.height / 2;
        targetY = currentCenterY;

        if (nextMarker) {
          const nextRect = nextMarker.getBoundingClientRect();
          const nextCenterY = nextRect.top + nextRect.height / 2;

          const currentMilestone =
            roadmapData.currentIdx !== -1
              ? ALTITUDE_MILESTONES[roadmapData.currentIdx]
              : { altitude: 0 };
          const nextMilestone = ALTITUDE_MILESTONES.slice()
            .reverse()
            .find((m) => m.altitude > stats.totalAltitude && m.type === 'tier');

          if (currentMilestone && nextMilestone) {
            const segmentTotal = nextMilestone.altitude - currentMilestone.altitude;
            const segmentProgress =
              segmentTotal > 0
                ? (stats.totalAltitude - currentMilestone.altitude) / segmentTotal
                : 0;
            targetY =
              currentCenterY +
              (nextCenterY - currentCenterY) * Math.max(0, Math.min(1, segmentProgress));
          }
        }
      }

      const heightInPixels = Math.max(0, zeroCenterY - targetY);
      setGaugeHeight(`${heightInPixels}px`);

      if (topMarker) {
        const topRect = topMarker.getBoundingClientRect();
        const topCenterY = topRect.top + topRect.height / 2;
        const totalDottedHeight = zeroCenterY - topCenterY;
        pathContainer.style.setProperty('--dotted-height', `${Math.round(totalDottedHeight)}px`);
        pathContainer.style.setProperty(
          '--dotted-top',
          `${Math.round(topCenterY - containerRect.top)}px`
        );
      }
    };

    const resizeObserver = new ResizeObserver(updateGauge);
    const observerTarget = document.querySelector('.roadmap-mountain-path');
    if (observerTarget) resizeObserver.observe(observerTarget);

    updateGauge();
    return () => resizeObserver.disconnect();
  }, [isRoadmapActive, stats, isLinearScale, roadmapData.currentIdx, setGaugeHeight]);

  useEffect(() => {
    if (isMilestoneExpanded) {
      const timer = setTimeout(() => {
        setIsRoadmapActive(true);
        setTimeout(() => {
          let targetEl: HTMLElement | null = null;
          if (targetScrollAltitude !== null) {
            targetEl = landmarkRefs.current.get(targetScrollAltitude) || null;
          }
          if (!targetEl) {
            targetEl = currentMarkerRef.current;
          }
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 650);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setTargetScrollAltitude(null);
    }
  }, [isMilestoneExpanded, targetScrollAltitude]);

  const handleOpenRoadmap = (altitude?: number) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCardRect(rect);
      if (typeof altitude === 'number') {
        setTargetScrollAltitude(altitude);
      }
      setIsMilestoneExpanded(true);
      setIsLinearScale(false);
    }
  };

  const handleCloseRoadmap = () => {
    setIsRoadmapActive(false);
    setTimeout(() => setIsMilestoneExpanded(false), 750);
  };

  const renderRoadmapOverlay = () => {
    if (!isMilestoneExpanded || !stats || !cardRect) return null;

    return (
      <div
        className={`history-roadmap-overlay history-roadmap-overlay-vars ${isRoadmapActive ? 'fade-in' : ''}`}
        style={
          {
            '--start-top': `${cardRect.top}px`,
            '--start-left': `${cardRect.left}px`,
            '--start-width': `${cardRect.width}px`,
            '--start-height': `${cardRect.height}px`,
          } as React.CSSProperties
        }
      >
        <div className="roadmap-backdrop" onClick={handleCloseRoadmap} />
        <div ref={roadmapRef} className={`roadmap-container ${isRoadmapActive ? 'is-active' : ''}`}>
          <header className="roadmap-header">
            <div className="roadmap-title-group">
              <h2 className="roadmap-title">{UI_MESSAGES.ROADMAP_TITLE}</h2>
              <span className="roadmap-subtitle">{stats.userTitle}</span>
            </div>
            <button
              className="btn-icon roadmap-close-button"
              onClick={handleCloseRoadmap}
              aria-label="로드맵 닫기"
            >
              ✕
            </button>
          </header>

          <div className={`roadmap-zoom-indicator ${showZoomIndicator ? 'visible' : ''}`}>
            {UI_MESSAGES.ZOOM_LABEL} 1:{displayRatio}
          </div>

          <div className="roadmap-content-wrapper">
            <div
              ref={roadmapScrollRef}
              className={`roadmap-scroll-ghost-container ${isLinearScale ? 'is-linear' : ''}`}
              style={
                {
                  '--rail-height': `${VIRTUAL_RAIL_HEIGHT}px`,
                } as React.CSSProperties
              }
            >
              <div className="roadmap-rail-inner" />
            </div>

            <div
              className={`roadmap-virtual-viewport-container ${isLinearScale ? 'is-linear' : ''}`}
            >
              <div
                ref={cameraRef}
                className={`roadmap-mountain-path-container ${isScaling ? 'is-scaling' : ''} ${isLinearScale ? 'is-linear' : ''}`}
                style={
                  {
                    '--path-height': isLinearScale
                      ? `${getAltitudeY(ALTITUDE_MILESTONES[0].altitude + 10000, displayRatio)}px`
                      : 'auto',
                  } as React.CSSProperties
                }
              >
                <div
                  className={`roadmap-dotted-line ${isLinearScale ? 'is-linear' : ''}`}
                  style={
                    {
                      '--dotted-bottom': isLinearScale
                        ? layoutData?.BOTTOM_SAFETY_MARGIN || 0
                        : 'var(--gauge-bottom, 36px)',
                      '--dotted-height-val':
                        isLinearScale && layoutData
                          ? `${layoutData.nodes[0].bottom - layoutData.BOTTOM_SAFETY_MARGIN + 100}px`
                          : 'var(--dotted-height, 100%)',
                    } as React.CSSProperties
                  }
                />
                <div
                  className="path-line-fill"
                  style={
                    {
                      '--fill-bottom': isLinearScale
                        ? layoutData?.BOTTOM_SAFETY_MARGIN || 0
                        : 'var(--gauge-bottom, 36px)',
                      '--fill-height':
                        isLinearScale && layoutData ? `${layoutData.gaugeHeight}px` : gaugeHeight,
                    } as React.CSSProperties
                  }
                />

                <div
                  className="roadmap-floating-marker-container"
                  style={
                    {
                      '--marker-bottom': `calc(${isLinearScale ? (layoutData?.BOTTOM_SAFETY_MARGIN || 0) + 'px' : 'var(--gauge-bottom, 36px)'} + ${isLinearScale && layoutData ? layoutData.gaugeHeight + 'px' : gaugeHeight})`,
                      '--current-alt-text': `"${stats.totalAltitude.toLocaleString()}m"`,
                    } as React.CSSProperties
                  }
                >
                  <div className="landmark-progress-marker">
                    <div className="landmark-dot">🚶</div>
                  </div>
                </div>

                <div
                  className={`roadmap-path-landmarks-container ${isLinearScale ? 'is-linear' : ''}`}
                  style={
                    isLinearScale
                      ? ({
                          '--landmarks-height': `${getAltitudeY(ALTITUDE_MILESTONES[0].altitude + 10000, displayRatio)}px`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div
                    className="roadmap-scroll-spacer bottom-spacer"
                    style={
                      {
                        '--spacer-height': isLinearScale ? '100px' : '0px',
                      } as React.CSSProperties
                    }
                  />
                  {isLinearScale && layoutData ? (
                    layoutData.nodes
                      .filter(
                        (item) =>
                          item.altitude >= visibleAltRange.min &&
                          item.altitude <= visibleAltRange.max
                      )
                      .map((item) => {
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
                        style={
                          {
                            '--spacer-height': isLinearScale ? '100px' : '4px',
                          } as React.CSSProperties
                        }
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
              <span className="footer-label">{UI_MESSAGES.CURRENT_ALTITUDE}</span>
              <span className="footer-value">{stats.totalAltitude.toLocaleString()}m</span>
            </div>
            <div className="roadmap-footer-row">
              <span className="footer-label">{UI_MESSAGES.NEXT_GOAL_REMAINING}</span>
              <span className="footer-value">
                {(stats.nextTierGoal - stats.totalAltitude).toLocaleString()}m
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="history-page">
        <main className="history-main">
          <div className="history-content">
            <div className="history-error">
              {UI_MESSAGES.FETCH_DATA_FAILED}
              <br />
              <span className="history-error-detail">(에러: {error})</span>
            </div>
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="history-page">
      <Header />
      <main className="history-main">
        <div className="history-content" data-vg-ignore="true">
          <div className="history-hero-section">
            <div className="history-profile-row">
              <div className="history-avatar">🏔️</div>
              <div className="history-profile-info">
                <div className="history-user-title">
                  {loading ? UI_MESSAGES.ANALYZING : stats?.userTitle}
                </div>
                <div className="history-user-info-row">
                  <div className="history-user-altitude">
                    {UI_MESSAGES.TOTAL_ALTITUDE}{' '}
                    <strong className="altitude-value">
                      {loading ? '...' : stats?.totalAltitude.toLocaleString()}m
                    </strong>
                  </div>
                  {!loading && stats && stats.streakCount > 0 && (
                    <div className="history-streak-badge">
                      <span className="streak-icon">🔥</span>
                      <span className="streak-count">
                        {stats.streakCount}
                        {UI_MESSAGES.STREAK_SUFFIX}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!loading && stats && (
              <div className="history-tier-progress">
                <div className="tier-progress-header">
                  <span className="tier-next-label">
                    {stats.nextTierName} {UI_MESSAGES.LEVEL_LABEL}까지{' '}
                    <strong>{(stats.nextTierGoal - stats.totalAltitude).toLocaleString()}m</strong>
                  </span>
                  <span className="tier-percentage">
                    {stats.nextTierGoal > 0
                      ? Math.round((stats.totalAltitude / stats.nextTierGoal) * 100)
                      : 100}
                    %
                  </span>
                </div>
                <div
                  className="tier-progress-bar-container"
                  role="progressbar"
                  aria-valuenow={Math.round((stats.totalAltitude / stats.nextTierGoal) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stats.nextTierName} 등급 달성률`}
                >
                  <div
                    className="tier-progress-bar-fill"
                    style={
                      {
                        '--progress-width': `${Math.min((stats.totalAltitude / stats.nextTierGoal) * 100, 100)}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="history-tab-container">
            <div className="history-segmented-control" role="tablist" data-vg-ignore="true">
              <div
                className={`segmented-indicator ${
                  activeTab === 'summary' ? 'tab-summary' : 'tab-history'
                }`}
              />
              <button
                className={`segmented-item ${activeTab === 'summary' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'summary' ? 'true' : 'false'}
                aria-controls="roadmap-tab-panel"
                onClick={() => {
                  setActiveTab('summary');
                  vibrateShort();
                }}
              >
                스테이지 🗺️
              </button>
              <button
                className={`segmented-item ${activeTab === 'history' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'history' ? 'true' : 'false'}
                aria-controls="stats-tab-panel"
                onClick={() => {
                  setActiveTab('history');
                  vibrateShort();
                }}
              >
                진행 통계 📊
              </button>
            </div>
          </div>

          <div className="history-tab-content" data-vg-ignore="true">
            {activeTab === 'summary' ? (
              <div
                id="roadmap-tab-panel"
                role="tabpanel"
                className="history-journey-container fade-in"
              >
                {!loading && stats && (
                  <>
                    <div className="history-smart-comment">
                      <span className="comment-icon" role="img" aria-label="comment">
                        💬
                      </span>
                      <span className="comment-text">{stats.smartComment}</span>
                    </div>

                    {userId && (
                      <div className="history-badge-collection">
                        <div className="collection-header">
                          <span className="collection-title">나의 뱃지 보관함 🏆</span>
                          <span
                            className="collection-more"
                            role="button"
                            onClick={() => setShowBadgeModal(true)}
                          >
                            전체보기 &gt;
                          </span>
                        </div>
                        <div className="collection-content">
                          <BadgeCollection userId={userId} mode="preview" />
                        </div>
                      </div>
                    )}

                    <div
                      ref={cardRef}
                      className={`history-milestones-integrated ${isMilestoneExpanded ? 'hidden' : ''}`}
                      onClick={() => handleOpenRoadmap()}
                      role="button"
                      aria-label="로드맵 전체 보기"
                    >
                      <div className="history-milestones-list-integrated">
                        <div className="milestone-line-integrated" />
                        {(() => {
                          const items = roadmapData.cardIndices.map((idx) => {
                            const milestone = ALTITUDE_MILESTONES.at(idx);
                            return milestone
                              ? { ...milestone, isMilestone: true }
                              : {
                                  id: `fallback-${idx}`,
                                  label: '',
                                  altitude: 0,
                                  icon: '',
                                  type: 'landmark' as const,
                                  isMilestone: true,
                                };
                          });

                          const hasExactMatch = items.some(
                            (m) => m.altitude === stats.totalAltitude
                          );

                          const displayItems = hasExactMatch
                            ? items
                            : [
                                ...items,
                                {
                                  label: '현재 위치',
                                  altitude: stats.totalAltitude,
                                  isMilestone: false,
                                  icon: '🚶',
                                },
                              ];

                          return displayItems
                            .sort((a, b) => b.altitude - a.altitude)
                            .map((m) => {
                              const isNow = !m.isMilestone || m.altitude === stats.totalAltitude;
                              const isBetween = !m.isMilestone;
                              return (
                                <div
                                  key={m.isMilestone ? (m as MilestoneItem).id : 'current-now'}
                                  className={`milestone-item-integrated ${isNow ? 'is-current' : ''} ${isBetween ? 'current-pos-mini' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRoadmap(m.altitude);
                                    vibrateShort();
                                  }}
                                  role="button"
                                  aria-label={`${m.label} (${m.altitude}m) ${isNow ? '- 현재 위치' : ''}`}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenRoadmap(m.altitude);
                                      vibrateShort();
                                    }
                                  }}
                                  data-vg-ignore="true"
                                >
                                  <div className="milestone-dot-integrated" data-vg-ignore="true">
                                    {isNow ? '🚶' : m.altitude === 0 ? '🏠' : m.icon}
                                  </div>
                                  <div className="milestone-content-integrated">
                                    <span className="milestone-label-integrated">{m.label}</span>
                                    <span className="milestone-value-integrated">
                                      {m.altitude.toLocaleString()}m
                                    </span>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                      <div className="milestone-expand-hint">전체 일지 보기 🗺️</div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div id="stats-tab-panel" role="tabpanel" className="fade-in">
                <HistoryTab />
              </div>
            )}
          </div>
        </div>
      </main>

      {showBadgeModal && userId && (
        <div className="badge-modal-overlay" onClick={() => setShowBadgeModal(false)}>
          <div className="badge-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="badge-modal-header">
              <h3>전체 뱃지 도감</h3>
              <button className="close-button" onClick={() => setShowBadgeModal(false)}>
                ✕
              </button>
            </div>
            <div className="badge-modal-body">
              <BadgeCollection userId={userId} mode="full" />
            </div>
          </div>
        </div>
      )}

      {renderRoadmapOverlay()}
      <FooterNav />
    </div>
  );
}
