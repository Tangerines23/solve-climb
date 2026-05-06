import { Header } from '@/components/Header';
import { StatusCard, ChallengeCard, CategoryList, StaminaGauge } from '@/features/quiz';
import { FooterNav } from '@/components/FooterNav';
import { Toast } from '@/components/Toast';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { useHomePageBridge } from '@/hooks/useHomePageBridge';
import './HomePage.css';

export function HomePage() {
  const { showAgeRating, showExitToast, closeExitToast } = useHomePageBridge();

  return (
    <div className="home-page">
      {/* 연령 등급 표기 (가이드 필수: 초기 화면 우측 상단에 3초 이상 표시) */}
      {/* 법적 요구사항: 충분한 크기와 가독성 확보 필요 */}
      {/* 게임물관리위원회 공식 등급 마크 이미지 사용 권장 */}
      {/* 연령 등급 표기 - CSS 클래스를 사용하여 성능 및 구조 최적화 */}
      <div className={`age-rating-overlay ${showAgeRating ? 'visible' : ''}`}>
        <img
          src="/age-rating-all.webp"
          alt="전체 이용가"
          className="age-rating-icon"
          loading="eager"
          fetchPriority="high"
        />
        <span>전체 이용가</span>
      </div>
      <Header />
      <main className="home-main">
        <div className="home-content">
          <StaminaGauge />
          <StatusCard />
          <ChallengeCard />
          <CategoryList />
        </div>
      </main>
      <FooterNav />
      <DailyRewardModal />
      <Toast
        message="한 번 더 누르면 종료됩니다"
        isOpen={showExitToast}
        onClose={closeExitToast}
        autoClose={false}
        icon="⚠️"
      />
    </div>
  );
}
