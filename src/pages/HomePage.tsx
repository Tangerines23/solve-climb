// src/pages/HomePage.tsx - 메인 랜딩 페이지
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { StatusCard } from '../components/StatusCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { CategoryList } from '../components/CategoryList';
import { FooterNav } from '../components/FooterNav';
import { Toast } from '../components/Toast';
import { StaminaGauge } from '../components/StaminaGauge';
import { APP_CONFIG } from '../config/app';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [showExitToast, setShowExitToast] = useState(false);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWaitingForSecondBackRef = useRef<boolean>(false);
  // 연령 등급 표기 (가이드 필수: 초기 화면 우측 상단에 3초 이상 표시)
  // 매번 HomePage 진입 시 표시 (컴포넌트 마운트 시마다)
  const [showAgeRating, setShowAgeRating] = useState(true);

  // 연령 등급 표기 (3초 후 자동 숨김)
  useEffect(() => {
    // 컴포넌트가 마운트될 때마다 표시
    setShowAgeRating(true);

    const timer = setTimeout(() => {
      setShowAgeRating(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 실행

  useEffect(() => {
    // 가이드: "진입 시 첫 화면에서는 백버튼을 사용하지 않아요"
    // 첫 진입 여부 확인 (히스토리 길이와 referrer 확인)
    const isFirstVisit = window.history.length <= 1 && document.referrer === '';

    // 첫 진입 시에는 뒤로가기 이벤트 리스너를 등록하지 않음
    if (isFirstVisit) {
      return;
    }

    const handleHomeBackButton = (event: CustomEvent) => {
      if (isWaitingForSecondBackRef.current) {
        // 두 번째 뒤로가기: 마이 페이지로 이동
        isWaitingForSecondBackRef.current = false;
        if (exitConfirmTimeoutRef.current) {
          clearTimeout(exitConfirmTimeoutRef.current);
          exitConfirmTimeoutRef.current = null;
        }
        setShowExitToast(false);
        navigate(APP_CONFIG.ROUTES.MY_PAGE, { replace: true });
      } else {
        // 첫 번째 뒤로가기: 토스트 메시지 표시
        isWaitingForSecondBackRef.current = true;
        setShowExitToast(true);

        // 3초 후 자동으로 토스트 닫기 및 상태 리셋
        if (exitConfirmTimeoutRef.current) {
          clearTimeout(exitConfirmTimeoutRef.current);
        }
        exitConfirmTimeoutRef.current = setTimeout(() => {
          setShowExitToast(false);
          isWaitingForSecondBackRef.current = false;
          exitConfirmTimeoutRef.current = null;
        }, 3000);
      }
    };

    window.addEventListener('home-back-button', handleHomeBackButton as EventListener);

    return () => {
      window.removeEventListener('home-back-button', handleHomeBackButton as EventListener);
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
      }
    };
  }, [navigate]);

  return (
    <div className="home-page">
      {/* 연령 등급 표기 (가이드 필수: 초기 화면 우측 상단에 3초 이상 표시) */}
      {/* 법적 요구사항: 충분한 크기와 가독성 확보 필요 */}
      {showAgeRating && (
        <div
          style={{
            position: 'fixed',
            top: `calc(var(--header-height-portrait) + var(--spacing-md))`,
            right: 'var(--spacing-lg)',
            zIndex: 10000,
            padding: 'var(--spacing-md) var(--spacing-xl)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--rounded-sm)',
            fontSize: '1rem', // 16px - 가독성을 위해 크게
            fontWeight: '600', // 더 굵게
            boxShadow: 'var(--shadow-card)',
            pointerEvents: 'none',
            border: '2px solid var(--color-blue-400)', // 명확한 구분을 위한 테두리
            minWidth: '120px', // 최소 너비 보장
            textAlign: 'center',
            letterSpacing: '0.5px', // 가독성 향상
          }}
        >
          전체 이용가
        </div>
      )}
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
      <Toast
        message="한 번 더 누르면 종료됩니다"
        isOpen={showExitToast}
        onClose={() => {
          setShowExitToast(false);
          isWaitingForSecondBackRef.current = false;
          if (exitConfirmTimeoutRef.current) {
            clearTimeout(exitConfirmTimeoutRef.current);
            exitConfirmTimeoutRef.current = null;
          }
        }}
        autoClose={false}
        icon="⚠️"
      />
    </div>
  );
}