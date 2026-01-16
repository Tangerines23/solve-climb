import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { TopicHeader } from '../components/TopicHeader';
import { FooterNav } from '../components/FooterNav';
import './TopicSelectPage.css';

export function CategorySelectPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mountainParam = searchParams.get('mountain');

    const mountainName = mountainParam ? APP_CONFIG.MOUNTAIN_MAP[mountainParam as keyof typeof APP_CONFIG.MOUNTAIN_MAP] : null;

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

    const categories = APP_CONFIG.CATEGORIES;

    const handleCategoryClick = (categoryId: string) => {
        // 마지막으로 플레이한 월드 가져오기 (기본값 World1)
        const lastWorld = localStorage.getItem('lastPlayedWorld') || 'World1';

        // level-select 페이지로 이동 (mountain, world, category 파라미터 전달)
        navigate(`/level-select?mountain=${mountainParam}&world=${lastWorld}&category=${categoryId}`);
    };

    return (
        <div className="topic-select-page">
            <TopicHeader
                title={mountainName}
                onBack={() => navigate('/')}
            />
            <main className="topic-select-main">
                <div className="topic-select-content">
                    <div className="topic-select-header-section">
                        <h2 className="topic-select-category-title">{mountainName} - 분야 선택</h2>
                    </div>
                    <div id="topic-list-container" className="topic-list-container">
                        {categories.map((category) => {
                            return (
                                <a
                                    key={category.id}
                                    href={`/level-select?mountain=${mountainParam}&world=World1&category=${category.id}`}
                                    className="topic-card-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCategoryClick(category.id);
                                    }}
                                >
                                    <div className="topic-card">
                                        <div className="topic-card-left">
                                            <span className="topic-icon">{category.icon}</span>
                                            <div className="topic-text">
                                                <h3 className="topic-name">{category.name}</h3>
                                                <p className="topic-symbol">{category.symbol}</p>
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
            <FooterNav />
        </div>
    );
}
