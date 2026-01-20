import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { TopicHeader } from '@/components/TopicHeader';
import { FooterNav } from '@/components/FooterNav';
import { urls } from '@/utils/navigation';
import './TopicSelectPage.css';

export function WorldSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mountainParam = searchParams.get('mountain');
  const categoryParam = searchParams.get('category');

  // [Phase 8] Persistence & Self-healing
  useEffect(() => {
    if (mountainParam) localStorage.setItem('last_visited_mountain', mountainParam);
    if (categoryParam) localStorage.setItem('last_visited_category', categoryParam);
  }, [mountainParam, categoryParam]);

  // 파라미터 결손 시 스토리지 기반 복구
  useEffect(() => {
    if (!mountainParam || !categoryParam) {
      const recMountain = mountainParam || localStorage.getItem('last_visited_mountain');
      const recCategory = categoryParam || localStorage.getItem('last_visited_category');

      if (
        recMountain &&
        recCategory &&
        APP_CONFIG.MOUNTAIN_MAP[recMountain as keyof typeof APP_CONFIG.MOUNTAIN_MAP] &&
        APP_CONFIG.CATEGORIES.find((c) => c.id === recCategory)
      ) {
        navigate(`${window.location.pathname}?mountain=${recMountain}&category=${recCategory}`, {
          replace: true,
        });
      }
    }
  }, [mountainParam, categoryParam, navigate]);

  const mountainName = mountainParam
    ? APP_CONFIG.MOUNTAIN_MAP[mountainParam as keyof typeof APP_CONFIG.MOUNTAIN_MAP]
    : null;
  const categoryInfo = categoryParam
    ? APP_CONFIG.CATEGORIES.find((c) => c.id === categoryParam)
    : null;

  // 예외 처리: mountain 또는 category 파라미터가 없거나 유효하지 않은 경우
  if (!mountainParam || !mountainName || !categoryParam || !categoryInfo) {
    return (
      <div className="topic-select-page">
        <TopicHeader title="잘못된 접근" onBack={() => navigate(urls.home(), { replace: true })} />
        <main className="topic-select-main">
          <div className="topic-select-content">
            <div className="error-message">
              <h2>잘못된 접근입니다</h2>
              <p>파라미터 정보가 유효하지 않습니다.</p>
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

  const worlds = APP_CONFIG.WORLDS.filter((w) => w.mountainId === mountainParam);

  const handleWorldClick = (worldId: string) => {
    if (!mountainParam || !categoryParam) return;
    // level-select 페이지로 이동 (mountain, category, world 파라미터 전달)
    navigate(
      urls.levelSelect({
        mountain: mountainParam,
        category: categoryParam,
        world: worldId,
      })
    );
  };

  return (
    <div className="topic-select-page">
      <TopicHeader
        title={categoryInfo.name}
        onBack={() => navigate(urls.categorySelect({ mountain: mountainParam }))}
      />
      <main className="topic-select-main">
        <div className="topic-select-content">
          <div className="topic-select-header-section">
            <h2 className="topic-select-category-title">{categoryInfo.name} - 테마 선택</h2>
          </div>
          <div id="topic-list-container" className="topic-list-container">
            {worlds.map((world) => {
              return (
                <a
                  key={world.id}
                  href={urls.levelSelect({
                    mountain: mountainParam,
                    category: categoryParam,
                    world: world.id,
                  })}
                  className="topic-card-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleWorldClick(world.id);
                  }}
                >
                  <div className="topic-card">
                    <div className="topic-card-left">
                      <span className="topic-icon">⛰️</span>
                      <div className="topic-text">
                        <h3 className="topic-name">{world.name}</h3>
                        <p className="topic-symbol">{world.desc}</p>
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
