import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import type { Category, Topic } from '../../types/quiz';
import type { TodayChallenge } from '../../utils/challenge';

interface FavoriteItem {
    id: string;
    categoryId: string;
    subCategoryId?: string;
}

interface MyPageQuickAccessProps {
    todayChallenge: TodayChallenge | null;
    favorites: FavoriteItem[];
    setCategoryTopic: (category: Category, topic: Topic) => void;
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
                            setCategoryTopic(
                                todayChallenge.category as Category,
                                todayChallenge.topicId as Topic
                            );
                            // setTimeLimit(60); // QuizPage handles this based on mode
                            navigate(
                                `${APP_CONFIG.ROUTES.GAME}?challenge=today&category=${todayChallenge.categoryId}&sub=${todayChallenge.topicId}&level=${todayChallenge.level}&mode=${todayChallenge.mode}`
                            );
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
                                        if (favorite.subCategoryId) {
                                            navigate(
                                                `/level-select?category=${favorite.categoryId}&sub=${favorite.subCategoryId}`
                                            );
                                        } else {
                                            navigate(`/subcategory?category=${favorite.categoryId}`);
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
                        <button
                            className="my-page-favorites-more"
                            onClick={() => navigate(APP_CONFIG.ROUTES.HOME)}
                        >
                            즐겨찾기 더보기 ({favorites.length - 3}개)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
