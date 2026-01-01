import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { SubCategoryHeader } from '../components/SubCategoryHeader';
import { FooterNav } from '../components/FooterNav';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { calculateSubTopicProgress, calculateCategoryProgress } from '../utils/scoreCalculator';
import './SubCategoryPage.css';

const LONG_PRESS_DURATION = 500; // 0.5초

export function SubCategoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  // Zustand Selector 패턴 적용
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const [showFavoriteToast, setShowFavoriteToast] = useState<string | null>(null);
  const [isFavoriteToastClosing, setIsFavoriteToastClosing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 예외 처리: category 파라미터가 없거나 유효하지 않은 경우
  if (
    !categoryParam ||
    !APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS]
  ) {
    return (
      <div className="subcategory-page">
        <SubCategoryHeader categoryId={null} />
        <main className="subcategory-main">
          <div className="subcategory-content">
            <div className="error-message">
              <h2>잘못된 접근입니다</h2>
              <p>존재하지 않는 카테고리입니다.</p>
              <button onClick={() => navigate('/')} className="error-back-button">
                ←
              </button>
            </div>
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }

  // config에서 주제 목록 가져오기 (동적 데이터)
  const topics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
  const categoryInfo = APP_CONFIG.CATEGORIES.find((cat) => cat.id === categoryParam);

  // 카테고리 전체 진행도 계산
  const { progressPercent: categoryProgressPercent } = calculateCategoryProgress(categoryParam);

  const handleTopicClick = (topicId: string) => {
    // level-select 페이지로 이동
    navigate(`/level-select?category=${categoryParam}&sub=${topicId}`);
  };

  const handleLongPress = (topicId: string, topicName: string) => {
    const favoriteId = `${categoryParam}_${topicId}`;
    const isFav = isFavorite(categoryParam, topicId);

    addFavorite({
      id: favoriteId,
      type: 'subcategory',
      categoryId: categoryParam,
      subCategoryId: topicId,
      name: `${categoryInfo?.name || ''} - ${topicName}`,
    });

    const newMessage = isFav ? `${topicName} 즐겨찾기 해제` : `${topicName} 즐겨찾기 추가`;

    // 현재 토스트가 표시 중이면 즉시 닫고 새 메시지 표시
    if (showFavoriteToast) {
      setIsFavoriteToastClosing(true);
      setTimeout(() => {
        setIsFavoriteToastClosing(false);
        setShowFavoriteToast(newMessage);
        setTimeout(() => {
          setIsFavoriteToastClosing(true);
          setTimeout(() => {
            setShowFavoriteToast(null);
            setIsFavoriteToastClosing(false);
          }, 300);
        }, 2000);
      }, 300);
    } else {
      setIsFavoriteToastClosing(false);
      setShowFavoriteToast(newMessage);
      setTimeout(() => {
        setIsFavoriteToastClosing(true);
        setTimeout(() => {
          setShowFavoriteToast(null);
          setIsFavoriteToastClosing(false);
        }, 300);
      }, 2000);
    }

    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTouchStart = (topicId: string, topicName: string) => {
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(topicId, topicName);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseDown = (topicId: string, topicName: string) => {
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(topicId, topicName);
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 즐겨찾기된 서브카테고리를 먼저 표시
  const sortedTopics = [...topics].sort((a, b) => {
    const aIsFavorite = isFavorite(categoryParam, a.id);
    const bIsFavorite = isFavorite(categoryParam, b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="subcategory-page">
      <SubCategoryHeader categoryId={categoryParam} />
      <main className="subcategory-main">
        <div className="subcategory-content">
          <div className="subcategory-header-section">
            <h2 className="subcategory-category-title">{categoryInfo?.name || '주제 선택'}</h2>
            <span className="subcategory-category-progress">{categoryProgressPercent}%</span>
          </div>
          <div id="topic-list-container" className="topic-list-container">
            {sortedTopics.map((topic) => {
              const isFav = isFavorite(categoryParam, topic.id);
              const { progressPercent, currentAltitude, targetAltitude } =
                calculateSubTopicProgress(categoryParam, topic.id);

              return (
                <a
                  key={topic.id}
                  href={`/level-select?category=${categoryParam}&sub=${topic.id}`}
                  className="topic-card-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTopicClick(topic.id);
                  }}
                  onTouchStart={() => handleTouchStart(topic.id, topic.name)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleMouseDown(topic.id, topic.name)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className={`topic-card ${isFav ? 'favorite' : ''}`}>
                    <div className="topic-card-left">
                      {isFav && <span className="favorite-star">⭐</span>}
                      <span className="topic-icon">{topic.icon}</span>
                      <div className="topic-text">
                        <h3 className="topic-name">{topic.name}</h3>
                        <div className="topic-altitude-info">
                          <p className="topic-altitude-text">
                            {currentAltitude.toLocaleString()}m / {targetAltitude.toLocaleString()}m
                          </p>
                          <div className="topic-progress-bar">
                            <div
                              className="topic-progress-bar-fill"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="topic-chevron">›</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </main>
      {showFavoriteToast && (
        <div className={`favorite-toast ${isFavoriteToastClosing ? 'closing' : ''}`}>
          {showFavoriteToast}
        </div>
      )}
      <FooterNav />
    </div>
  );
}
