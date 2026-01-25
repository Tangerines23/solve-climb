import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { TopicHeader } from '@/components/TopicHeader';
import { FooterNav } from '@/components/FooterNav';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { urls } from '@/utils/navigation';
import './CategorySelectPage.css';

import { useDebugStore } from '@/stores/useDebugStore'; // Added import

export function CategorySelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const progressStore = useLevelProgressStore();
  const bypassLevelLock = useDebugStore((state) => state.bypassLevelLock); // Added hook
  const mountainParam = searchParams.get('mountain');

  // [Phase 8] Persistence & Self-healing
  useEffect(() => {
    if (mountainParam) {
      localStorage.setItem('last_visited_mountain', mountainParam);
    }
  }, [mountainParam]);

  // 파라미터가 없을 때 스토리지에서 복구 시도
  useEffect(() => {
    if (!mountainParam) {
      const recoveredMountain = localStorage.getItem('last_visited_mountain');
      if (
        recoveredMountain &&
        APP_CONFIG.MOUNTAIN_MAP[recoveredMountain as keyof typeof APP_CONFIG.MOUNTAIN_MAP]
      ) {
        navigate(urls.categorySelect({ mountain: recoveredMountain }), { replace: true });
      }
    }
  }, [mountainParam, navigate]);

  const mountainName = mountainParam
    ? APP_CONFIG.MOUNTAIN_MAP[mountainParam as keyof typeof APP_CONFIG.MOUNTAIN_MAP]
    : null;

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

  const categories = APP_CONFIG.CATEGORIES.filter((c) => c.mountainId === mountainParam);

  // 산별로 저장된 마지막 월드 정보를 가져옴
  const lastWorld =
    localStorage.getItem(`lastPlayedWorld_${mountainParam}`) ||
    (mountainParam === 'language' ? 'LangWorld1' : 'World1');

  const getCategoryProgress = (world: string, categoryId: string) => {
    const levels = APP_CONFIG.LEVELS[world as keyof typeof APP_CONFIG.LEVELS] as unknown as Record<
      string,
      readonly unknown[]
    >;
    const categoryLevels = levels?.[categoryId];
    const totalLevels = categoryLevels?.length || 0;
    if (totalLevels === 0) return 0;

    const clearedLevels = progressStore
      .getLevelProgress(world, categoryId)
      .filter((l) => l.cleared).length;
    return Math.round((clearedLevels / totalLevels) * 100);
  };

  const handleCategoryClick = (categoryId: string, isLocked: boolean) => {
    if (isLocked || !mountainParam) return;
    navigate(
      urls.levelSelect({
        mountain: mountainParam,
        world: lastWorld,
        category: categoryId,
      })
    );
  };

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

              return (
                <a
                  key={category.id}
                  href={urls.levelSelect({
                    mountain: mountainParam,
                    world: lastWorld,
                    category: category.id,
                  })}
                  className={`topic-card-link ${isLocked ? 'is-locked' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(category.id, isLocked);
                  }}
                >
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
