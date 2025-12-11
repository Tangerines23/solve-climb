// src/pages/HomePage.tsx - 메인 랜딩 페이지
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { StatusCard } from '../components/StatusCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { CategoryList } from '../components/CategoryList';
import { FooterNav } from '../components/FooterNav';
import { Toast } from '../components/Toast';
import { APP_CONFIG } from '../config/app';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [showExitToast, setShowExitToast] = useState(false);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWaitingForSecondBackRef = useRef<boolean>(false);

  useEffect(() => {
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
      <Header />
      <main className="home-main">
        <div className="home-content">
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