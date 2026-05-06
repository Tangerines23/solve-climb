import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { useNavigation } from '../../hooks/useNavigation';
import type { Category, World, TodayChallenge } from '@/features/quiz';

interface FavoriteItem {
  id: string;
  categoryId: string;
  subCategoryId?: string;
}

interface MyPageQuickAccessProps {
  todayChallenge: TodayChallenge | null;
  favorites: FavoriteItem[];
  setCategoryTopic: (category: Category, world: World) => void;
  getLastPlayedWorld: (mountainId: string) => string;
}

export function MyPageQuickAccess({
  todayChallenge,
  favorites,
  setCategoryTopic,
  getLastPlayedWorld,
}: MyPageQuickAccessProps) {
  const navigate = useNavigate();
  const { urls } = useNavigation();

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
              setCategoryTopic(todayChallenge.topicId! as Category, 'World1' as World);
              navigate(urls.categorySelect({ mountain: todayChallenge.categoryId! }));
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
                    // 산( mountain ) vs 카테고리( 기초, 논리 등 ) 구분: CATEGORIES에 있으면 카테고리 → levelSelect
                    const isCategoryId = APP_CONFIG.CATEGORIES.some(
                      (c) => c.id === favorite.categoryId
                    );
                    const mountainId = isCategoryId
                      ? (APP_CONFIG.CATEGORIES.find((c) => c.id === favorite.categoryId)
                          ?.mountainId ?? 'math')
                      : favorite.categoryId;
                    const lastWorld = getLastPlayedWorld(mountainId);

                    if (favorite.subCategoryId || isCategoryId) {
                      navigate(
                        urls.levelSelect({
                          mountain: mountainId,
                          world: lastWorld as World,
                          category: favorite.categoryId as Category,
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
