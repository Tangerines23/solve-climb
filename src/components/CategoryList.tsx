import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { UnknownMountainCard } from './UnknownMountainCard';
import { Toast } from './Toast';
import { calculateCategoryAltitude } from '../utils/scoreCalculator';
import './CategoryList.css';

export function CategoryList() {
  const navigate = useNavigate();
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const [showExplorerToast, setShowExplorerToast] = useState<string | null>(null);

  const handleMountainClick = (mountainId: string) => {
    // 산 선택 시 해당 산의 카테고리(기초, 논리 등) 선택 페이지로 이동
    navigate(`${APP_CONFIG.ROUTES.CATEGORY_SELECT}?mountain=${mountainId}`);
  };

  // 활성화된 산 목록
  const mountains = APP_CONFIG.MOUNTAINS;

  return (
    <div className="category-list-container">
      <h3 className="category-list-title">등반할 산 선택하기</h3>
      <div className="category-list">
        {mountains.map((mountain) => {
          const isFav = isFavorite(mountain.id);
          const { totalAltitude, totalProblems } = calculateCategoryAltitude(mountain.id);

          return (
            <div
              key={mountain.id}
              className={`category-item-card ${isFav ? 'favorite' : ''} ${mountain.disabled ? 'disabled' : ''}`}
            >
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
                className="category-climb-button"
                disabled={mountain.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMountainClick(mountain.id);
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
