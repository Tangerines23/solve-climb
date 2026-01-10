import { useState, useEffect, useMemo, useRef, memo } from 'react';
// import { useNavigate } from 'react-router-dom';
import './RoadmapPage.css';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { useHistoryData } from '../hooks/useHistoryData';
import { ALTITUDE_MILESTONES } from '../constants/history';
import { vibrateShort } from '../utils/haptic';

// --- 전역 상수 및 설정 ---
const VIRTUAL_RAIL_HEIGHT = 10000; // 스크롤바 길이를 고정하는 상수

interface ScaleConfig {
  ratio: number;
  upgrade?: number;
  downgrade?: number;
}

const ROADMAP_SCALE_CONFIG: ScaleConfig[] = [
  { ratio: 5, upgrade: 5000 },
  { ratio: 10, downgrade: 3000, upgrade: 20000 },
  { ratio: 30, downgrade: 10000, upgrade: 60000 },
  { ratio: 100, downgrade: 40000, upgrade: 150000 },
  { ratio: 150, downgrade: 120000, upgrade: 200000 },
  { ratio: 300, downgrade: 180000 }
];

// --- 최적화용 메모이제이션 컴포넌트 ---

const LinearLandmarkItem = memo(({
  item,
  stats,
  isRefCurrent,
  isNext,
  currentMarkerRef,
  nextMarkerRef
}: any) => {
  const isPassed = stats.totalAltitude >= item.altitude;
  const isTier = item.isTier;
  const isCurrent = isTier && stats.totalAltitude === item.altitude;

  return (
    <div
      className={`landmark-item ${isTier ? 'type-tier' : 'type-landmark'} ${isCurrent ? 'is-current' : ''} ${isPassed ? 'is-passed' : ''}`}
      style={{
        position: 'absolute',
        bottom: `${item.bottom}px`,
        left: 0,
        right: 0,
        height: '0px',
        minHeight: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        willChange: 'bottom'
      }}
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
          <span className={`landmark-label ${!isTier ? 'sub' : ''}`}>
            {item.label}
          </span>
          <span className={`landmark-altitude ${!isTier ? 'sub' : ''}`}>
            {item.altitude.toLocaleString()}m
          </span>
        </div>
      </div>
    </div>
  );
});

