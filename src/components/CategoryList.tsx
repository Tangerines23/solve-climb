import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { calculateCategoryAltitude } from '../utils/scoreCalculator';
import { UnknownMountainCard } from './UnknownMountainCard';
import { Toast } from './Toast';
import './CategoryList.css';

const LONG_PRESS_DURATION = 500; // 0.5초

export function CategoryList() {
  const navigate = useNavigate();
  // Zustand Selector 패턴 적용
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const [showFavoriteToast, setShowFavoriteToast] = useState<string | null>(null);
  const [isFavoriteToastClosing, setIsFavoriteToastClosing] = useState(false);
  const [showExplorerToast, setShowExplorerToast] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const explorerToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const favoriteToastTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const newMessage = isFav ? `${categoryName} 즐겨찾기 해제` : `${categoryName} 즐겨찾기 추가`;

    // 기존 타이머 정리
    if (favoriteToastTimerRef.current) {
      clearTimeout(favoriteToastTimerRef.current);
      favoriteToastTimerRef.current = null;
    }

    // 현재 토스트가 표시 중이면 즉시 닫고 새 메시지 표시
    if (showFavoriteToast) {
      setIsFavoriteToastClosing(true);
      favoriteToastTimerRef.current = setTimeout(() => {
        setIsFavoriteToastClosing(false);
        setShowFavoriteToast(newMessage);
        favoriteToastTimerRef.current = setTimeout(() => {
          setIsFavoriteToastClosing(true);
          favoriteToastTimerRef.current = setTimeout(() => {
            setShowFavoriteToast(null);
            setIsFavoriteToastClosing(false);
            favoriteToastTimerRef.current = null;
          }, 300);
        }, 2000);
      }, 300);
    } else {
      setIsFavoriteToastClosing(false);
      setShowFavoriteToast(newMessage);
      favoriteToastTimerRef.current = setTimeout(() => {
        setIsFavoriteToastClosing(true);
        favoriteToastTimerRef.current = setTimeout(() => {
          setShowFavoriteToast(null);
          setIsFavoriteToastClosing(false);
          favoriteToastTimerRef.current = null;
        }, 300);
      }, 2000);
    }

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

  // 수학의 산과 언어의 산만 필터링
  const mainCategories = APP_CONFIG.CATEGORIES.filter(
    (category) => category.id === 'math' || category.id === 'language'
  );

  // 즐겨찾기된 카테고리를 먼저 표시
  const sortedCategories = [...mainCategories].sort((a, b) => {
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
          const { totalAltitude, totalProblems } = calculateCategoryAltitude(category.id);
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
                <span
                  className={`category-icon ${(category.id as string) === 'logic' || (category.id as string) === 'general' ? 'unknown-mountain' : ''}`}
                >
                  {(category.id as string) === 'logic' || (category.id as string) === 'general' ? (
                    <span className="unknown-mountain-icon">
                      <span className="mountain-silhouette">⛰️</span>
                      <span className="question-overlay">?</span>
                    </span>
                  ) : (
                    category.icon
                  )}
                </span>
                <div className="category-item-text">
                  <h4 className="category-item-title">{category.name}</h4>
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
        {/* 미지의 산 카드 */}
        <UnknownMountainCard
          onToast={(message) => {
            // 기존 타이머 정리
            if (explorerToastTimerRef.current) {
              clearTimeout(explorerToastTimerRef.current);
              explorerToastTimerRef.current = null;
            }

            // 현재 토스트가 표시 중이면 즉시 닫고 새 메시지 표시
            // Toast 컴포넌트가 자동으로 처리하므로 null로 설정 후 바로 새 메시지 설정
            if (showExplorerToast) {
              setShowExplorerToast(null);
              // 다음 렌더링 사이클에서 새 메시지 설정
              explorerToastTimerRef.current = setTimeout(() => {
                setShowExplorerToast(message);
                explorerToastTimerRef.current = null;
              }, 10);
            } else {
              setShowExplorerToast(message);
            }
          }}
        />
      </div>
      {showFavoriteToast && (
        <div className={`favorite-toast ${isFavoriteToastClosing ? 'closing' : ''}`}>
          {showFavoriteToast}
        </div>
      )}
      <Toast
        message={showExplorerToast || ''}
        isOpen={!!showExplorerToast}
        onClose={() => setShowExplorerToast(null)}
        autoCloseDelay={3000}
      />
    </div>
  );
}
