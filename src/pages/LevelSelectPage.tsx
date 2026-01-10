import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { ClimbGraphic } from '../components/ClimbGraphic';
import { MyRecordCard } from '../components/MyRecordCard';
import { LevelListCard } from '../components/LevelListCard';
import { ModeSelectModal } from '../components/ModeSelectModal';
import { FooterNav } from '../components/FooterNav';
import { Toast } from '../components/Toast';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { storage } from '../utils/storage';
import './LevelSelectPage.css';

export function LevelSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedLevel, setSelectedLevel] = useState<{ level: number; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const longPressCountRef = useRef(0);

  // [핵심 1] 화면 준비 상태 (초기엔 숨김)
  const [isReady, setIsReady] = useState(false);

  const categoryParam = searchParams.get('category');
  const subParam = searchParams.get('sub');

  // 다음 레벨 가져오기 (early return 전에 호출)
  const getNextLevel = useLevelProgressStore((state) => state.getNextLevel);

  // Hooks를 early return 전에 호출
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;

    if (container) {
      // 1. 리스트 박스 요소를 찾습니다.
      const contentElement = container.querySelector('.level-select-content') as HTMLElement;

      if (contentElement) {
        // 2. 리스트 박스가 시작되는 절대 위치(Y)를 구합니다.
        const contentTop = contentElement.offsetTop;

        // 3. 현재 화면(뷰포트)의 높이를 구합니다.
        const viewportHeight = container.clientHeight;

        // [조절 포인트] 화면의 몇 % 지점에 리스트를 시작하게 할지 결정합니다.
        // 0.6 (60%) 정도면 사용자님이 보내주신 이미지처럼 타이틀과 요약만 보이고 목록은 아래에 숨습니다.
        // 숫자가 클수록 리스트가 더 아래로 내려갑니다. (0.5 ~ 0.7 사이 추천)
        const visibleRatio = 0.75;

        // 4. 절묘한 스크롤 위치 계산
        // "리스트의 시작점" - "화면의 60% 높이" = 리스트가 화면 60% 지점에 옴
        const targetScrollTop = contentTop - viewportHeight * visibleRatio;

        container.scrollTop = targetScrollTop;
      }

      // 5. 화면 공개
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }
  }, []); // 의존성 배열 비움: 마운트 시 1회 실행

  // 손을 떼면 카운터 리셋
  useEffect(() => {
    const handleMouseUp = () => {
      longPressCountRef.current = 0;
    };
    const handleTouchEnd = () => {
      longPressCountRef.current = 0;
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // URL 파라미터 검증 및 데이터 로드
  if (!categoryParam || !subParam) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>필수 파라미터가 누락되었습니다.</p>
          <button onClick={() => navigate('/')} className="error-back-button">
            ←
          </button>
        </div>
      </div>
    );
  }

  // 카테고리와 서브토픽 정보 가져오기
  const categoryInfo = APP_CONFIG.CATEGORIES.find((cat) => cat.id === categoryParam);
  const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
  const subTopicInfo = subTopics?.find((topic) => topic.id === subParam);

  if (!categoryInfo || !subTopicInfo) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>존재하지 않는 카테고리 또는 주제입니다.</p>
          <button onClick={() => navigate('/')} className="error-back-button">
            ←
          </button>
        </div>
      </div>
    );
  }

  // 레벨 데이터 가져오기
  const categoryLevels = APP_CONFIG.LEVELS[categoryParam as keyof typeof APP_CONFIG.LEVELS];
  const levels = categoryLevels?.[subParam as keyof typeof categoryLevels] as
    | Array<{ level: number; name: string; description: string }>
    | undefined;

  if (!levels || levels.length === 0) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>레벨 데이터가 없습니다</h2>
          <p>이 주제에 대한 레벨이 아직 준비되지 않았습니다.</p>
          <button onClick={() => navigate(-1)} className="error-back-button">
            ←
          </button>
        </div>
      </div>
    );
  }

  const categoryColor = categoryInfo.color || '#10b981';

  // 다음 레벨 계산
  const nextLevel = getNextLevel(categoryParam, subParam);

  // 개발중인 레벨 체크 함수
  const isUnderDevelopment = (level: number) => {
    const UNDER_DEVELOPMENT_LEVELS = new Set<string>([
      // 개발 중인 레벨이 있으면 여기에 추가 (카테고리_서브토픽_레벨 형식)
    ]);
    const levelKey = `${categoryParam}_${subParam}_${level}`;
    return UNDER_DEVELOPMENT_LEVELS.has(levelKey);
  };

  // 레벨 클릭 핸들러
  const handleLevelClick = (level: number, levelName: string) => {
    // 개발중인 레벨이면 토스트만 표시하고 진입 차단
    if (isUnderDevelopment(level)) {
      setToastMessage('아직 개발중입니다 :(');
      setShowToast(true);
      return;
    }
    setSelectedLevel({ level, name: levelName });
    setIsModalOpen(true);
  };

  // 레벨 길게 누르기 핸들러
  const handleLevelLongPress = (level: number) => {
    console.log(
      'LevelSelectPage: handleLevelLongPress 호출됨, level:',
      level,
      '현재 카운트:',
      longPressCountRef.current
    );
    longPressCountRef.current += 1;

    if (longPressCountRef.current === 1) {
      // 첫 번째 호출 (2초): 토스트 표시
      console.log('LevelSelectPage: 첫 번째 호출 - 토스트 표시');
      setToastMessage('다시 보지 않기가 풀립니다');
      setShowToast(true);
    } else if (longPressCountRef.current >= 2) {
      // 두 번째 호출 (4초): 실제 해제
      console.log('LevelSelectPage: 두 번째 호출 - 해제');
      const tipKey = `gameTip_${categoryParam}_${subParam}_${level}`;
      storage.remove(tipKey);
      setToastMessage('해제되었습니다!');
      setShowToast(true);
      // 다음 길게 누르기를 위해 리셋하지 않음 (손을 떼면 리셋됨)
    }
  };

  // 잠긴 레벨 클릭 핸들러
  const handleLockedLevelClick = (_level: number, _nextLevel: number) => {
    setToastMessage(`Level ${nextLevel}의 문제 10문제를 맞추고 와야 해요`);
    setShowToast(true);
  };

  // 모드 선택 핸들러
  const handleModeSelect = (mode: 'time-attack' | 'survival') => {
    const modeParam = mode === 'time-attack' ? 'time_attack' : 'survival';
    navigate(
      `/quiz?category=${categoryParam}&sub=${subParam}&level=${selectedLevel?.level}&mode=${modeParam}`
    );
  };

  // 스크롤 효과 제거 - 산 이미지는 가만히 있고 아래 리스트가 위로 올라오도록

  return (
    <div
      className="level-select-page"
      ref={scrollContainerRef}
      style={{
        // [핵심 3] 준비되기 전에는 투명하게(opacity: 0) 숨김
        // 준비되면(isReady: true) 즉시 보임(opacity: 1)
        opacity: isReady ? 1 : 0,
        // (선택) 부드럽게 나타나게 하려면 transition 추가 (깜빡임이 싫다면 제거)
        transition: 'opacity 0.2s ease-out',
      }}
    >
      {/* 상단 헤더 */}
      <header className="level-select-header">
        <button
          className="level-select-back"
          onClick={() => {
            // 이전 페이지(상위 페이지)로 이동
            if (categoryParam) {
              navigate(`/topic-select?category=${categoryParam}`);
            } else {
              navigate(-1);
            }
          }}
        >
          ←
        </button>
        <h1 className="level-select-title">{subTopicInfo.name}</h1>
      </header>

      {/* 메인 그래픽 영역 */}
      <div className="level-select-graphic-container">
        <ClimbGraphic
          category={categoryParam}
          subTopic={subParam}
          levels={levels}
          categoryColor={categoryColor}
          onLevelClick={handleLevelClick}
          onLevelLongPress={handleLevelLongPress}
          onUnderDevelopmentClick={() => {
            setToastMessage('아직 개발중입니다 :(');
            setShowToast(true);
          }}
        />
      </div>

      {/* 스크롤 콘텐츠 영역 */}
      <div className="level-select-content">
        {/* 주제 요약 타이틀 */}
        <div className="level-select-summary">
          <h2 className="level-select-summary-title">{subTopicInfo.name}</h2>
          <p className="level-select-summary-desc">{subTopicInfo.desc}</p>
        </div>

        {/* 나의 기록 카드 */}
        <MyRecordCard
          category={categoryParam}
          subTopic={subParam}
          subTopicName={subTopicInfo.name}
        />

        {/* 레벨 리스트 카드 */}
        <LevelListCard
          category={categoryParam}
          subTopic={subParam}
          levels={levels}
          onLevelClick={handleLevelClick}
          onLevelLongPress={handleLevelLongPress}
          onLockedLevelClick={handleLockedLevelClick}
        />
      </div>

      {/* 하단 네비게이션 */}
      <FooterNav />

      {/* 모드 선택 모달 */}
      {selectedLevel && (
        <ModeSelectModal
          isOpen={isModalOpen}
          level={selectedLevel.level}
          levelName={selectedLevel.name}
          onClose={() => setIsModalOpen(false)}
          onSelectMode={handleModeSelect}
        />
      )}

      {/* 토스트 메시지 */}
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
}
