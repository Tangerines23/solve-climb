import { useState, useEffect } from 'react';
import { WORLD_TIPS, CATEGORY_TIPS, type TipItem } from '../../constants/tips';
import './MyPageTipPreview.css';

type CategoryType = '기초' | '논리' | '대수' | '심화';
type WorldType = 'World1' | 'World2' | 'World3' | 'World4';

export function MyPageTipPreview() {
  const [category, setCategory] = useState<CategoryType>('기초');
  const [world, setWorld] = useState<WorldType>('World1');
  const [level, setLevel] = useState<number>(1);
  const [tip, setTip] = useState<TipItem | null>(null);

  // 각 조합별 최대 레벨 정의
  const getMaxLevel = (cat: CategoryType, wld: WorldType): number => {
    if (cat === '기초') {
      switch (wld) {
        case 'World1':
          return 30;
        case 'World2':
          return 14;
        case 'World3':
          return 15;
        case 'World4':
          return 15;
        default:
          return 1;
      }
    } else {
      // 대수, 논리, 심화는 World1만 존재
      switch (cat) {
        case '대수':
          return 20;
        case '논리':
          return 15;
        case '심화':
          return 15;
        default:
          return 1;
      }
    }
  };

  // 카테고리 변경 시 유효한 월드로 자동 보정
  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    if (newCat !== '기초') {
      setWorld('World1'); // 기초가 아니면 무조건 World1 고정
    }
    setLevel(1); // 레벨 1로 초기화
  };

  // 월드 변경 화살표 동작 (기초 카테고리에서만 작동)
  const handleWorldMove = (direction: 'prev' | 'next') => {
    if (category !== '기초') return;

    const worlds: WorldType[] = ['World1', 'World2', 'World3', 'World4'];
    const currentIndex = worlds.indexOf(world);
    let newIndex = currentIndex;

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? worlds.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === worlds.length - 1 ? 0 : currentIndex + 1;
    }

    setWorld(worlds[newIndex]!);
    setLevel(1); // 월드 변경 시 레벨 1로 초기화
  };

  // 레벨 변경 화살표 동작
  const handleLevelMove = (direction: 'prev' | 'next') => {
    const maxLevel = getMaxLevel(category, world);
    if (direction === 'prev') {
      setLevel((prev) => (prev === 1 ? maxLevel : prev - 1));
    } else {
      setLevel((prev) => (prev === maxLevel ? 1 : prev + 1));
    }
  };

  // 월드 및 레벨 정보 가져오기
  useEffect(() => {
    let selectedTip: TipItem | undefined;

    if (category === '기초') {
      selectedTip = WORLD_TIPS[world]?.[level];
    } else {
      selectedTip = CATEGORY_TIPS[category]?.[level];
    }

    if (selectedTip) {
      setTip(selectedTip);
    } else {
      setTip(null);
    }
  }, [category, world, level]);

  // 월드 한국어 이름 매핑
  const getWorldName = (wld: WorldType): string => {
    switch (wld) {
      case 'World1':
        return '수와 연산';
      case 'World2':
        return '도형과 공간';
      case 'World3':
        return '확률과 통계';
      case 'World4':
        return '공학 및 응용';
      default:
        return wld;
    }
  };

  return (
    <div className="my-page-tip-preview-card">
      <div className="my-page-tip-preview-header">
        <span className="my-page-tip-preview-icon">📖</span>
        <h3 className="my-page-tip-preview-title">예습복습 (게임팁 미리보기)</h3>
      </div>

      {/* 카테고리(분야) 선택 탭 */}
      <div className="my-page-tip-preview-tabs">
        {(['기초', '논리', '대수', '심화'] as CategoryType[]).map((cat) => (
          <button
            key={cat}
            className={`my-page-tip-preview-tab ${category === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 조작 화살표 영역 */}
      <div className="my-page-tip-preview-selectors">
        {/* 월드 선택 화살표 */}
        <div className={`my-page-tip-preview-selector ${category !== '기초' ? 'disabled' : ''}`}>
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleWorldMove('prev')}
            disabled={category !== '기초'}
            aria-label="이전 월드"
          >
            &lt;
          </button>
          <span className="my-page-tip-preview-selector-value">
            {category === '기초' ? getWorldName(world) : '월드 고정'}
          </span>
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleWorldMove('next')}
            disabled={category !== '기초'}
            aria-label="다음 월드"
          >
            &gt;
          </button>
        </div>

        {/* 레벨 선택 화살표 */}
        <div className="my-page-tip-preview-selector">
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleLevelMove('prev')}
            aria-label="이전 레벨"
          >
            &lt;
          </button>
          <span className="my-page-tip-preview-selector-value">
            레벨 {level} / {getMaxLevel(category, world)}
          </span>
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleLevelMove('next')}
            aria-label="다음 레벨"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* 팁 상세 정보 카드 */}
      {tip ? (
        <div className="my-page-tip-content-box animate-fade-in">
          <h4 className="my-page-tip-content-title">{tip.title}</h4>
          <div className="my-page-tip-content-body">
            <div className="my-page-tip-content-item">
              <span className="my-page-tip-label">💡 팁</span>
              <p className="my-page-tip-text">{tip.tip}</p>
            </div>
            {tip.strategy && (
              <div className="my-page-tip-content-item">
                <span className="my-page-tip-label">🎯 공략</span>
                <p className="my-page-tip-text">{tip.strategy}</p>
              </div>
            )}
            <div className="my-page-tip-content-example-box">
              <span className="my-page-tip-example-label">예시</span>
              <code className="my-page-tip-example-text">{tip.example}</code>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-page-tip-content-empty">팁 정보가 존재하지 않습니다.</div>
      )}
    </div>
  );
}
