import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { ClimbGraphic } from '@/components/ClimbGraphic';
import { MyRecordCard } from '@/components/MyRecordCard';
import { LevelListCard } from '@/components/LevelListCard';
import { FooterNav } from '@/components/FooterNav';
import { Toast } from '@/components/Toast';
import { World, Category } from '@/types/quiz';
import { urls } from '@/utils/navigation';
import './LevelSelectPage.css';

export function LevelSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // [핵심 1] 화면 준비 상태 (초기엔 숨김)
  const [isReady, setIsReady] = useState(false);

  const mountainParam = searchParams.get('mountain');
  const worldParam = searchParams.get('world') as World | null;
  const categoryParam = searchParams.get('category') as Category | null;

  // [Phase 8] Persistence & Self-healing
  useEffect(() => {
    if (mountainParam) localStorage.setItem('last_visited_mountain', mountainParam);
    if (worldParam) localStorage.setItem('last_visited_world', worldParam);
    if (categoryParam) localStorage.setItem('last_visited_category', categoryParam);
  }, [mountainParam, worldParam, categoryParam]);

  // URL 파라미터 결손 시 자동 복구 리다이렉트
  useEffect(() => {
    if (!mountainParam || !worldParam || !categoryParam) {
      const recMountain = mountainParam || localStorage.getItem('last_visited_mountain');
      const recWorld = worldParam || localStorage.getItem('last_visited_world');
      const recCategory = categoryParam || localStorage.getItem('last_visited_category');

      if (recMountain && recWorld && recCategory) {
        // 모든 정보가 복구 가능하면 이동
        navigate(
          `${window.location.pathname}?mountain=${recMountain}&world=${recWorld}&category=${recCategory}`,
          { replace: true }
        );
      }
    }
  }, [mountainParam, worldParam, categoryParam, navigate]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;

    if (container) {
      const contentElement = container.querySelector('.level-select-content') as HTMLElement;

      if (contentElement) {
        const contentTop = contentElement.offsetTop;
        const viewportHeight = container.clientHeight;
        const visibleRatio = 0.75;
        const targetScrollTop = contentTop - viewportHeight * visibleRatio;
        container.scrollTop = targetScrollTop;
      }

      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }
  }, []);

  // URL 파라미터 검증 및 데이터 로드
  if (!mountainParam || !worldParam || !categoryParam) {
    return (
      <div className="level-select-page">
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
      </div>
    );
  }

  // 월드와 카테고리 정보 가져오기
  const worldName = APP_CONFIG.WORLD_MAP[worldParam as keyof typeof APP_CONFIG.WORLD_MAP];
  const categoryInfo = APP_CONFIG.CATEGORIES.find((cat) => cat.id === categoryParam);

  if (!worldName || !categoryInfo) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>존재하지 않는 월드 또는 카테고리입니다.</p>
          <button
            onClick={() => navigate(urls.home(), { replace: true })}
            className="error-back-button"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  // 레벨 데이터 가져오기
  const worldLevels = APP_CONFIG.LEVELS[
    worldParam as keyof typeof APP_CONFIG.LEVELS
  ] as unknown as Record<string, { level: number; name: string; description: string }[]>;
  const levels = worldLevels?.[categoryParam];

  if (!levels || levels.length === 0) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>레벨 데이터가 없습니다</h2>
          <p>이 카테고리에 대한 레벨이 아직 준비되지 않았습니다.</p>
          <button
            onClick={() => {
              // 안전한 복귀: category-select 또는 홈으로 (히스토리에서 에러 페이지 제거를 위해 replace: true)
              if (mountainParam) {
                navigate(urls.categorySelect({ mountain: mountainParam }), { replace: true });
              } else {
                navigate(urls.home(), { replace: true });
              }
            }}
            className="error-back-button"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  const categoryColor = categoryInfo.color || '#10b981';

  // 레벨 클릭 핸들러
  const handleLevelClick = (level: number) => {
    navigate(
      urls.quiz({
        mountain: mountainParam,
        world: worldParam,
        category: categoryParam,
        level,
        mode: 'time-attack',
      })
    );
  };

  // 잠긴 레벨 클릭 핸들러
  const handleLockedLevelClick = (_level: number, nextLevel: number) => {
    setToastMessage(`Level ${nextLevel}의 문제 10문제를 맞추고 와야 해요`);
    setShowToast(true);
  };

  // 서바이벌 모드 진입 핸들러
  const handleSurvivalClick = () => {
    navigate(
      urls.quiz({
        mountain: mountainParam,
        world: worldParam,
        category: categoryParam,
        level: 1,
        mode: 'survival',
      })
    );
  };

  // 월드 전환 핸들러
  const handleWorldChange = (direction: 'next' | 'prev') => {
    // 현재 산에 속한 월드만 필터링 (중요: 다른 산의 월드로 넘어가지 않도록 함)
    const validWorldIds = APP_CONFIG.WORLDS.filter((w) => w.mountainId === mountainParam).map(
      (w) => w.id
    );

    if (validWorldIds.length <= 1) return; // 전활할 월드가 없으면 무시

    const currentIndex = validWorldIds.indexOf(worldParam as World);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= validWorldIds.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = validWorldIds.length - 1;

    const nextWorld = validWorldIds[nextIndex];

    // 산별로 마지막 플레이 월드 분리 저장
    localStorage.setItem(`lastPlayedWorld_${mountainParam}`, nextWorld);
    navigate(
      urls.levelSelect({
        mountain: mountainParam,
        world: nextWorld,
        category: categoryParam,
      })
    );
  };

  return (
    <div
      className="level-select-page"
      data-world={worldParam || 'World1'}
      ref={scrollContainerRef}
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
      }}
    >
      {/* 상단 헤더 */}
      <header className="level-select-header">
        <button
          className="level-select-back"
          onClick={() => {
            navigate(urls.categorySelect({ mountain: mountainParam }));
          }}
        >
          ←
        </button>
        <div className="world-switcher">
          <button className="world-switch-btn prev" onClick={() => handleWorldChange('prev')}>
            ‹
          </button>
          <div className="world-info">
            <span className="world-label">{worldParam}</span>
            <h1 className="world-name">{worldName}</h1>
          </div>
          <button className="world-switch-btn next" onClick={() => handleWorldChange('next')}>
            ›
          </button>
        </div>
        <div className="header-right-placeholder" />
      </header>

      <div className="level-select-graphic-container">
        <ClimbGraphic
          world={worldParam}
          category={categoryParam}
          levels={levels}
          categoryColor={categoryColor}
          onLevelClick={handleLevelClick}
          onUnderDevelopmentClick={() => {
            setToastMessage('아직 개발중입니다 :(');
            setShowToast(true);
          }}
        />
      </div>

      <div className="level-select-content">
        <div className="level-select-summary">
          <h2 className="level-select-summary-title">{categoryInfo.name}</h2>
          <p className="level-select-summary-desc">{categoryInfo.symbol} 주제를 정복해보세요!</p>
        </div>

        <div className="survival-challenge-entry">
          <button className="survival-challenge-button" onClick={handleSurvivalClick}>
            <span className="survival-icon">🔥</span>
            <div className="survival-text">
              <span className="survival-title">서바이벌 챌린지</span>
              <span className="survival-desc">한 번의 실수도 용납되지 않는 무한 도전!</span>
            </div>
            <span className="survival-arrow">→</span>
          </button>
        </div>

        <MyRecordCard
          world={worldParam}
          category={categoryParam}
          categoryName={categoryInfo.name}
        />

        <LevelListCard
          world={worldParam}
          category={categoryParam}
          levels={levels}
          onLevelClick={handleLevelClick}
          onLockedLevelClick={handleLockedLevelClick}
        />
      </div>

      <FooterNav />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
}
