import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { urls } from '../utils/navigation';
import { ProfileForm } from '../components/ProfileForm';
import { DataResetConfirmModal } from '../components/DataResetConfirmModal';
import { Toast } from '../components/Toast';
import { AlertModal } from '../components/AlertModal';

import { CyclePromotionModal } from '../components/CyclePromotionModal';
import { MyPageProfile } from '../components/my/MyPageProfile';
import { MyPageStats } from '../components/my/MyPageStats';
import { MyPageQuickAccess } from '../components/my/MyPageQuickAccess';
import { MyPageSettings } from '../components/my/MyPageSettings';
import { useProfileStore } from '../stores/useProfileStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMyPageStats } from '../hooks/useMyPageStats';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { getTodayChallenge, type TodayChallenge } from '../utils/challenge';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { useQuizStore } from '../stores/useQuizStore';
import { resetAllData } from '../utils/dataReset';
import { vibrateShort } from '../utils/haptic';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';

import { APP_CONFIG } from '../config/app';
import { signInWithGoogle } from '../utils/auth';
import { handleTossLogin, isTossAppEnvironment } from '../utils/tossLogin';
import { WithdrawConfirmModal } from '../components/WithdrawConfirmModal';
import { withdrawAccount } from '../utils/userWithdraw';
import { calculateTier } from '../constants/tiers';
import { storageService, STORAGE_KEYS } from '../services';
import './MyPage.css';

// theme_id를 읽기 쉬운 이름으로 변환하는 함수
const formatBestSubject = (themeId: string | null): string => {
  if (!themeId) return '-';

  if (themeId.includes('_')) {
    const [category, subject] = themeId.split('_');
    const categoryName = APP_CONFIG.CATEGORIES.find((c) => c.id === category)?.name || category;

    const subjectMap: Record<string, string> = {
      add: '덧셈',
      sub: '뺄셈',
      mul: '곱셈',
      div: '나눗셈',
      word: '단어',
      puzzle: '퍼즐',
    };

    const subjectEntry = Object.entries(subjectMap).find(([k]) => k === subject);
    const subjectName = subjectEntry ? subjectEntry[1] : subject;
    return `${categoryName} ${subjectName} `;
  }
  return themeId;
};

