import { useState, useEffect, useCallback } from 'react';
import { GeometryTipVisualizer } from '@/components/geometry/GeometryTipVisualizer';
import { WORLD_TIPS, CATEGORY_TIPS, type TipItem } from '@/constants/tips';
import { generateQuestion, getSolutionProcess } from '@/features/quiz';
import { type QuizQuestion, type Topic, type World } from '@/types/quiz';
import { useToastStore } from '@/stores/useToastStore';
import './MyPageTipPreview.css';

type CategoryType = '기초' | '논리' | '대수' | '심화';
type WorldType = 'World1' | 'World2' | 'World3' | 'World4';

export function MyPageTipPreview() {
  const showToast = useToastStore((state) => state.showToast);
  const [category, setCategory] = useState<CategoryType>('기초');
  const [world, setWorld] = useState<WorldType>('World1');
  const [level, setLevel] = useState<number>(1);
  const [tip, setTip] = useState<TipItem | null>(null);
  const [sampleQuestion, setSampleQuestion] = useState<QuizQuestion | null>(null);
  const [solutionSteps, setSolutionSteps] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshSample = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // 실시간 예시 문제 및 풀이 과정 생성
  useEffect(() => {
    try {
      const topicId = category === '기초' ? `${world}-${category}` : `World1-${category}`;
      const targetWorld = category === '기초' ? world : 'World1';
      const q = generateQuestion('math', targetWorld as World, topicId as Topic, level, 'medium');
      setSampleQuestion(q);
      if (q) {
        const steps = getSolutionProcess(q.question, q.answer);
        setSolutionSteps(steps);
      } else {
        setSolutionSteps([]);
      }
    } catch (err) {
      console.error('Failed to generate sample question:', err);
      setSampleQuestion(null);
      setSolutionSteps([]);
    }
  }, [category, world, level, refreshTrigger]);

  // 각 조합별 최대 레벨 정의
  const getMaxLevel = (cat: CategoryType, wld: WorldType): number => {
    if (cat === '기초') {
      switch (wld) {
        case 'World1':
          return 30;
        case 'World2':
          return 15;
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

    const worlds: readonly WorldType[] = ['World1', 'World2', 'World3', 'World4'] as const;
    const currentIndex = worlds.indexOf(world);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex <= 0 ? worlds.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= worlds.length - 1 ? 0 : currentIndex + 1;
    }

    const nextWorld = worlds[newIndex];
    if (nextWorld) {
      setWorld(nextWorld);
      setLevel(1); // 월드 변경 시 레벨 1로 초기화
    }
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
      const worldGroup = Object.prototype.hasOwnProperty.call(WORLD_TIPS, world)
        ? WORLD_TIPS[world]
        : undefined;
      selectedTip =
        worldGroup && Object.prototype.hasOwnProperty.call(worldGroup, level)
          ? worldGroup[level]
          : undefined;
    } else {
      const categoryGroup = Object.prototype.hasOwnProperty.call(CATEGORY_TIPS, category)
        ? CATEGORY_TIPS[category]
        : undefined;
      selectedTip =
        categoryGroup && Object.prototype.hasOwnProperty.call(categoryGroup, level)
          ? categoryGroup[level]
          : undefined;
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
        {(['기초', '논리', '대수', '심화'] as CategoryType[]).map((cat) => {
          const isLocked = cat !== '기초';
          return (
            <button
              key={cat}
              className={`my-page-tip-preview-tab ${category === cat ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (isLocked) {
                  showToast(`${cat} 분야는 현재 잠겨 있습니다.`, '🔒');
                  return;
                }
                handleCategoryChange(cat);
              }}
            >
              {isLocked ? `🔒 ${cat}` : cat}
            </button>
          );
        })}
      </div>

      {/* 조작 화살표 영역 */}
      <div className="my-page-tip-preview-selectors">
        {/* 능선 선택 화살표 */}
        <div className={`my-page-tip-preview-selector ${category !== '기초' ? 'disabled' : ''}`}>
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleWorldMove('prev')}
            disabled={category !== '기초'}
            aria-label="이전 능선"
          >
            &lt;
          </button>
          <span className="my-page-tip-preview-selector-value">
            {category === '기초' ? `${getWorldName(world)} 능선` : '능선 고정'}
          </span>
          <button
            className="my-page-tip-preview-arrow-btn"
            onClick={() => handleWorldMove('next')}
            disabled={category !== '기초'}
            aria-label="다음 능선"
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
          {category === '기초' && world === 'World2' && <GeometryTipVisualizer level={level} />}
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
              <span className="my-page-tip-example-label">기본 예시</span>
              <code className="my-page-tip-example-text">{tip.example}</code>
            </div>

            {/* 실시간 예시 문제 & 풀이 과정 */}
            {sampleQuestion && (
              <div className="my-page-tip-live-sample-section">
                <div className="my-page-tip-live-sample-header">
                  <span className="my-page-tip-live-title">💡 실시간 예시 문제</span>
                  <button
                    className="my-page-tip-refresh-btn"
                    onClick={refreshSample}
                    title="새로운 문제 생성"
                  >
                    🔄 새 문제
                  </button>
                </div>

                <div className="my-page-tip-live-question-card">
                  <div className="live-question-row">
                    <span className="q-badge">Q</span>
                    <span className="question-text">{sampleQuestion.question}</span>
                  </div>
                  <div className="live-answer-row">
                    <span className="a-badge">A</span>
                    <span className="answer-text">정답: {sampleQuestion.answer}</span>
                  </div>
                </div>

                {solutionSteps.length > 0 && (
                  <div className="my-page-tip-solution-section">
                    <span className="my-page-tip-solution-title">🔍 풀이 과정</span>
                    <div className="my-page-tip-solution-timeline">
                      {solutionSteps.map((step, index) => {
                        const colonIndex = step.indexOf(':');
                        let stepTitle = '';
                        let stepBody = step;
                        if (colonIndex !== -1) {
                          stepTitle = step.slice(0, colonIndex).trim();
                          stepBody = step.slice(colonIndex + 1).trim();
                        }

                        // 백틱(`)으로 감싸진 텍스트를 <code> 태그 요소로 포맷팅
                        const parts = stepBody.split(/`([^`]+)`/g);
                        const formattedBody = parts.map((part, pIdx) => {
                          if (pIdx % 2 === 1) {
                            return <code key={pIdx}>{part}</code>;
                          }
                          return part;
                        });

                        return (
                          <div key={index} className="my-page-tip-solution-step-item">
                            {stepTitle && <span className="step-step-badge">{stepTitle}</span>}
                            <p className="step-step-content">{formattedBody}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="my-page-tip-content-empty">팁 정보가 존재하지 않습니다.</div>
      )}
    </div>
  );
}
