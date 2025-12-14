import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { ProfileForm } from '../components/ProfileForm';
import { DataResetConfirmModal } from '../components/DataResetConfirmModal';
import { Toast } from '../components/Toast';
import { AlertModal } from '../components/AlertModal';
import { KeyboardInfoModal } from '../components/KeyboardInfoModal';
import { useProfileStore } from '../stores/useProfileStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMyPageStats } from '../hooks/useMyPageStats';
import { resetAllData } from '../utils/dataReset';
import { vibrateShort } from '../utils/haptic';
import { supabase } from '../utils/supabaseClient';
import { openLeaderboard } from '../utils/tossGameCenter';
import { APP_CONFIG } from '../config/app';
import { ENV } from '../utils/env';
import { handleTossLogin } from '../utils/tossLogin';
import { handleTossLoginFlow } from '../utils/tossAuth';
import './MyPage.css';

export function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Zustand Selector 패턴 적용
  const profile = useProfileStore((state) => state.profile);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const setIsAdmin = useProfileStore((state) => state.setIsAdmin);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled);
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const setKeyboardType = useSettingsStore((state) => state.setKeyboardType);
  const { stats, session, loading: statsLoading, error: statsError, refetch } = useMyPageStats();
  
  // URL 파라미터에서 showProfileForm 확인
  const shouldShowProfileForm = searchParams.get('showProfileForm') === 'true';
  const [showProfileForm, setShowProfileForm] = useState(!isProfileComplete || shouldShowProfileForm);
  const [showDataResetConfirm, setShowDataResetConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showKeyboardInfo, setShowKeyboardInfo] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const testerInputRef = useRef<string>('');
  const testerInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfileComplete = () => {
    setShowProfileForm(false);
    // URL 파라미터 제거
    navigate('/my-page', { replace: true });
    refetch(); // 프로필 완성 후 통계 다시 불러오기
  };

  // URL 파라미터 변경 감지
  useEffect(() => {
    if (shouldShowProfileForm) {
      setShowProfileForm(true);
    }
  }, [shouldShowProfileForm]);

  const handleToggleHaptic = () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    if (newValue) {
      vibrateShort();
    }
    setToastMessage(newValue ? '진동이 켜졌습니다' : '진동이 꺼졌습니다');
    setShowToast(true);
  };

  const handleKeyboardTypeChange = (type: 'custom' | 'qwerty') => {
    setKeyboardType(type);
    setToastMessage(type === 'custom' ? '커스텀 키패드로 변경되었습니다' : '쿼티 키보드로 변경되었습니다');
    setShowToast(true);
  };

  const handleDataReset = () => {
    setShowDataResetConfirm(true);
  };

  const handleConfirmDataReset = async () => {
    try {
      setIsResetting(true);
      await resetAllData();
      setShowDataResetConfirm(false);
      setToastMessage('모든 데이터가 초기화되었습니다.');
      setShowToast(true);
      setShowProfileForm(true);
      refetch(); // 데이터 초기화 후 통계 다시 불러오기
    } catch (error) {
      console.error('Failed to reset data:', error);
      setToastMessage('데이터 초기화 중 오류가 발생했습니다.');
      setShowToast(true);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancelDataReset = () => {
    setShowDataResetConfirm(false);
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent('[Solve Climb] 의견 보내기');
    const body = encodeURIComponent('안녕하세요,\n\n의견을 남겨주세요:\n\n');
    window.location.href = `mailto:support@solveclimb.com?subject=${subject}&body=${body}`;
  };

  // ⚠️ 출시 전 확인 필요: 키보드 입력으로 테스터(관리자) 로그인 기능
  // 이 기능은 개발/테스트 목적으로만 사용하며, 출시 전에 제거하거나 
  // 더 안전한 인증 방식으로 교체해야 합니다.
  const handleTesterLogin = useCallback(async () => {
    try {
      // Supabase 인증 없이 로컬에서만 세션 관리
      // 테스터 프로필 설정
      const testerProfile = {
        profileId: `tester_${Date.now()}`,
        nickname: 'tester',
        createdAt: new Date().toISOString(),
        isAdmin: true,
      };

      setProfile(testerProfile);
      setIsAdmin(true);

      // 로컬 세션 저장 (Supabase 인증 없이)
      try {
        localStorage.setItem('solve-climb-local-session', JSON.stringify({
          userId: 'tester',
          isAdmin: true,
          loginTime: new Date().toISOString(),
        }));
      } catch (e) {
        console.warn('Failed to save local session:', e);
      }

      // 로그인 성공 후 통계 다시 불러오기
      await refetch();
      setToastMessage('테스터로 로그인되었습니다.');
      setShowToast(true);
      setLoginError(false);
      testerInputRef.current = '';
    } catch (error) {
      console.error('Tester login error:', error);
      setToastMessage(`테스터 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setShowToast(true);
    }
  }, [setProfile, setIsAdmin, refetch]);

  // 토스 로그인 함수
  const handleLogin = async () => {
    try {
      setLoginError(false);
      
      // 1. 토스 로그인 실행 (인가 코드 받기)
      const loginResult = await handleTossLogin();
      
      if (!loginResult.success || !loginResult.authorizationCode) {
        const errorMessage = loginResult.error || '토스 로그인에 실패했습니다.';
        setToastMessage(errorMessage);
        setShowToast(true);
        setLoginError(true);
        return;
      }

      // 2. 인가 코드로 AccessToken 받기 및 Supabase 사용자 생성/로그인
      const { user, session } = await handleTossLoginFlow(
        loginResult.authorizationCode,
        loginResult.referrer || 'DEFAULT'
      );

      if (!user || !session) {
        throw new Error('로그인 세션을 생성할 수 없습니다.');
      }

      // 3. 프로필 설정
      const userProfile = {
        profileId: user.id,
        nickname: user.user_metadata?.tossName || user.user_metadata?.tossUserKey?.toString() || '게이머',
        userId: user.id,
        email: user.email,
        createdAt: user.created_at || new Date().toISOString(),
        isAdmin: false,
      };

      setProfile(userProfile);

      // 4. 로그인 성공 후 통계 다시 불러오기
      await refetch();
      setToastMessage('토스 로그인에 성공했습니다!');
      setShowToast(true);
      setLoginError(false);
    } catch (error) {
      console.error('Toss login error:', error);
      const errorMessage = error instanceof Error ? error.message : '토스 로그인 중 오류가 발생했습니다.';
      setToastMessage(errorMessage);
      setShowToast(true);
      setLoginError(true);
    }
  };

  // 익명 로그인 함수 (로컬 세션만 사용)
  const handleOpenLeaderboard = async () => {
    const result = await openLeaderboard((message) => {
      // 에러 메시지를 AlertModal로 표시
      setAlertMessage(message);
      setShowAlert(true);
    });
    
    // 결과가 실패이고 메시지가 없으면 기본 메시지 표시
    if (!result.success && result.message) {
      setAlertMessage(result.message);
      setShowAlert(true);
    } else if (!result.success) {
      setAlertMessage('리더보드를 열 수 없습니다.');
      setShowAlert(true);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoginError(false);
      
      // 로컬 세션만 사용 (Supabase 인증 없이)
      const userProfile = {
        profileId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname: '게이머',
        createdAt: new Date().toISOString(),
        isAdmin: false,
      };

      setProfile(userProfile);

      // 로컬 세션 저장
      try {
        localStorage.setItem('solve-climb-local-session', JSON.stringify({
          userId: userProfile.profileId,
          isAdmin: false,
          loginTime: new Date().toISOString(),
          loginType: 'anonymous',
        }));
      } catch (e) {
        console.warn('Failed to save local session:', e);
      }
      
      // 로그인 성공 후 통계 다시 불러오기
      await refetch();
      setToastMessage('익명으로 로그인되었습니다.');
      setShowToast(true);
    } catch (error) {
      console.error('Anonymous login error:', error);
      setToastMessage('익명 로그인 중 오류가 발생했습니다.');
      setShowToast(true);
      setLoginError(true);
    }
  };

  // ⚠️ 출시 전 확인 필요: 키보드 입력으로 테스터(관리자) 로그인 감지
  // 이 기능은 개발/테스트 목적으로만 사용하며, 출시 전에 제거해야 합니다.
  useEffect(() => {
    // 로그인 오류가 없고 세션이 있으면 리스너 등록 안 함
    if (!loginError && session) {
      testerInputRef.current = '';
      return;
    }

    const handleKeyDown = async (event: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시 (실제 입력 중일 때)
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // 모바일 키보드가 아닌 물리적 키보드만 감지
      // event.isComposing은 IME 입력 중인지 확인
      if (event.isComposing || event.key === 'Process') {
        return;
      }

      // 알파벳만 처리
      if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
        const char = event.key.toLowerCase();
        
        // 기존 입력 타임아웃 클리어
        if (testerInputTimeoutRef.current) {
          clearTimeout(testerInputTimeoutRef.current);
        }

        // "tester" 문자열과 비교
        const expectedChar = 'tester'[testerInputRef.current.length];
        
        if (char === expectedChar) {
          testerInputRef.current += char;
          
          // "tester" 완성 확인
          if (testerInputRef.current === 'tester') {
            event.preventDefault(); // 기본 동작 방지
            await handleTesterLogin();
            testerInputRef.current = '';
            return;
          }

          // 3초 내에 다음 문자를 입력하지 않으면 리셋
          testerInputTimeoutRef.current = setTimeout(() => {
            testerInputRef.current = '';
          }, 3000);
        } else {
          // 잘못된 문자 입력 시 리셋
          testerInputRef.current = '';
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        // 백스페이스나 삭제 키 입력 시 리셋
        testerInputRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (testerInputTimeoutRef.current) {
        clearTimeout(testerInputTimeoutRef.current);
      }
    };
  }, [loginError, session, handleTesterLogin]);

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // Supabase 세션이 있으면 로그아웃
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        await supabase.auth.signOut();
      }

      // 로컬 세션 삭제
      try {
        localStorage.removeItem('solve-climb-local-session');
      } catch (e) {
        console.warn('Failed to remove local session:', e);
      }

      // 로컬 상태 초기화
      clearProfile();
      
      setToastMessage('로그아웃되었습니다.');
      setShowToast(true);
      
      // 통계 다시 불러오기 (세션 없음 상태로)
      await refetch();
    } catch (error) {
      console.error('Logout error:', error);
      setToastMessage('로그아웃 중 오류가 발생했습니다.');
      setShowToast(true);
    }
  };

  // Guest View (비로그인 상태)
  if (!session && !statsLoading) {
    return (
      <div className="my-page">
        <Header />
        <main className="my-page-main">
          <div className="my-page-content">
            <div className="my-page-guest-view">
              <div className="my-page-guest-icon">🔒</div>
              <h1 className="my-page-guest-title">
                로그인하고<br />
                <strong className="my-page-guest-highlight">내 기록을 평생 간직하세요.</strong>
              </h1>
              <div className="my-page-guest-buttons">
                <button
                  className="my-page-guest-login-button"
                  onClick={handleLogin}
                >
                  3초 만에 시작하기
                </button>
                <button
                  className="my-page-guest-anonymous-link"
                  onClick={handleAnonymousLogin}
                >
                  익명 로그인하기
                </button>
              </div>
            </div>
          </div>
        </main>
        <FooterNav />
        <Toast
          message={toastMessage}
          isOpen={showToast}
          onClose={() => setShowToast(false)}
          icon="⚠️"
        />
        <AlertModal
          isOpen={showAlert}
          title="알림"
          message={alertMessage || '리더보드를 열 수 없습니다.'}
          onClose={() => setShowAlert(false)}
        />
      </div>
    );
  }

  if (showProfileForm) {
    return (
      <div className="my-page">
        <Header />
        <main className="my-page-main">
          <div className="my-page-content">
            <ProfileForm onComplete={handleProfileComplete} showBackButton={isProfileComplete} />
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
          {/* Header: Profile & Summary */}
          <div className="my-page-header">
            <div className="my-page-profile-icon">🧗</div>
            <h1 className="my-page-header-title">
              지금까지<br />
              <strong className="my-page-header-highlight">
                {statsLoading ? '...' : (stats?.totalHeight || 0).toLocaleString()}m
              </strong>
              를 올랐어요!
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="my-page-stats-grid">
            <div className="my-page-stat-card">
              <div className="my-page-stat-label">완등 문제</div>
              <div className="my-page-stat-value">
                {statsLoading ? '...' : (stats?.totalSolved || 0).toLocaleString()}개
              </div>
            </div>
            <div className="my-page-stat-card">
              <div className="my-page-stat-label">최고 레벨</div>
              <div className="my-page-stat-value">
                {statsLoading ? '...' : stats?.maxLevel ? `Lv. ${stats.maxLevel}` : 'Lv. 0'}
              </div>
            </div>
            <div className="my-page-stat-card">
              <div className="my-page-stat-label">주력 분야</div>
              <div className="my-page-stat-value">
                {statsLoading ? '...' : stats?.bestSubject || '-'}
              </div>
            </div>
            <div className="my-page-stat-card my-page-stat-card-clickable" onClick={handleOpenLeaderboard}>
              <div className="my-page-stat-label">내 랭킹</div>
              <div className="my-page-stat-value">명예의 전당 🏆</div>
            </div>
          </div>

          {/* Settings List */}
          <div className="my-page-settings">
            {/* 환경 설정 섹션 */}
            <div className="my-page-settings-section">
              <h2 className="my-page-settings-section-title">환경 설정</h2>
              <div className="my-page-settings-list">
                <div className="my-page-settings-item">
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label">진동</span>
                  </div>
                  <label className="my-page-settings-toggle">
                    <input
                      type="checkbox"
                      checked={hapticEnabled}
                      onChange={handleToggleHaptic}
                    />
                    <span className="my-page-settings-toggle-slider"></span>
                  </label>
                </div>
                <button
                  className="my-page-settings-item my-page-settings-item-button"
                  onClick={() => setShowKeyboardInfo(true)}
                >
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label">키보드</span>
                  </div>
                  <svg
                    className="my-page-settings-item-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 데이터 관리 섹션 */}
            <div className="my-page-settings-section">
              <h2 className="my-page-settings-section-title">데이터</h2>
              <div className="my-page-settings-list">
                <button
                  className="my-page-settings-item my-page-settings-item-button"
                  onClick={handleDataReset}
                  disabled={isResetting}
                >
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label">초기화</span>
                  </div>
                  <svg
                    className="my-page-settings-item-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 앱 정보 섹션 */}
            <div className="my-page-settings-section">
              <h2 className="my-page-settings-section-title">앱 정보</h2>
              <div className="my-page-settings-list">
                <div className="my-page-settings-item">
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label">버전</span>
                  </div>
                  <span className="my-page-settings-item-value">{APP_CONFIG.APP_VERSION}</span>
                </div>
                {ENV.IS_DEVELOPMENT && (
                  <button
                    className="my-page-settings-item my-page-settings-item-button"
                    onClick={() => navigate('/auth/test')}
                  >
                    <div className="my-page-settings-item-content">
                      <span className="my-page-settings-item-label">인증 테스트</span>
                    </div>
                    <svg
                      className="my-page-settings-item-arrow"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 15L12.5 10L7.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <button
                  className="my-page-settings-item my-page-settings-item-button"
                  onClick={handleSendFeedback}
                >
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label">의견 보내기</span>
                  </div>
                  <svg
                    className="my-page-settings-item-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* 로그아웃 섹션 */}
            <div className="my-page-settings-section">
              <div className="my-page-settings-list">
                <button
                  className="my-page-settings-item my-page-settings-item-button my-page-settings-item-logout"
                  onClick={handleLogout}
                >
                  <div className="my-page-settings-item-content">
                    <span className="my-page-settings-item-label my-page-settings-item-logout-label">로그아웃</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 에러 메시지 (있는 경우) */}
          {statsError && (
            <div className="my-page-error">
              <p>{statsError}</p>
            </div>
          )}
        </div>
      </main>
      <FooterNav />
      <DataResetConfirmModal
        isOpen={showDataResetConfirm}
        onConfirm={handleConfirmDataReset}
        onCancel={handleCancelDataReset}
      />
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        icon="⚠️"
      />
      <AlertModal
        isOpen={showAlert}
        title="알림"
        message={alertMessage || '리더보드를 열 수 없습니다.'}
        onClose={() => setShowAlert(false)}
      />
      <KeyboardInfoModal
        isOpen={showKeyboardInfo}
        onClose={() => setShowKeyboardInfo(false)}
      />
    </div>
  );
}
