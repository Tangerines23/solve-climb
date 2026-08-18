import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { ClimbGraphic } from '@/components/ClimbGraphic';
import { MyRecordCard } from '@/components/MyRecordCard';
import { LevelListCard } from '@/components/LevelListCard';
import { FooterNav } from '@/components/FooterNav';
import { Toast } from '@/components/Toast';
import { World, Tier, Category } from '@/types/quiz';
import { urls } from '@/utils/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { MAP_LAYOUT } from '@/constants/stages';
import { useMapScroll } from '@/hooks/useMapScroll';
import { motion } from 'framer-motion';
import './LevelSelectPage.css';
import { storageService, STORAGE_KEYS } from '@/services';
import { useNavigationContext } from '@/hooks/useNavigationContext';

export function LevelSelectPage() {
  const navigate = useNavigate();
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  // const addFavorite = useFavoriteStore((state) => state.addFavorite);
  // const isFavorite = useFavoriteStore((state) => state.isFavorite);
  // const lastLongPressRef = useRef(0);

  // Game Tips Hook (Disabled: missing module)
  // const { isGameTipOpen, closeGameTip, currentGameTip } = useGameTips();

  // [핵심 1] 화면 준비 상태 (초기엔 숨김)
  const [isReady, setIsReady] = useState(false);

  const {
    mountain: mountainParam,
    world: worldParam,
    category: categoryParam,
    tryRecover,
  } = useNavigationContext();

  const mountainParamSafe = mountainParam || 'math';

  const [activeWorld, setActiveWorld] = useState<string>(worldParam || 'World1');
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam || '기초');

  // 레벨 데이터 가져오기 (스크롤 튕김 로직 및 컴포넌트 전반에 사용하기 위해 상단으로 선언부 호이스팅)
  const worldLevels = (APP_CONFIG.LEVELS[activeWorld as keyof typeof APP_CONFIG.LEVELS] ||
    {}) as unknown as Record<string, { level: number; name: string; description: string }[]>;
  const levels = worldLevels[activeCategory] || [];

  const [isSheetTransitioning, setIsSheetTransitioning] = useState(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [prevWorldParam, setPrevWorldParam] = useState(worldParam);
  const [prevCategoryParam, setPrevCategoryParam] = useState(categoryParam);

  if (worldParam && worldParam !== prevWorldParam && !isSheetTransitioning) {
    setPrevWorldParam(worldParam);
    setActiveWorld(worldParam);
  }

  if (categoryParam && categoryParam !== prevCategoryParam && !isSheetTransitioning) {
    setPrevCategoryParam(categoryParam);
    setActiveCategory(categoryParam);
  }

  const [tier] = useState<Tier>('normal'); // FIXME: 하드 티어 개발 완료 시 setTier 복구

  // [Phase 8] Persistence & Self-healing - URL 파라미터 결손 시 자동 복구 리다이렉트
  useEffect(() => {
    tryRecover(['mountain', 'world', 'category']);
  }, [tryRecover]);

  useLayoutEffect(() => {
    // 이제 스크롤 위치 제어는 ClimbGraphic 내부에서 더 정확하게(현재 레벨 기준) 처리하므로,
    // 여기서는 화면 준비 상태만 전환합니다.
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  // [수동 스크롤 드드득거림 방지] 터치(touchmove) 및 마우스 휠(wheel) 이벤트 가로채기
  useMapScroll(mapAreaRef, levels.length);

  // 최상단 산 정보마저 누락된 최악의 경우에만 홈으로 리다이렉트
  if (!mountainParam && !storageService.get<string>(STORAGE_KEYS.LAST_VISITED_MOUNTAIN)) {
    return (
      <PageLayout className="level-select-page" fullScreen>
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>필수 파라미터가 누락되었습니다.</p>
          <button
            onClick={() => navigate(urls.home(), { replace: true })}
            className="error-back-button"
          >
            ←
          </button>
        </div>
      </PageLayout>
    );
  }

  // 월드와 카테고리 정보 가져오기 (로컬 상태 및 기본값 기반으로 안전하게 복원하여 UI 깜빡임 방지)
  const worldInfo = APP_CONFIG.WORLDS.find((w) => w.id === activeWorld);
  const worldName =
    worldInfo?.name ||
    APP_CONFIG.WORLD_MAP[activeWorld as keyof typeof APP_CONFIG.WORLD_MAP] ||
    '알 수 없는 월드';
  const categoryInfo =
    APP_CONFIG.CATEGORIES.find((cat) => cat.id === activeCategory) || APP_CONFIG.CATEGORIES[0];

  // (레벨 데이터는 상단으로 호이스팅되어 통합 정의되었습니다)

  const categoryColor = categoryInfo.color || 'var(--color-teal-500)';

  // 모든 레벨 클리어 여부 확인 (필요 시 활용)
  // const categoryLevels = useLevelProgressStore(
  //   useShallow((state) => state.getLevelProgress(worldParam, categoryParam))
  // );

  // 레벨 클릭 핸들러
  const handleLevelClick = (level: number) => {
    navigate(
      urls.quiz({
        mountain: mountainParamSafe,
        world: activeWorld as World,
        category: activeCategory,
        level,
        mode: 'time-attack',
        tier,
      })
    );
  };

  // 잠긴 레벨 클릭 핸들러
  const handleLockedLevelClick = (_level: number, nextLevel: number) => {
    setToastMessage(`Level ${nextLevel}의 문제 10문제를 맞추고 와야 해요`);
    setShowToast(true);
  };

  // 레벨 길게 누르기 → 현재 카테고리 즐겨찾기 토글 (기존 LevelListCard long-press와 연결)
  const handleLevelLongPress = (_level: number) => {
    return; // 즐겨찾기 기능 일시 비활성화
  };

  // 서바이벌 모드 진입 핸들러
  const handleSurvivalClick = () => {
    navigate(
      urls.quiz({
        mountain: mountainParamSafe,
        world: activeWorld as World,
        category: activeCategory,
        level: 1,
        mode: 'survival',
        tier,
      })
    );
  };

  // 월드 전환 핸들러
  const handleWorldChange = (direction: 'next' | 'prev') => {
    // 애니메이션 진행 중이면 추가 전환 입력을 무시하여 핑퐁을 방지함
    if (isSheetTransitioning) return;

    // 현재 산에 속한 월드만 필터링 (중요: 다른 산의 월드로 넘어가지 않도록 함)
    const validWorldIds = APP_CONFIG.WORLDS.filter((w) => w.mountainId === mountainParamSafe).map(
      (w) => w.id
    );

    if (validWorldIds.length <= 1) return; // 전활할 월드가 없으면 무시

    const currentIndex = validWorldIds.indexOf(activeWorld as World);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= validWorldIds.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = validWorldIds.length - 1;

    const nextWorld = validWorldIds.at(nextIndex) ?? validWorldIds[0];

    // 1. Trigger bottom sheet sink animation (300ms)
    setIsSheetTransitioning(true);

    // 2. Perform actual URL change & state update after sheet sinks
    setTimeout(() => {
      storageService.set(STORAGE_KEYS.LAST_PLAYED_WORLD(mountainParamSafe), nextWorld);

      // 로컬 상태 먼저 업데이트 (시트 숨었을 때 텍스트 교체)
      setActiveWorld(nextWorld);

      navigate(
        urls.levelSelect({
          mountain: mountainParamSafe,
          world: nextWorld,
          category: activeCategory,
        }),
        { replace: true }
      );

      // 3. 텍스트 렌더링 완료 시간을 감안해 100ms 후에 시트를 다시 올림
      setTimeout(() => {
        setIsSheetTransitioning(false);
      }, 100);
    }, 300);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSheetExpanded) setIsSheetExpanded(false);

    const container = e.currentTarget;

    // 자동 스크롤 중이면 스크롤 리밋 감시 바이패스 (수동 진입만 감지/차단)
    if (container.getAttribute('data-auto-scrolling') === 'true') {
      return;
    }

    // 월드별 스크롤 최소 탑 리밋 제어 (활성화된 레벨 초과 영역 스크롤 진입 차단)
    const { FIXED_MAX_LEVELS, NODE_SPACING, LIST_DISTANCE, SCROLL_OFFSET } = MAP_LAYOUT;
    const clipOffset = (FIXED_MAX_LEVELS - levels.length) * NODE_SPACING;

    if (clipOffset > 0) {
      const containerWidth = container.clientWidth || MAP_LAYOUT.SVG_WIDTH;
      const scale = containerWidth / MAP_LAYOUT.SVG_WIDTH;

      const lastNodeY = LIST_DISTANCE;
      const firstNodeY = lastNodeY + (FIXED_MAX_LEVELS - 1) * NODE_SPACING;
      const svgHeight = firstNodeY + 100;

      const svgYOffset = svgHeight * (1 - scale);
      const minScrollTop = SCROLL_OFFSET + svgYOffset + clipOffset * scale;

      if (container.scrollTop < minScrollTop) {
        container.scrollTop = minScrollTop;

        // 터치 중이 아닐 때(관성 스크롤 단계)만 overflow-y를 일시 hidden 처리하여 관성만 차단
        if (container.getAttribute('data-is-touching') !== 'true') {
          const originalOverflow = container.style.overflowY;
          container.style.overflowY = 'hidden';
          requestAnimationFrame(() => {
            container.style.overflowY = originalOverflow;
          });
        }
      }
    }

    // 스크롤 렉 방지 최적화 (Decoupled 블러 스위칭): 스크롤 동작이 활성화되는 즉시 data-scrolling 플래그 부여
    const pageEl = container.closest('.level-select-page');
    if (pageEl) {
      if (!pageEl.hasAttribute('data-scrolling')) {
        pageEl.setAttribute('data-scrolling', 'true');
      }
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        pageEl.removeAttribute('data-scrolling');
      }, 350);
    }
  };

  return (
    <PageLayout
      className={`level-select-page ${isSheetExpanded ? 'sheet-expanded' : ''} ${
        isSheetTransitioning ? 'is-transitioning' : ''
      }`}
      data-world={activeWorld || 'World1'}
      fullScreen
    >
      {/* 상단 헤더 */}
      <header className="level-select-header">
        <button
          className="level-select-back"
          onClick={() => {
            navigate(urls.categorySelect({ mountain: mountainParamSafe }));
          }}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <div className="world-switcher">
          <button className="world-switch-btn prev" onClick={() => handleWorldChange('prev')}>
            ‹
          </button>
          <div className="world-info">
            <span className="world-label">
              {mountainParamSafe === 'language' ? 'LANG RIDGE' : 'MATH RIDGE'}
            </span>
            <h1 className="world-name">{worldName}</h1>
          </div>
          <button className="world-switch-btn next" onClick={() => handleWorldChange('next')}>
            ›
          </button>
        </div>
        <div className="header-right-placeholder" />
      </header>

      {/* 상단 맵 영역: 독립 스크롤 */}
      <div
        className="map-area"
        ref={mapAreaRef}
        onScroll={handleScroll}
        data-vg-ignore="true"
        onTouchStart={(e) => {
          if (isSheetExpanded) setIsSheetExpanded(false);
          e.currentTarget.setAttribute('data-is-touching', 'true');
        }}
        onTouchEnd={(e) => {
          e.currentTarget.removeAttribute('data-is-touching');
        }}
        onTouchCancel={(e) => {
          e.currentTarget.removeAttribute('data-is-touching');
        }}
      >
        <div className="level-select-graphic-container">
          <ClimbGraphic
            mountain={mountainParamSafe}
            world={activeWorld as World}
            category={activeCategory as Category}
            levels={levels}
            categoryColor={categoryColor}
            onLevelClick={handleLevelClick}
            onUnderDevelopmentClick={() => {
              setToastMessage('아직 개발중입니다 :(');
              setShowToast(true);
            }}
            isReady={isReady}
          />
        </div>
        {/* [Added] 빈 공간 클릭 시 시트 접기 위한 오버레이 */}
        {isSheetExpanded && (
          <div className="sheet-overlay" onClick={() => setIsSheetExpanded(false)} />
        )}
      </div>

      {/* 하단 시트: 레벨 리스트 및 상세 정보 */}
      <motion.div
        className="bottom-sheet"
        initial="collapsed"
        animate={isSheetTransitioning ? 'hidden' : isSheetExpanded ? 'expanded' : 'collapsed'}
        variants={{
          hidden: { y: '100%' },
          collapsed: { y: 'calc(80vh - 160px)' },
          expanded: { y: 0 },
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="sheet-handle-bar" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
          <div className="handle-indicator" />
        </div>

        <div className="sheet-header" onClick={() => setIsSheetExpanded(true)}>
          <div className="level-select-summary">
            <span className="level-select-summary-category">{categoryInfo.name}</span>
            <h2 className="level-select-summary-title" data-vg-ignore="true">
              {worldName}
            </h2>
            <p className="level-select-summary-desc">{worldInfo?.desc}</p>
          </div>
        </div>

        <div className="sheet-content">
          <div className="survival-challenge-entry">
            <button className="survival-challenge-button" onClick={handleSurvivalClick}>
              <span className="survival-icon">🔥</span>
              <div className="survival-text">
                <span className="survival-title">서바이벌 챌린지</span>
                <span className="survival-desc">
                  점점 빨라지는 한계 돌파! 무한 도전에 직면하세요.
                </span>
              </div>
              <span className="survival-arrow">→</span>
            </button>
          </div>

          <MyRecordCard
            world={activeWorld as World}
            category={activeCategory}
            categoryName={categoryInfo.name}
          />

          <LevelListCard
            world={activeWorld as World}
            category={activeCategory}
            levels={levels}
            onLevelClick={handleLevelClick}
            onLevelLongPress={handleLevelLongPress}
            onLockedLevelClick={handleLockedLevelClick}
            tier={tier}
          />
        </div>
      </motion.div>

      <FooterNav />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </PageLayout>
  );
}
