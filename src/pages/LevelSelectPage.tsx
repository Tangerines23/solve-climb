import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { ClimbGraphic } from '../components/ClimbGraphic';
import { MyRecordCard } from '../components/MyRecordCard';
import { LevelListCard } from '../components/LevelListCard';
import { ModeSelectModal } from '../components/ModeSelectModal';
import { FooterNav } from '../components/FooterNav';
import './LevelSelectPage.css';

export function LevelSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrollY, setScrollY] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<{ level: number; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categoryParam = searchParams.get('category');
  const subParam = searchParams.get('sub');

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setScrollY(scrollContainerRef.current.scrollTop);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // URL 파라미터 검증 및 데이터 로드
  if (!categoryParam || !subParam) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>잘못된 접근입니다</h2>
          <p>필수 파라미터가 누락되었습니다.</p>
          <button onClick={() => navigate('/')} className="error-back-button">
            홈으로 돌아가기
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
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 레벨 데이터 가져오기
  const levels = APP_CONFIG.LEVELS[categoryParam as keyof typeof APP_CONFIG.LEVELS]?.[
    subParam as string
  ];

  if (!levels || levels.length === 0) {
    return (
      <div className="level-select-page">
        <div className="level-select-error">
          <h2>레벨 데이터가 없습니다</h2>
          <p>이 주제에 대한 레벨이 아직 준비되지 않았습니다.</p>
          <button onClick={() => navigate(-1)} className="error-back-button">
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // 카테고리별 색상 매핑
  const categoryColors: Record<string, string> = {
    math: '#10b981', // 녹색
    language: '#3b82f6', // 푸른색
    logic: '#8b5cf6', // 보라색
    general: '#f59e0b', // 주황색
  };

  const categoryColor = categoryColors[categoryParam] || '#10b981';

  // 레벨 클릭 핸들러
  const handleLevelClick = (level: number, levelName: string) => {
    setSelectedLevel({ level, name: levelName });
    setIsModalOpen(true);
  };

  // 모드 선택 핸들러
  const handleModeSelect = (mode: 'time-attack' | 'survival') => {
    const modeParam = mode === 'time-attack' ? 'time_attack' : 'survival';
    navigate(
      `/math-quiz?category=${categoryParam}&sub=${subParam}&level=${selectedLevel?.level}&mode=${modeParam}`
    );
  };

  // 스크롤 효과 제거 - 산 이미지는 가만히 있고 아래 리스트가 위로 올라오도록

  return (
    <div className="level-select-page" ref={scrollContainerRef}>
      {/* 상단 헤더 */}
      <header className="level-select-header">
        <button 
          className="level-select-back" 
          onClick={() => {
            // 이전 페이지(상위 페이지)로 이동
            if (categoryParam) {
              navigate(`/subcategory?category=${categoryParam}`);
            } else {
              navigate(-1);
            }
          }}
        >
          &lt;
        </button>
        <h1 className="level-select-title">{subTopicInfo.name}</h1>
        <button className="level-select-settings">⚙️</button>
      </header>

      {/* 메인 그래픽 영역 */}
      <div className="level-select-graphic-container">
        <ClimbGraphic
          category={categoryParam}
          subTopic={subParam}
          levels={levels}
          categoryColor={categoryColor}
          onLevelClick={handleLevelClick}
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
    </div>
  );
}

