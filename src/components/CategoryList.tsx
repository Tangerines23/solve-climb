import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { urls } from '../utils/navigation';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { useFeatureFlagStore } from '../stores/useFeatureFlagStore';
import { UnknownMountainCard } from './UnknownMountainCard';
import { Toast } from './Toast';
import { calculateCategoryAltitude } from '../utils/scoreCalculator';
import './CategoryList.css';

export function CategoryList() {
  const navigate = useNavigate();
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const [showExplorerToast, setShowExplorerToast] = useState<string | null>(null);

  const handleToggleFavorite = (e: React.MouseEvent, mountainId: string, mountainName: string) => {
    e.stopPropagation();
    addFavorite({
      type: 'category',
      categoryId: mountainId,
      name: mountainName,
    });
  };

  const handleMountainClick = (mountainId: string) => {
    // 산 선택 시 해당 산의 카테고리(기초, 논리 등) 선택 페이지로 이동
    navigate(urls.categorySelect({ mountain: mountainId }));
  };

  const { flags } = useFeatureFlagStore();

  // 활성화된 산 목록
  const mountains = (
    APP_CONFIG.MOUNTAINS as readonly {
      id: string;
      name: string;
      icon: string;
      disabled: boolean;
      color: string;
    }[]
  ).filter((mountain) => {
    if (mountain.id === 'math') return flags.ENABLE_MATH_MOUNTAIN;
    if (mountain.id === 'language') return flags.ENABLE_LANGUAGE_MOUNTAIN;
    if (mountain.id === 'logic') return flags.ENABLE_LOGIC_MOUNTAIN;
    if (mountain.id === 'general') return flags.ENABLE_GENERAL_MOUNTAIN;
    return true;
  });

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
