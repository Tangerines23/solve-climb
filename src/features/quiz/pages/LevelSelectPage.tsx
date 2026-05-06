import { useRef } from 'react';
import { ClimbGraphic } from '../components/ClimbGraphic';
import { MyRecordCard } from '../components/MyRecordCard';
import { LevelListCard } from '../components/LevelListCard';
import { FooterNav } from '@/components/FooterNav';
import { Toast } from '@/components/Toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLevelSelectPageBridge } from '../hooks/bridge/useLevelSelectPageBridge';
import './LevelSelectPage.css';

export function LevelSelectPage() {
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const {
    mountainParam,
    worldParam,
    categoryParam,
    worldInfo,
    worldName,
    categoryInfo,
    categoryColor,
    levels,
    tier,
    isReady,
    isSheetExpanded,
    setIsSheetExpanded,
    toastMessage,
    showToast,
    setShowToast,
    handleLevelClick,
    handleLockedLevelClick,
    handleLevelLongPress,
    handleSurvivalClick,
    handleWorldChange,
    handleBack,
    handleHomeRedirect,
    handleCategorySelectRedirect,
    setToastMessage,
  } = useLevelSelectPageBridge();

  // URL 파라미터 검증 및 데이터 로드
  if (!mountainParam || !worldParam || !categoryParam) {
    return (
      <PageLayout className="level-select-page" fullScreen>
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>필수 파라미터가 누락되었습니다.</p>
          <button onClick={handleHomeRedirect} className="error-back-button">
            ←
          </button>
        </div>
      </PageLayout>
    );
  }

  if (!worldName || !categoryInfo) {
    return (
      <PageLayout className="level-select-page" fullScreen>
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>존재하지 않는 월드 또는 카테고리입니다.</p>
          <button onClick={handleHomeRedirect} className="error-back-button">
            ←
          </button>
        </div>
      </PageLayout>
    );
  }

  if (!levels || levels.length === 0) {
    return (
      <PageLayout className="level-select-page" fullScreen>
        <div className="level-select-error">
          <h2>레벨 데이터가 없습니다</h2>
          <p>이 카테고리에 대한 레벨이 아직 준비되지 않았습니다.</p>
          <button onClick={handleCategorySelectRedirect} className="error-back-button">
            ←
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      className={`level-select-page ${isSheetExpanded ? 'sheet-expanded' : ''}`}
      data-world={worldParam || 'World1'}
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
      }}
      fullScreen
    >
      {/* 상단 헤더 */}
      <header className="level-select-header">
        <button className="level-select-back" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <div className="world-switcher">
          <button className="world-switch-btn prev" onClick={() => handleWorldChange('prev')}>
            ‹
          </button>
          <div className="world-info">
            <span className="world-label">CURRENT WORLD</span>
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
        onScroll={() => {
          if (isSheetExpanded) setIsSheetExpanded(false);
        }}
        onTouchStart={() => {
          if (isSheetExpanded) setIsSheetExpanded(false);
        }}
      >
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
        {/* [Added] 빈 공간 클릭 시 시트 접기 위한 오버레이 */}
        {isSheetExpanded && (
          <div className="sheet-overlay" onClick={() => setIsSheetExpanded(false)} />
        )}
      </div>

      {/* 하단 시트: 레벨 리스트 및 상세 정보 */}
      <div className={`bottom-sheet ${isSheetExpanded ? 'expanded' : ''}`}>
        <div className="sheet-handle-bar" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
          <div className="handle-indicator" />
        </div>

        <div className="sheet-header" onClick={() => setIsSheetExpanded(true)}>
          <div className="level-select-summary">
            <span className="level-select-summary-category">{categoryInfo.name}</span>
            <h2 className="level-select-summary-title">{worldName}</h2>
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
            world={worldParam}
            category={categoryParam}
            categoryName={categoryInfo.name}
          />

          <LevelListCard
            world={worldParam}
            category={categoryParam}
            levels={levels}
            onLevelClick={handleLevelClick}
            onLevelLongPress={handleLevelLongPress}
            onLockedLevelClick={handleLockedLevelClick}
            tier={tier}
          />
        </div>
      </div>

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
