import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import './CategoryList.css';

const LONG_PRESS_DURATION = 500; // 0.5초

export function CategoryList() {
  const navigate = useNavigate();
  const { favorites, addFavorite, isFavorite } = useFavoriteStore();
  const { progress } = useLevelProgressStore();
  const [showFavoriteToast, setShowFavoriteToast] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleCategoryClick = (categoryId: string) => {
    // SubCategory 페이지로 이동
    navigate(`${APP_CONFIG.ROUTES.SUB_CATEGORY}?category=${categoryId}`);
  };

  const handleLongPress = (categoryId: string, categoryName: string) => {
    const favoriteId = `${categoryId}_category`;
    const isFav = isFavorite(categoryId);
    
    addFavorite({
      id: favoriteId,
      type: 'category',
      categoryId,
      name: categoryName,
    });

    setShowFavoriteToast(isFav ? `${categoryName} 즐겨찾기 해제` : `${categoryName} 즐겨찾기 추가`);
    setTimeout(() => setShowFavoriteToast(null), 2000);

    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTouchStart = (categoryId: string, categoryName: string) => {
    touchStartTimeRef.current = Date.now();
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(categoryId, categoryName);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseDown = (categoryId: string, categoryName: string) => {
    touchStartTimeRef.current = Date.now();
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(categoryId, categoryName);
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 실제 레벨 진행 상황 계산
  const getProgress = (categoryId: string) => {
    const categoryProgress = progress[categoryId];
    if (!categoryProgress) {
      return 0;
    }

    // 해당 카테고리의 모든 서브토픽에서 클리어한 레벨 수 합산
    let totalCompleted = 0;
    const subTopics = APP_CONFIG.SUB_TOPICS[categoryId as keyof typeof APP_CONFIG.SUB_TOPICS] || [];
    
    subTopics.forEach((subTopic) => {
      const subTopicProgress = categoryProgress[subTopic.id];
      if (subTopicProgress) {
        // 클리어한 레벨 수 계산
        const clearedLevels = Object.values(subTopicProgress).filter(
          (record) => record.cleared
        ).length;
        totalCompleted += clearedLevels;
      }
    });

    return totalCompleted;
  };

  // 카테고리별 전체 레벨 수 계산
  const getTotalLevels = (categoryId: string) => {
    const subTopics = APP_CONFIG.SUB_TOPICS[categoryId as keyof typeof APP_CONFIG.SUB_TOPICS] || [];
    const levels = APP_CONFIG.LEVELS[categoryId as keyof typeof APP_CONFIG.LEVELS] || {};
    
    let total = 0;
    subTopics.forEach((subTopic) => {
      const subTopicLevels = levels[subTopic.id as keyof typeof levels];
      if (subTopicLevels && Array.isArray(subTopicLevels)) {
        total += subTopicLevels.length;
      }
    });

    return total;
  };

  // 즐겨찾기된 카테고리를 먼저 표시
  const sortedCategories = [...APP_CONFIG.CATEGORIES].sort((a, b) => {
    const aIsFavorite = isFavorite(a.id);
    const bIsFavorite = isFavorite(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="category-list-container">
      <h3 className="category-list-title">등반할 산 선택하기</h3>
      <div className="category-list">
        {sortedCategories.map((category) => {
          const completedLevels = getProgress(category.id);
          const totalLevels = getTotalLevels(category.id) || category.totalLevels;
          const isFav = isFavorite(category.id);

          return (
            <div
              key={category.id}
              className={`category-item-card ${isFav ? 'favorite' : ''}`}
              onTouchStart={() => handleTouchStart(category.id, category.name)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleMouseDown(category.id, category.name)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="category-item-content">
                {isFav && <span className="favorite-star">⭐</span>}
                <span className="category-icon">{category.icon}</span>
                <div className="category-item-text">
                  <h4 className="category-item-title">{category.name}</h4>
                  <p className="category-item-subtitle">
                    정복한 레벨: {completedLevels} / {totalLevels}
                  </p>
                </div>
              </div>
              <button
                className="category-climb-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryClick(category.id);
                }}
                data-category-id={category.id}
              >
                등반하기
              </button>
            </div>
          );
        })}
      </div>
      {showFavoriteToast && (
        <div className="favorite-toast">{showFavoriteToast}</div>
      )}
    </div>
  );
}

