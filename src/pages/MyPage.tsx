import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { ProfileForm } from '../components/ProfileForm';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useProfileStore } from '../stores/useProfileStore';
import { APP_CONFIG } from '../config/app';
import { loginWithToss } from '../utils/tossAuth';
import './MyPage.css';

export function MyPage() {
  const navigate = useNavigate();
  const { profile, isProfileComplete, clearProfile, isAdmin, setProfile } = useProfileStore();
  const [showProfileForm, setShowProfileForm] = useState(!isProfileComplete);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTossLoginLoading, setIsTossLoginLoading] = useState(false);
  const [tossLoginError, setTossLoginError] = useState('');

  useEffect(() => {
    if (!isProfileComplete) {
      setShowProfileForm(true);
    }
  }, [isProfileComplete]);

  const handleProfileComplete = () => {
    setShowProfileForm(false);
  };

  const handleEditProfile = () => {
    setShowProfileForm(true);
  };

  const handleLogout = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    clearProfile();
    setShowProfileForm(true);
    setShowDeleteConfirm(false);
    // 모달이 닫히면 내부 상태가 자동으로 초기화됨
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleGoToRanking = () => {
    navigate(APP_CONFIG.ROUTES.RANKING);
  };

  const handleTossLogin = async () => {
    try {
      setIsTossLoginLoading(true);
      setTossLoginError('');
      
      const userInfo = await loginWithToss();
      
      // 프로필 업데이트 (토스 사용자 정보 반영)
      if (profile) {
        const updatedProfile = {
          ...profile,
          userId: userInfo.userKey.toString(),
          // name이나 phone 정보가 있으면 업데이트
        };
        setProfile(updatedProfile);
      }
      
      setIsTossLoginLoading(false);
    } catch (error) {
      console.error('토스 로그인 오류:', error);
      setTossLoginError(
        error instanceof Error 
          ? error.message 
          : '토스 로그인에 실패했습니다. 토스 앱 환경에서만 사용할 수 있습니다.'
      );
      setIsTossLoginLoading(false);
    }
  };

  if (showProfileForm) {
    return (
      <div className="my-page">
        <Header />
        <main className="my-page-main">
          <div className="my-page-content">
            <ProfileForm onComplete={handleProfileComplete} />
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="my-page">
      <Header />
      <main className="my-page-main">
        <div className="my-page-content">
          {/* 환영 메시지 */}
          <div className="welcome-card">
            <h1 className="welcome-title">
              {profile?.nickname}님 반가워요! 👋
            </h1>
            <p className="welcome-subtitle">
              오늘도 즐거운 퀴즈 시간 되세요!
            </p>
          </div>

          {/* 프로필 정보 */}
          <div className="profile-info-card">
            <div className="profile-info-header">
              <h2 className="profile-info-title">프로필</h2>
              <button className="edit-button" onClick={handleEditProfile}>
                수정
              </button>
            </div>
            <div className="profile-info-content">
              <div className="profile-avatar-large">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.nickname} />
                ) : (
                  <span className="avatar-placeholder-large">
                    {profile?.nickname.charAt(0)}
                  </span>
                )}
              </div>
              <div className="profile-details">
                <p className="profile-nickname">{profile?.nickname}</p>
                <p className="profile-joined">
                  가입일: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 토스 로그인 버튼 */}
          <div className="toss-login-card">
            <button
              className="toss-login-button"
              onClick={handleTossLogin}
              disabled={isTossLoginLoading}
            >
              {isTossLoginLoading ? (
                <>로딩 중...</>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ marginRight: '8px' }}>
                    <path
                      fill="#3182F6"
                      d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm5.568 7.5c-.276 0-.5.224-.5.5v2.5h-2.5c-.276 0-.5.224-.5.5s.224.5.5.5h2.5v2.5c0 .276.224.5.5.5s.5-.224.5-.5v-2.5h2.5c.276 0 .5-.224.5-.5s-.224-.5-.5-.5h-2.5V8c0-.276-.224-.5-.5-.5z"
                    />
                  </svg>
                  토스로 로그인하기
                </>
              )}
            </button>
            {tossLoginError && (
              <p className="toss-login-error">{tossLoginError}</p>
            )}
          </div>

          {/* 통계 카드 */}
          <div className="stats-card">
            <h2 className="stats-title">나의 통계</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">1,234</span>
                <span className="stat-label">종합 순위</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">8,500</span>
                <span className="stat-label">최고 점수</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">127</span>
                <span className="stat-label">총 게임 수</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">15%</span>
                <span className="stat-label">상위 퍼센트</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="action-buttons">
            <button className="action-button primary" onClick={handleGoToRanking}>
              랭킹 보기
            </button>
            <button className="action-button secondary" onClick={handleLogout}>
              프로필 삭제
            </button>
          </div>
        </div>
      </main>
      <FooterNav />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        nickname={profile?.nickname || ''}
        isAdmin={isAdmin}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