export function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Zustand Selector 패턴 적용
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const profile = useProfileStore((state) => state.profile);
  const nickname = profile?.nickname || '게이머';
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const setHapticEnabled = useSettingsStore((state) => state.setHapticEnabled);
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);
  const setAnimationEnabled = useSettingsStore((state) => state.setAnimationEnabled);
  const { stats, session, loading: statsLoading, error: statsError, refetch } = useMyPageStats();
  const favorites = useFavoriteStore((state) => state.favorites);
  const setCategoryTopic = useQuizStore((state) => state.setCategoryTopic);
  const progressMap = useLevelProgressStore((state) => state.progress);

  // 오늘의 챌린지 상태
  const [todayChallenge, setTodayChallenge] = useState<TodayChallenge | null>(null);

  // URL 파라미터에서 showProfileForm 확인
  const shouldShowProfileForm = searchParams.get('showProfileForm') === 'true';

  // 프로필이 미완성이거나(닉네임 없음 포함) 명시적으로 요청된 경우 폼 표시
  // [Fix] isProfileComplete 상태와 동기화되도록 하여 E2E/CI 환경에서의 레이스 컨디션 방지
  const [showProfileForm, setShowProfileForm] = useState(shouldShowProfileForm);
  const isFormVisible = !isProfileComplete || showProfileForm;

  const [showDataResetConfirm, setShowDataResetConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [_loginError, setLoginError] = useState(false);

  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [tierStars, setTierStars] = useState(0);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const routerLocation = useLocation();
  const locationState = routerLocation.state as { from?: { pathname: string } } | null;
  const redirectPath = locationState?.from?.pathname;

  // 로그인 성공 후 리다이렉트 처리 함수
  const performRedirect = React.useCallback(() => {
    const savedRedirect = storageService.get<string>(STORAGE_KEYS.LOGIN_REDIRECT);

    // 1. 명시적인 복귀 경로가 있는 경우 (RequireAuth 등에서 전달됨)
    if (redirectPath && redirectPath !== urls.myPage()) {
      navigate(redirectPath, { replace: true });
    }
    // 2. 이전에 저장된 리다이렉트 경로가 있는 경우
    else if (savedRedirect && savedRedirect !== urls.myPage()) {
      storageService.remove(STORAGE_KEYS.LOGIN_REDIRECT);
      navigate(savedRedirect, { replace: true });
    }
    // 3. 현재 위치가 이미 마이페이지이거나 복귀 경로가 마이페이지인 경우 이동하지 않음
    else {
      console.log('[MyPage] Stay on MyPage');
    }
  }, [redirectPath, navigate]);

  // 오늘의 챌린지 가져오기
  useEffect(() => {
    getTodayChallenge(progressMap)
      .then((challengeData) => {
        setTodayChallenge(challengeData);
      })
      .catch((error) => {
        console.error('Failed to load today challenge:', error);
      });
  }, [progressMap]);

  // 승급 대기 상태 확인 및 모달 표시
  useEffect(() => {
    if (stats?.cyclePromotionPending && !showPromotionModal) {
      // 티어 정보 계산하여 별 개수 가져오기
      calculateTier(stats.totalMasteryScore).then((tierResult) => {
        setTierStars(tierResult.stars);
        setShowPromotionModal(true);
      });
    }
  }, [stats?.cyclePromotionPending, stats?.totalMasteryScore, showPromotionModal]);

  const handlePromote = async () => {
    setShowPromotionModal(false);
    await refetch(); // 티어 정보 갱신
  };

  const handleProfileComplete = () => {
    setShowProfileForm(false);

    // 이미 프로필이 있는 상태에서 수정한 경우 -> 마이페이지 유지
    if (isProfileComplete) {
      navigate(urls.myPage(), { replace: true, state: {} });
      refetch(); // 프로필 완성 후 통계 다시 불러오기
      return;
    }

    // 최초 프로필 생성인 경우 -> 이전 경로 또는 홈으로 이동
    navigate(urls.myPage(), { replace: true, state: {} });

    const savedRedirect = storageService.get<string>(STORAGE_KEYS.LOGIN_REDIRECT);
    if (redirectPath && redirectPath !== urls.myPage()) {
      navigate(redirectPath, { replace: true });
    } else if (savedRedirect && savedRedirect !== urls.myPage()) {
      storageService.remove(STORAGE_KEYS.LOGIN_REDIRECT);
      navigate(savedRedirect, { replace: true });
    } else {
      // 명시적 리다이렉트가 없으면 홈으로 보냄 (사용자 요청 사항)
      navigate('/', { replace: true });
    }

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

  const handleToggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    setToastMessage(newValue ? '애니메이션 효과가 켜졌습니다' : '정적 UI 모드가 활성화되었습니다');
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

  const handleWithdraw = () => {
    setShowWithdrawConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      await withdrawAccount();
      setShowWithdrawConfirm(false);
      setToastMessage('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      setShowToast(true);

      /* Removed automatic redirect to home that caused a loop */
    } catch (error: unknown) {
      console.error('Withdrawal failed:', error);
      setToastMessage(error instanceof Error ? error.message : '회원 탈퇴 중 오류가 발생했습니다.');
      setShowToast(true);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent('[Solve Climb] 의견 보내기');
    const body = encodeURIComponent('안녕하세요,\n\n의견을 남겨주세요:\n\n');
    window.location.href = `mailto:support@solveclimb.com?subject=${subject}&body=${body}`;
  };

  /*
  // 게임 로그인 마이그레이션 및 로그인 함수 (현재 미사용)
  const handleLogin = async () => {
    ...
  };
  */

  // 리더보드 및 개발 중 기능 안내 함수
  const handleOpenLeaderboard = async () => {
    // 기능 비활성화 및 개발 중 메시지 표시
    setToastMessage('현재 개발 중인 기능입니다. 곧 만나보실 수 있어요!');
    setShowToast(true);
  };

  // 토스 로그인 클릭 핸들러
  const handleTossLoginClick = async () => {
    const result = await handleTossLogin();
    if (!result.success && result.error) {
      setAlertMessage(result.error);
      setShowAlert(true);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoginError(false);

      // 리다이렉트 경로 저장
      if (redirectPath) {
        storageService.set(STORAGE_KEYS.LOGIN_REDIRECT, redirectPath);
      }

      // 로컬 세션만 사용 (Supabase 인증 없이)
      const userProfile = {
        profileId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname: '',
        createdAt: new Date().toISOString(),
        isAdmin: false,
      };

      setProfile(userProfile);

      // 로컬 세션 저장
      try {
        storageService.set(STORAGE_KEYS.LOCAL_SESSION, {
          userId: userProfile.profileId,
          isAdmin: false,
          loginTime: new Date().toISOString(),
          loginType: 'anonymous',
        });
      } catch (e) {
        console.warn('Failed to save local session:', e);
      }

      // 로그인 성공 후 통계 다시 불러오기
      await refetch();

      // 리다이렉트 시도
      performRedirect();

      setToastMessage('익명으로 로그인되었습니다.');
      setShowToast(true);
    } catch (error) {
      console.error('Anonymous login error:', error);
      setToastMessage('익명 로그인 중 오류가 발생했습니다.');
      setShowToast(true);
      setLoginError(true);
    }
  };

  // 구글 한 번 클릭 로그인 (리다이렉트 후 /my-page로 복귀)
  const handleGoogleLogin = async () => {
    // 리다이렉트 경로 저장
    if (redirectPath) {
      storageService.set(STORAGE_KEYS.LOGIN_REDIRECT, redirectPath);
    }

    const { error } = await signInWithGoogle();
    if (error) {
      setToastMessage(error.message || '구글 로그인을 시작할 수 없습니다.');
      setShowToast(true);
      setLoginError(true);
    }
    // 성공 시 구글 페이지로 이동하므로 여기서 추가 처리 없음
  };

  // 구글 OAuth 리다이렉트 복귀 시 프로필 동기화
  useEffect(() => {
    if (!session?.user || !refetch) return;
    const userId = session.user.id;
    if (profile?.userId === userId) return;

    // 익명 사용자는 이 이펙트에서 자동 프로필 생성을 처리하지 않음 (익명 로그인은 handleAnonymousLogin에서 처리)
    if (session.user.is_anonymous) return;

    const nickname =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email ||
      '게이머';
    setProfile({
      profileId: userId,
      nickname,
      userId,
      email: session.user.email ?? undefined,
      avatar: session.user.user_metadata?.avatar_url,
      createdAt: session.user.created_at || new Date().toISOString(),
      isAdmin: false,
    });
    refetch();

    // 리다이렉트 시도
    performRedirect();

    try {
      safeSupabaseQuery(supabase.rpc('update_profile_nickname', { p_nickname: nickname })).catch(
        () => {}
      );
    } catch {
      // 무시
    }
  }, [session?.user, profile?.userId, refetch, setProfile, performRedirect]);

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      console.log('[로그아웃] 시작');

      // Supabase 세션이 있으면 로그아웃
      const {
        data: { session: currentSession },
      } = await safeSupabaseQuery(supabase.auth.getSession());
      console.log('[로그아웃] 현재 세션 확인:', { hasSession: !!currentSession });

      if (currentSession) {
        console.log('[로그아웃] Supabase signOut 호출 전');
        await safeSupabaseQuery(supabase.auth.signOut());
        console.log('[로그아웃] Supabase signOut 완료');
      }

      // 로컬 세션 삭제
      try {
        storageService.remove(STORAGE_KEYS.LOCAL_SESSION);
        console.log('[로그아웃] 로컬 세션 삭제 완료');
      } catch (e) {
        console.warn('Failed to remove local session:', e);
      }

      // 로컬 상태 초기화
      console.log('[로그아웃] 프로필 초기화 전');
      clearProfile();
      console.log('[로그아웃] 프로필 초기화 완료');

      setToastMessage('로그아웃되었습니다.');
      setShowToast(true);

      // 통계 다시 불러오기 (세션 없음 상태로)
      console.log('[로그아웃] refetch 호출 전');
      await refetch();
      console.log('[로그아웃] refetch 완료');

      console.log('[로그아웃] 전체 과정 완료');
    } catch (error) {
      console.error('[로그아웃] 오류 발생:', error);
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
            <div className="my-page-guest-view-container">
              <div className="my-page-guest-view">
                <div className="my-page-guest-icon">🔒</div>
                <h1 className="my-page-guest-title">
                  로그인하고
                  <br />
                  <strong className="my-page-guest-highlight">내 기록을 평생 간직하세요.</strong>
                </h1>
                <div className="my-page-guest-buttons">
                  {isTossAppEnvironment() ? (
                    <button className="my-page-guest-login-button" onClick={handleTossLoginClick}>
                      3초 만에 시작하기
                    </button>
                  ) : (
                    <button className="my-page-guest-login-button" onClick={handleGoogleLogin}>
                      3초 만에 시작하기
                    </button>
                  )}
                  <button className="my-page-guest-anonymous-link" onClick={handleAnonymousLogin}>
                    익명 로그인하기
                  </button>
                </div>
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
        <CyclePromotionModal
          isOpen={showPromotionModal}
          stars={tierStars}
          pendingScore={stats?.pendingCycleScore || 0}
          onPromote={handlePromote}
          onClose={() => setShowPromotionModal(false)}
        />
      </div>
    );
  }

  if (isFormVisible) {
    return (
      <div className="my-page">
        <Header />
        <main className="my-page-main">
          <div className="my-page-content">
            <ProfileForm
              onComplete={handleProfileComplete}
              showBackButton={isProfileComplete}
              onCancel={() => setShowProfileForm(false)}
            />
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
          <MyPageProfile
            nickname={nickname}
            totalMasteryScore={stats?.totalMasteryScore || 0}
            loginStreak={stats?.loginStreak || 0}
            loading={statsLoading}
            onEditProfile={() => setShowProfileForm(true)}
          />

          {/* Stats Grid */}
          <MyPageStats
            loading={statsLoading}
            totalSolved={stats?.totalSolved || 0}
            maxLevel={stats?.maxLevel}
            bestSubject={formatBestSubject(stats?.bestSubject || null)}
            isOpeningLeaderboard={false}
            retryCount={0}
            onNavigateHistory={handleOpenLeaderboard}
            onOpenLeaderboard={handleOpenLeaderboard}
          />

          {/* Quick Access Section */}
          <MyPageQuickAccess
            todayChallenge={todayChallenge}
            favorites={favorites}
            setCategoryTopic={setCategoryTopic}
          />

          {/* Settings List */}
          <MyPageSettings
            hapticEnabled={hapticEnabled}
            animationEnabled={animationEnabled}
            onToggleHaptic={handleToggleHaptic}
            onToggleAnimation={handleToggleAnimation}
            onShowProfileForm={() => setShowProfileForm(true)}
            onDataReset={handleDataReset}
            isResetting={isResetting}
            onSendFeedback={handleSendFeedback}
            onLogout={handleLogout}
            onWithdraw={handleWithdraw}
          />

          {/* Admin / Dev Tool Link */}
          {(useProfileStore.getState().isAdmin || import.meta.env.DEV) && (
            <div className="mypage-admin-link-container">
              <button className="mypage-admin-link-button" onClick={() => navigate(urls.debug())}>
                <span>🛠️</span> 관리자 도구 & UI 실험실 이동
              </button>
            </div>
          )}

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
      <CyclePromotionModal
        isOpen={showPromotionModal}
        stars={tierStars}
        pendingScore={stats?.pendingCycleScore || 0}
        onPromote={handlePromote}
        onClose={() => setShowPromotionModal(false)}
      />
      <WithdrawConfirmModal
        isOpen={showWithdrawConfirm}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setShowWithdrawConfirm(false)}
        isLoading={isWithdrawing}
      />
    </div>
  );
}
