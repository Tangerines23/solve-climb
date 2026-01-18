import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { urls } from '../../utils/navigation';
import type { Category, World } from '../../types/quiz';
import type { TodayChallenge } from '../../utils/challenge';

interface FavoriteItem {
  id: string;
  categoryId: string;
  subCategoryId?: string;
}

interface MyPageQuickAccessProps {
  todayChallenge: TodayChallenge | null;
  favorites: FavoriteItem[];
  setCategoryTopic: (category: Category, world: World) => void;
}

export function MyPageQuickAccess({
  todayChallenge,
  favorites,
  setCategoryTopic,
}: MyPageQuickAccessProps) {
  const navigate = useNavigate();

  return (
    <div className="my-page-quick-access">
      {/* 오늘의 챌린지 */}
      {todayChallenge && (
        <div className="my-page-quick-access-card">
          <div className="my-page-quick-access-header">
            <span className="my-page-quick-access-icon">🔥</span>
            <h3 className="my-page-quick-access-title">오늘의 챌린지</h3>
          </div>
          <p className="my-page-quick-access-description">{todayChallenge.title}</p>
          <button
            className="my-page-quick-access-button"
            onClick={() => {
              setCategoryTopic(todayChallenge.topicId as Category, 'World1' as World);
              navigate(urls.categorySelect({ mountain: todayChallenge.categoryId }));
            }}
          >
            도전하기
          </button>
        </div>
      )}

      {/* 즐겨찾는 카테고리 */}
      {favorites.length > 0 && (
        <div className="my-page-quick-access-card">
          <div className="my-page-quick-access-header">
            <span className="my-page-quick-access-icon">⭐</span>
            <h3 className="my-page-quick-access-title">즐겨찾기</h3>
          </div>
          <div className="my-page-favorites-list">
            {favorites.slice(0, 3).map((favorite) => {
              const categoryName =
                APP_CONFIG.CATEGORIES.find((c) => c.id === favorite.categoryId)?.name ||
                favorite.categoryId;
              let subCategoryName = '';
              if (favorite.subCategoryId) {
                const subTopics =
                  APP_CONFIG.SUB_TOPICS[
                    favorite.categoryId as keyof typeof APP_CONFIG.SUB_TOPICS
                  ] || [];
                const subTopic = subTopics.find((st) => st.id === favorite.subCategoryId);
                subCategoryName = subTopic?.name || favorite.subCategoryId;
              }

              return (
                <button
                  key={favorite.id}
                  className="my-page-favorite-item"
                  onClick={() => {
                    // favorite.categoryId가 산 ID인지 확인 (보통 mountain_category 형태일 수 있음)
                    // 현재 스키마에서는 mountainID를 별도로 저장하지 않으므로 기본값(math) 또는 추론 필요
                    const mountainId = 'math';
                    const lastWorld =
                      localStorage.getItem(`lastPlayedWorld_${mountainId}`) || 'World1';

                    if (favorite.subCategoryId) {
                      navigate(
                        urls.levelSelect({
                          mountain: mountainId,
                          world: lastWorld as any, // Cast if needed
                          category: favorite.categoryId as any,
                        })
                      );
                    } else {
                      navigate(urls.categorySelect({ mountain: favorite.categoryId }));
                    }
                  }}
                >
                  <span className="my-page-favorite-name">
                    {categoryName}
                    {subCategoryName && ` - ${subCategoryName}`}
                  </span>
                  <svg
                    className="my-page-favorite-arrow"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              );
            })}
          </div>
          {favorites.length > 3 && (
            <button className="my-page-favorites-more" onClick={() => navigate(urls.home())}>
              즐겨찾기 더보기 ({favorites.length - 3}개)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