const NonLinearTierItem = memo(({
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
  zeroMarkerRef
}: any) => {
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
        className={`landmark-item ${isPassed ? 'is-passed' : ''} ${isCurrentNode ? 'is-current' : ''} ${m.type === 'tier' || isZero ? 'type-tier' : ''}`}
        ref={(el) => {
          if (el) landmarkRefs.current.set(m.altitude, el);
        }}
        onClick={() => {
          setIsLinearScale(true);
          vibrateShort();
        }}
        style={{ cursor: 'pointer' }}
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
          <div className="landmark-dot">
            {isCurrentNode ? '🚶' : isZero ? '🏠' : m.icon}
          </div>
        </div>
        <div className="landmark-info">
          <div className="tier-label-row">
            <span className="landmark-label">{m.label}</span>
            <span className="landmark-altitude">
              {m.altitude.toLocaleString()}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export function RoadmapPage() {
  // const navigate = useNavigate();
  const { stats, loading, error } = useHistoryData();
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'activity'>('summary');
  const [isMilestoneExpanded, setIsMilestoneExpanded] = useState(false);
  const [isRoadmapActive, setIsRoadmapActive] = useState(false);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [isLinearScale, setIsLinearScale] = useState(false);
  const [gaugeHeight, setGaugeHeight] = useState('0%');
  const [displayRatio, setDisplayRatio] = useState(5); // Dynamic Ratio (Starts at 5m/px)
  const [isScaling, setIsScaling] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [visibleAltRange, setVisibleAltRange] = useState({ min: -1000, max: 20000 }); // Pruning Range
  const cameraRef = useRef<HTMLDivElement>(null); // 시각적 위치 업데이트용 Ref
  const indicatorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Dynamic Global Zoom System ---
  // 스크롤 위치(고도)에 따라 전체 지도의 축척(ratio)이 변함
  const getAltitudeY = (alt: number, ratio: number) => {
    return alt / ratio;
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const currentMarkerRef = useRef<HTMLDivElement>(null);
  const nextMarkerRef = useRef<HTMLDivElement>(null);
  const zeroMarkerRef = useRef<HTMLDivElement>(null);
  const topMarkerRef = useRef<HTMLDivElement>(null);
  const roadmapScrollRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0); // 비율 변경 간 위치 동기화를 위한 Ref
  const [targetScrollAltitude, setTargetScrollAltitude] = useState<number | null>(null);
  const landmarkRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 1. 데이터 메모이제이션 (성능 최적화)
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

  // --- 통합 레이아웃 계산 (Single Source of Truth) ---
  const layoutData = useMemo(() => {
    if (!isLinearScale || !stats) return null;

    // 1. 기본 변수 준비 (Fisheye 제거, 순수 Dynamic Ratio 적용)
    const y0 = getAltitudeY(0, displayRatio);
    const absoluteZeroY = y0;

    // 2. 게이지 높이 계산
    const absoluteProgressY = getAltitudeY(stats.totalAltitude, displayRatio);
    // Pixel Snapping: 소수점 렌더링 오차 방지를 위해 반올림
    const calculatedGaugeHeight = Math.round(Math.max(0, absoluteProgressY - absoluteZeroY));

    // 3. 노드 위치 미리 계산
    const nodes = ALTITUDE_MILESTONES.flatMap((m) => {
      const items = [];
      if (m.type === 'tier') {
        items.push({ ...m, isTier: true });
        m.subLandmarks.forEach((sub: any) => {
          items.push({ ...sub, isTier: false, parentTierId: m.id });
        });
      }
      return items;
    })
      .map((item) => {
        const absoluteY = getAltitudeY(item.altitude, displayRatio);
        const bottom = Math.round(absoluteY - absoluteZeroY); // CSS bottom 값 (px) - Pixel Snapping

        return {
          ...item,
          bottom,
        };
      })
      .sort((a, b) => b.altitude - a.altitude);

    // 4. 카메라 오프셋 계산 (Zero-Anchor 기준)
    // 현재 스크롤 위치(%)에 해당하는 고도가 화면 바닥에 오도록 설정
    const totalLogicalAltitude = ALTITUDE_MILESTONES[0].altitude + 10000;
    const BOTTOM_SAFETY_MARGIN = 4; // 바닥에 거의 붙도록 4px로 최소화 (한계치)

    return {
      gaugeHeight: calculatedGaugeHeight,
      nodes: nodes.map((n) => ({ ...n, bottom: n.bottom + BOTTOM_SAFETY_MARGIN })),
      absoluteZeroY,
      totalLogicalAltitude,
      BOTTOM_SAFETY_MARGIN,
    };
  }, [isLinearScale, stats, displayRatio]); // focalY removed, displayRatio added

  // 2. 게이지 실시간 트래킹 (글로벌 선형 배율 적용)
  useEffect(() => {
    if (!isRoadmapActive || !stats) {
      setGaugeHeight('0%');
      return;
    }

    const updateGauge = () => {
      const pathContainer = document.querySelector('.roadmap-mountain-path') as HTMLElement;
      if (!pathContainer || !stats) return;

      if (isLinearScale) {
        // 선형 모드: handleScroll/layoutData에서 처리
        return;
      } else {
        // 정렬 모드: 마커 기반 실시간 정렬
        const currentMarker = currentMarkerRef.current;
        const nextMarker = nextMarkerRef.current;
        const zeroMarker = zeroMarkerRef.current;
        const topMarker = topMarkerRef.current;

        if (!zeroMarker) return;

        const containerRect = pathContainer.getBoundingClientRect();
        const zeroRect = zeroMarker.getBoundingClientRect();
        const zeroCenterY = zeroRect.top + zeroRect.height / 2;

        // 1. 게이지 시작점 (Bottom)
        const bottomOffset = containerRect.bottom - zeroCenterY;
        pathContainer.style.setProperty('--gauge-bottom', `${Math.round(bottomOffset)}px`);

        // 2. 게이지 높이 (Current Progress)
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

        // 3. 점선 범위 (Top to Bottom)
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
      }
    };

    const resizeObserver = new ResizeObserver(updateGauge);
    const observerTarget = document.querySelector('.roadmap-mountain-path');
    if (observerTarget) resizeObserver.observe(observerTarget);

    updateGauge();
    return () => resizeObserver.disconnect();
  }, [isRoadmapActive, stats, isLinearScale, roadmapData.currentIdx]);

  // 3. 로드맵 애니메이션 및 자동 스크롤
  // 4. 스크롤 위치에 따른 배율 실시간 업데이트
  useEffect(() => {
    const scrollContainer = roadmapScrollRef.current;
    if (!scrollContainer || !isLinearScale) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight } = scrollContainer;

      // 1. Viewport Height Sync (Needed for offset calculation)
      if (Math.abs(viewportHeight - clientHeight) > 5) {
        setViewportHeight(clientHeight);
      }

      const maxScroll = VIRTUAL_RAIL_HEIGHT - clientHeight;
      if (maxScroll <= 0) return;

      const scrollFromBottom = Math.max(0, maxScroll - scrollTop);
      const currentProgress = Math.min(1, Math.max(0, scrollFromBottom / maxScroll));

      scrollProgressRef.current = currentProgress;

      // 2. Camera Translation via CSS Variable (Direct DOM manipulation for performance)
      const totalHeight = layoutData ? layoutData.totalLogicalAltitude / displayRatio : 0;
      const offset = Math.max(0, totalHeight - clientHeight) * currentProgress;

      if (cameraRef.current) {
        cameraRef.current.style.setProperty('--camera-offset', `-${offset}px`);
      }

      // 3. Viewport Pruning Logic (Calculate visible altitude range)
      // 화면 중앙 고도뿐 아니라 상하 뷰포트 영역에 해당하는 고도 계산
      const buffer = 500 * displayRatio; // 500px 정도의 상하 버퍼
      const bottomAlt = layoutData ? layoutData.totalLogicalAltitude * currentProgress : 0;
      const topAlt = bottomAlt + (clientHeight * displayRatio);

      setVisibleAltRange({
        min: bottomAlt - buffer,
        max: topAlt + buffer
      });

      // 4. Altitude Estimation for Ratio Logic
      const approxAltitude = bottomAlt;

      // --- 리팩토링된 Dynamic Scale Logic ---
      const currentConfig = ROADMAP_SCALE_CONFIG.find(c => c.ratio === displayRatio);
      let targetRatio = displayRatio;

      if (currentConfig) {
        if (currentConfig.upgrade && approxAltitude > currentConfig.upgrade) {
          const nextConfig = ROADMAP_SCALE_CONFIG.find(c => c.ratio > displayRatio);
          if (nextConfig) targetRatio = nextConfig.ratio;
        } else if (currentConfig.downgrade && approxAltitude < currentConfig.downgrade) {
          const prevConfig = [...ROADMAP_SCALE_CONFIG].reverse().find(c => c.ratio < displayRatio);
          if (prevConfig) targetRatio = prevConfig.ratio;
        }
      }

      if (Math.abs(targetRatio - displayRatio) > 0.1) {
        setIsScaling(true);
        setDisplayRatio(targetRatio);

        // 배율 인디케이터 표시
        setShowZoomIndicator(true);
        if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
        indicatorTimerRef.current = setTimeout(() => setShowZoomIndicator(false), 2000);

        // 트랜지션 완료 후 상태 해제 (CSS transition duration 0.8s와 일치)
        setTimeout(() => setIsScaling(false), 850);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기값 설정
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isLinearScale, isRoadmapActive, stats, displayRatio, viewportHeight, layoutData]);

  useEffect(() => {
    if (isMilestoneExpanded) {
      const timer = setTimeout(() => {
        setIsRoadmapActive(true);
        // 열리는 애니메이션(600ms)이 충분히 진행된 후 스크롤 계산 시도
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
        }, 650); // 150ms -> 650ms (Transition 완료 대기)
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // 닫힐 때 타겟 초기화
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

  // --- Sub-Render Functions ---

  const renderProfileSection = () => (
    <div className="history-summary-card">
      <div className="history-profile-section">
        <div className="history-avatar">🏔️</div>
        <div className="history-profile-info">
          <div className="history-user-title">{loading ? '분석 중...' : stats?.userTitle}</div>
          <div className="history-user-altitude">
            누적 고도{' '}
            <strong className="altitude-value">
              {loading ? '...' : stats?.totalAltitude.toLocaleString()}m
            </strong>
          </div>
        </div>
      </div>

      {!loading && stats && (
        <>
          <div className="history-tier-progress">
            <div className="tier-progress-header">
              <span className="tier-next-label">
                {stats.nextTierName} 등급까지{' '}
                <strong>{(stats.nextTierGoal - stats.totalAltitude).toLocaleString()}m</strong>
              </span>
              <span className="tier-percentage">
                {stats.nextTierGoal > 0
                  ? Math.round((stats.totalAltitude / stats.nextTierGoal) * 100)
                  : 100}
                %
              </span>
            </div>
            <div className="tier-progress-bar-container">
              <div
                className="tier-progress-bar-fill"
                style={{
                  width: `${Math.min((stats.totalAltitude / stats.nextTierGoal) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="history-smart-comment">
            <span className="comment-icon">💬</span>
            <span className="comment-text">{stats.smartComment}</span>
          </div>

          <div
            ref={cardRef}
            className={`history-milestones-integrated ${isMilestoneExpanded ? 'hidden' : ''}`}
            onClick={() => handleOpenRoadmap()}
          >
            <div className="history-milestones-list-integrated">
              <div className="milestone-line-integrated" />
              {(() => {
                const items = roadmapData.cardIndices.map((idx) => ({
                  ...ALTITUDE_MILESTONES[idx],
                  isMilestone: true,
                }));

                const hasExactMatch = items.some((m) => m.altitude === stats.totalAltitude);

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
                        key={m.isMilestone ? (m as any).id : 'current-now'}
                        className={`milestone-item-integrated ${isNow ? 'is-current' : ''} ${isBetween ? 'current-pos-mini' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRoadmap(m.altitude);
                          vibrateShort();
                        }}
                      >
                        <div className="milestone-dot-integrated">
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
  );

  const renderRoadmapOverlay = () => {
    if (!isMilestoneExpanded || !stats || !cardRect) return null;

    return (
      <div
        className={`history-roadmap-overlay ${isRoadmapActive ? 'fade-in' : ''}`}
        style={{
          ['--start-top' as any]: `${cardRect.top}px`,
          ['--start-left' as any]: `${cardRect.left}px`,
          ['--start-width' as any]: `${cardRect.width}px`,
          ['--start-height' as any]: `${cardRect.height}px`,
        }}
      >
        <div className="roadmap-backdrop" onClick={handleCloseRoadmap} />
        <div ref={roadmapRef} className={`roadmap-container ${isRoadmapActive ? 'is-active' : ''}`}>
          <header className="roadmap-header">
            <div className="roadmap-title-group">
              <h2 className="roadmap-title">등반 일지</h2>
              <span className="roadmap-subtitle">{stats.userTitle}</span>
            </div>
            <button className="roadmap-close-button" onClick={handleCloseRoadmap}>
              ✕
            </button>
          </header>

          {/* 배율 인디케이터 (고도화 항목) */}
          <div className={`roadmap-zoom-indicator ${showZoomIndicator ? 'visible' : ''}`}>
            Zoom 1:{displayRatio}
          </div>

          <div
            className="roadmap-content"
            style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
          >
            {/* 1. Fixed Logical Scroll Rail (Ghost) */}
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

            {/* 2. Virtual Camera View Container (Visual) */}
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
                    ['--current-alt-text' as any]: `"${stats.totalAltitude.toLocaleString()}m"`,
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
                  {/* 하단 여백: 확대맵(Linear)일 때는 센터링을 위해 길게, 기본 목록일 때는 짧게 */}
                  <div
                    className="roadmap-scroll-spacer bottom-spacer"
                    style={{ height: isLinearScale ? '100px' : '0px' }}
                  />
                  {isLinearScale && layoutData ? (
                    layoutData.nodes
                      .filter(item => item.altitude >= visibleAltRange.min && item.altitude <= visibleAltRange.max)
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
      </div>
    );
  };

  /* --- Analysis View --- */
  const renderAnalysisSection = () => {
    if (!stats) return null;

    // 카테고리별 숙련도 데이터 준비
    const maxLevel = 15; // 최대 레벨 가정
    const categoryData = stats.categoryLevels.slice(0, 5); // 상위 5개만

    return (
      <div className="history-analysis-container fade-in">
        {/* 1. 종합 요약 카드 */}
        <div className="history-analysis-card">
          <div className="history-card-header no-border">
            <h3 className="history-card-title">등반 성과 📊</h3>
          </div>
          <div className="analysis-summary-grid">
            <div className="analysis-stat-item">
              <div className="stat-label">정답률</div>
              <div className="stat-value highlight">{stats.averageAccuracy}%</div>
            </div>
            <div className="analysis-stat-item">
              <div className="stat-label">완등 문제</div>
              <div className="stat-value">{stats.weeklyTotal}개</div>
            </div>
            <div className="analysis-stat-item">
              <div className="stat-label">연속 등반</div>
              <div className="stat-value">{stats.streakCount}일</div>
            </div>
          </div>
        </div>

        {/* 2. 분야별 숙련도 (Bar Chart) */}
        <div className="history-analysis-card">
          <div className="history-card-header">
            <h3 className="history-card-title">분야별 숙련도</h3>
          </div>
          <div className="skill-chart-container">
            {categoryData.length > 0 ? (
              categoryData.map((cat) => (
                <div key={cat.themeId} className="skill-bar-row">
                  <div className="skill-info">
                    <span className="skill-name">
                      {cat.categoryName} - {cat.subCategoryName}
                    </span>
                    <span className="skill-level">Lv.{cat.level}</span>
                  </div>
                  <div className="skill-track">
                    <div
                      className="skill-bar"
                      style={{
                        width: `${(cat.level / maxLevel) * 100}%`,
                        backgroundColor:
                          cat.level >= 10
                            ? '#4cd964'
                            : cat.level >= 5
                              ? '#4facfe'
                              : '#ff9500',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-chart-message">
                아직 데이터가 충분하지 않습니다.
                <br />
                다양한 문제를 풀어보세요!
              </div>
            )}
          </div>
        </div>

        {/* 3. 활동 히트맵 (Grass) */}
        <div className="history-analysis-card">
          <div className="history-card-header">
            <h3 className="history-card-title">최근 등반 활동</h3>
          </div>
          <div className="activity-heatmap-container">
            <div className="heatmap-grid">
              {stats.heatmapData.map((day, idx) => (
                <div
                  key={idx}
                  className={`heatmap-cell intensity-${day.intensity}`}
                  title={`${day.date}: ${day.count}문제`}
                />
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="legend-cells">
                <div className="heatmap-cell intensity-0" />
                <div className="heatmap-cell intensity-1" />
                <div className="heatmap-cell intensity-2" />
                <div className="heatmap-cell intensity-3" />
                <div className="heatmap-cell intensity-4" />
              </div>
              <span>More</span>
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
              데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
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
        <div className="history-content">
          {/* Tab Switcher */}
          <div className="history-tab-container">
            <div className="history-segmented-control">
              <div
                className={`segmented-indicator ${activeTab === 'summary'
                  ? 'tab-summary'
                  : 'tab-analysis'
                  }`}
                style={{
                  width: '50%',
                  transform: activeTab === 'summary' ? 'translateX(0)' : 'translateX(100%)',
                }}
              />
              <button
                className={`segmented-item ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('summary');
                  vibrateShort();
                }}
              >
                일지
              </button>
              <button
                className={`segmented-item ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('analysis');
                  vibrateShort();
                }}
              >
                분석
              </button>
            </div>
          </div>

          <div className="history-tab-content">
            {activeTab === 'summary' ? renderProfileSection() : renderAnalysisSection()}
          </div>
        </div>
      </main>
      {renderRoadmapOverlay()}
      <FooterNav />
    </div>
  );
}
