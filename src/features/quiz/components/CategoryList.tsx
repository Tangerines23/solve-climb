import { UnknownMountainCard } from './UnknownMountainCard';
import { Toast } from '@/components/Toast';
import { useCategoryList } from '../hooks/bridge/useCategoryList';
import './CategoryList.css';

export function CategoryList() {
  const {
    mountains,
    isFavorite,
    showExplorerToast,
    setShowExplorerToast,
    handleToggleFavorite,
    handleMountainClick,
    getMountainAltitudeInfo,
  } = useCategoryList();

  return (
    <div className="category-list-container">
      <h3 className="category-list-title">등반할 산 선택하기</h3>
      <div className="category-list">
        {mountains.map((mountain) => {
          const isFav = isFavorite(mountain.id);
          const { totalAltitude, totalProblems } = getMountainAltitudeInfo(mountain.id);

          return (
            <div
              key={mountain.id}
              className={`category-item-card ${isFav ? 'favorite' : ''} ${mountain.disabled ? 'disabled' : ''}`}
            >
              <button
                type="button"
                className="category-favorite-button"
                aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                onClick={(e) => handleToggleFavorite(e, mountain.id, mountain.name)}
                disabled={mountain.disabled}
              >
                {isFav ? '⭐' : '☆'}
              </button>
              <div className="category-item-content">
                <span className="category-icon">{mountain.icon}</span>
                <div className="category-item-text">
                  <h4 className="category-item-title">{mountain.name}</h4>
                  <div className="category-altitude-info">
                    <p className="category-altitude-main">
                      누적 등반 <strong>{totalAltitude.toLocaleString()}m</strong>
                    </p>
                    <p className="category-altitude-sub">
                      총 {totalProblems.toLocaleString()}문제 해결
                    </p>
                  </div>
                </div>
              </div>
              <button
                className={`category-climb-button ${mountain.disabled ? 'disabled' : ''}`}
                data-category-id={mountain.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mountain.disabled) {
                    setShowExplorerToast('셰르파들이 안전한 길을 찾는 중입니다! (준비 중) ⛏️');
                  } else {
                    handleMountainClick(mountain.id);
                  }
                }}
              >
                {mountain.disabled ? '준비 중' : '등반하기'}
              </button>
            </div>
          );
        })}
        {/* 미지의 산 카드 */}
        <UnknownMountainCard
          onToast={(message) => {
            setShowExplorerToast(message);
          }}
        />
      </div>
      <Toast
        message={showExplorerToast || ''}
        isOpen={!!showExplorerToast}
        onClose={() => setShowExplorerToast(null)}
        autoCloseDelay={3000}
      />
    </div>
  );
}
