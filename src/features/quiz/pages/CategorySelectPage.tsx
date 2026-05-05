import { TopicHeader } from '../components/TopicHeader';
import { FooterNav } from '@/components/FooterNav';
import { useCategorySelect } from '../hooks/bridge/useCategorySelect';
import './CategorySelectPage.css';

export function CategorySelectPage() {
  const {
    mountainParam,
    mountainName,
    categories,
    lastWorld,
    bypassLevelLock,
    isFavorite,
    handleToggleFavorite,
    handleCategoryClick,
    getCategoryProgress,
    navigate,
    urls,
  } = useCategorySelect();

  // 예외 처리
  if (!mountainParam || !mountainName) {
    return (
      <div className="topic-select-page">
        <TopicHeader title="잘못된 접근" />
        <main className="topic-select-main">
          <div className="topic-select-content">
            <div className="error-message">
              <h2>잘못된 접근입니다</h2>
              <p>선택한 산 정보가 유효하지 않습니다.</p>
              <button
                onClick={() => navigate(urls.home(), { replace: true })}
                className="error-back-button"
              >
                ←
              </button>
            </div>
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }


  return (
    <div className="topic-select-page">
      <TopicHeader title={mountainName} onBack={() => navigate(urls.home())} />
      <main className="topic-select-main">
        <div className="topic-select-content">
          <div className="topic-select-header-section">
            <h2 className="topic-select-category-title">{mountainName} - 분야 선택</h2>
          </div>
          <div id="topic-list-container" className="topic-list-container">
            {categories.map((category) => {
              const unlockCondition = (
                category as { unlockCondition?: { categoryId: string; progress: number } }
              ).unlockCondition;
              let isLocked = false;
              let unlockMessage = '';

              if (unlockCondition && !bypassLevelLock) {
                // Check bypass flag
                const parentProgress = getCategoryProgress(lastWorld, unlockCondition.categoryId);
                if (parentProgress < unlockCondition.progress) {
                  isLocked = true;
                  unlockMessage = `${unlockCondition.categoryId} ${unlockCondition.progress}% 달성 시 해금`;
                }
              }

              const isFav = isFavorite(category.id);
              return (
                <a
                  key={category.id}
                  href={urls.levelSelect({
                    mountain: mountainParam,
                    world: lastWorld,
                    category: category.id,
                  })}
                  className={`topic-card-link ${isLocked ? 'is-locked' : ''} ${isFav ? 'favorite' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(category.id, isLocked);
                  }}
                >
                  <button
                    type="button"
                    className="topic-favorite-button"
                    aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    onClick={(e) => handleToggleFavorite(e, category.id, category.name)}
                    disabled={isLocked}
                  >
                    {isFav ? '⭐' : '☆'}
                  </button>
                  <div className="topic-card">
                    <div className="topic-card-left">
                      <span className="topic-icon">{isLocked ? '🔒' : category.icon}</span>
                      <div className="topic-text">
                        <h3 className="topic-name">{category.name}</h3>
                        {isLocked ? (
                          <p className="topic-unlock-condition">{unlockMessage}</p>
                        ) : (
                          <p className="topic-symbol">{category.symbol}</p>
                        )}
                      </div>
                    </div>
                    {!isLocked && <span className="topic-chevron">›</span>}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
