import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { NotificationPlayground } from '../components/debug/NotificationPlayground';
import { StaticUISection } from '../components/debug/StaticUISection';
import { DailyRewardDebugSection } from '../components/debug/DailyRewardDebugSection';
import { useProfileStore } from '../stores/useProfileStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMyPageStats } from '../hooks/useMyPageStats';
import { useFavoriteStore } from '../stores/useFavoriteStore';
import { getTodayChallenge, type TodayChallenge } from '../utils/challenge';
import { useQuizStore } from '../stores/useQuizStore';
import { resetAllData } from '../utils/dataReset';
import { vibrateShort } from '../utils/haptic';
import { supabase } from '../utils/supabaseClient';
import { debugSupabaseQuery } from '../utils/debugFetch';
import { openLeaderboard } from '../utils/tossGameCenter';
import { APP_CONFIG } from '../config/app';
import { ENV } from '../utils/env';
import { handleTossLogin } from '../utils/tossLogin';
import { handleTossLoginFlow } from '../utils/tossAuth';
import { migrateToGameLogin, checkTossLoginIntegration } from '../utils/tossGameLogin';
import { WithdrawConfirmModal } from '../components/WithdrawConfirmModal';
import { withdrawAccount } from '../utils/userWithdraw';
import { calculateTier } from '../constants/tiers';
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

    const subjectName = subjectMap[subject] || subject;
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

  // 오늘의 챌린지 상태
  const [todayChallenge, setTodayChallenge] = useState<TodayChallenge | null>(null);

  // URL 파라미터에서 showProfileForm 확인
  const shouldShowProfileForm = searchParams.get('showProfileForm') === 'true';
  const [showProfileForm, setShowProfileForm] = useState(
    !isProfileComplete || shouldShowProfileForm
  );
  const [showDataResetConfirm, setShowDataResetConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [_loginError, setLoginError] = useState(false);
  const [isOpeningLeaderboard, setIsOpeningLeaderboard] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [tierStars, setTierStars] = useState(0);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 오늘의 챌린지 가져오기
  useEffect(() => {
    getTodayChallenge()
      .then((challengeData) => {
        setTodayChallenge(challengeData);
      })
      .catch((error) => {
        console.error('Failed to load today challenge:', error);
      });
  }, []);

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
    // URL 파라미터 제거
    navigate(urls.myPage(), { replace: true });
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

      // 탈퇴 후 홈으로 이동하거나 초기 상태로 변경
      setTimeout(() => {
        navigate(urls.home(), { replace: true });
        window.location.reload(); // 상태 완전 초기화를 위해 리로드
      }, 2000);
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      setToastMessage(error.message || '회원 탈퇴 중 오류가 발생했습니다.');
      setShowToast(true);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent('[Solve Climb] 의견 보내기');
    const body = encodeURIComponent('안녕하세요,\n\n의견을 남겨주세요:\n\n');
    window.location.href = `mailto:support @solveclimb.com?subject = ${subject}& body=${body} `;
  };

  // 게임 로그인 마이그레이션 및 로그인 함수
  const handleLogin = async () => {
    try {
      setLoginError(false);

      // 로컬 개발 환경 또는 Vercel(심사) 환경 확인
      const isLocalDev =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.');
      const isReviewMode = isLocalDev || ENV.IS_VERCEL;

      // 심사/개발 모드에서 가상 로그인 사용
      if (isReviewMode) {
        console.log('[로그인] 심사/개발 환경 감지 - 가상 로그인 플로우 시작');
        if (ENV.IS_VERCEL) {
          console.log('[로그인] Vercel 환경: 모든 토스 API는 Mock으로 대체됩니다.');
        }

        // 개발 모드: 더미 authorization code로 플로우 테스트
        // 실제 토스 API는 실패하지만, Edge Function 호출 플로우는 확인 가능
        const devAuthorizationCode = 'DEV_MODE_AUTHORIZATION_CODE_' + Date.now();

        try {
          // 인가 코드로 AccessToken 받기 및 Supabase 사용자 생성/로그인 시도
          // 실제 토스 API는 실패하지만, Edge Function 호출 플로우는 확인 가능
          const { user, session } = await handleTossLoginFlow(devAuthorizationCode, 'DEV_MODE');

          if (!user || !session) {
            throw new Error('로그인 세션을 생성할 수 없습니다.');
          }

          // 프로필 설정
          const userProfile = {
            profileId: user.id,
            nickname:
              user.user_metadata?.tossName ||
              user.user_metadata?.tossUserKey?.toString() ||
              '게이머',
            userId: user.id,
            email: user.email,
            createdAt: user.created_at || new Date().toISOString(),
            isAdmin: false,
          };

          setProfile(userProfile);
          await refetch();
          setToastMessage(
            '개발 모드: 로그인 플로우 테스트 완료 (실제 토스 API는 실패했을 수 있음)'
          );
          setShowToast(true);
          setLoginError(false);
          return;
        } catch (devError) {
          console.error('[로그인] 개발 모드 로그인 실패:', devError);

          // 개발 모드에서 예상된 에러인 경우 사용자에게 안내
          const errorMessage = devError instanceof Error ? devError.message : String(devError);
          if (
            errorMessage.includes('개발 모드') ||
            errorMessage.includes('유효하지 않은 authorization code')
          ) {
            setToastMessage(errorMessage);
            setShowToast(true);
            setLoginError(false); // 에러가 아닌 안내 메시지
            return;
          }

          // 개발 모드에서도 실패하면 실제 플로우로 진행
          console.log('[로그인] 개발 모드 실패, 실제 토스 로그인 플로우로 진행');
        }
      }

      // 1. 게임 로그인 마이그레이션 시도 (게임 로그인 hash 발급 및 필요시 토스 로그인 매핑)
      console.log('[로그인] 게임 로그인 마이그레이션 시작');
      const migrationResult = await migrateToGameLogin();

      if (!migrationResult.success) {
        // 게임 로그인 마이그레이션 실패 시 기존 토스 로그인으로 폴백
        console.warn(
          '[로그인] 게임 로그인 마이그레이션 실패, 기존 토스 로그인으로 폴백:',
          migrationResult.error
        );

        // 기존 토스 로그인 플로우 실행
        console.log('[로그인] 기존 토스 로그인 플로우 시작');
        const loginResult = await handleTossLogin();

        if (!loginResult.success || !loginResult.authorizationCode) {
          // 더 구체적인 에러 메시지 제공
          let errorMessage = loginResult.error || migrationResult.error || '로그인에 실패했습니다.';

          if (isLocalDev && errorMessage.includes('토스 앱에서만')) {
            errorMessage =
              '로컬 개발 환경에서는 토스 앱이 필요합니다.\n\n' +
              '개발 모드로 테스트하려면:\n' +
              '1. 브라우저 콘솔에서 window.testTossOAuth() 실행\n' +
              '2. 또는 실제 토스 앱에서 테스트\n' +
              '3. 또는 AIT에 배포 후 테스트';
          }

          console.error('[로그인] 토스 로그인 실패:', {
            error: loginResult.error,
            migrationError: migrationResult.error,
            isLocalDev,
            hostname: window.location.hostname,
          });

          setToastMessage(errorMessage);
          setShowToast(true);
          setLoginError(true);
          return;
        }

        // 인가 코드로 AccessToken 받기 및 Supabase 사용자 생성/로그인
        const { user, session } = await handleTossLoginFlow(
          loginResult.authorizationCode,
          loginResult.referrer || 'DEFAULT'
        );

        if (!user || !session) {
          throw new Error('로그인 세션을 생성할 수 없습니다.');
        }

        // 프로필 설정
        const userProfile = {
          profileId: user.id,
          nickname:
            user.user_metadata?.tossName || user.user_metadata?.tossUserKey?.toString() || '게이머',
          userId: user.id,
          email: user.email,
          createdAt: user.created_at || new Date().toISOString(),
          isAdmin: false,
        };

        setProfile(userProfile);

        // [New] 로그인 직후 닉네임 DB 동기화
        try {
          await debugSupabaseQuery(
            supabase.rpc('update_profile_nickname', { p_nickname: userProfile.nickname })
          );
        } catch (e) {
          console.warn('Failed to sync nickname on login:', e);
        }

        await refetch();
        setToastMessage('토스 로그인에 성공했습니다!');
        setShowToast(true);
        setLoginError(false);
        return;
      }

      // 2. 게임 로그인 마이그레이션 성공
      // hash는 발급되었지만, Supabase 사용자는 토스 로그인을 통해 생성해야 함
      console.log(
        '[로그인] 게임 로그인 마이그레이션 성공, hash:',
        migrationResult.hash?.substring(0, 10) + '...'
      );

      // 토스 로그인 연동 여부 확인 (상단에서 이미 import됨)
      const integrationStatus = await checkTossLoginIntegration();

      if (integrationStatus.success && integrationStatus.isIntegrated === true) {
        // 토스 로그인 연동 사용자: 토스 로그인으로 Supabase 사용자 생성
        console.log('[로그인] 토스 로그인 연동 사용자 - 토스 로그인으로 Supabase 사용자 생성');

        const loginResult = await handleTossLogin();

        if (!loginResult.success || !loginResult.authorizationCode) {
          // 토스 로그인 실패 시 게임 로그인 hash만으로 진행 (제한적 기능)
          console.warn('[로그인] 토스 로그인 실패, 게임 로그인 hash만 사용');
          const gameLoginProfile = {
            profileId: `game_${migrationResult.hash} `,
            nickname: '게이머',
            userId: `game_${migrationResult.hash} `,
            email: `game_${migrationResult.hash} @game.local`,
            createdAt: new Date().toISOString(),
            isAdmin: false,
            gameLoginHash: migrationResult.hash,
          };
          setProfile(gameLoginProfile);
          await refetch();
          setToastMessage('게임 로그인에 성공했습니다! (일부 기능 제한)');
          setShowToast(true);
          setLoginError(false);
          return;
        }

        // 토스 로그인 성공 - Supabase 사용자 생성/로그인
        const { user, session } = await handleTossLoginFlow(
          loginResult.authorizationCode,
          loginResult.referrer || 'DEFAULT'
        );

        if (!user || !session) {
          throw new Error('로그인 세션을 생성할 수 없습니다.');
        }

        // 프로필 설정 (게임 로그인 hash 포함)
        const userProfile = {
          profileId: user.id,
          nickname:
            user.user_metadata?.tossName || user.user_metadata?.tossUserKey?.toString() || '게이머',
          userId: user.id,
          email: user.email,
          createdAt: user.created_at || new Date().toISOString(),
          isAdmin: false,
          gameLoginHash: migrationResult.hash, // 게임 로그인 hash 저장
        };

        setProfile(userProfile);

        // [New] 로그인 직후 닉네임 DB 동기화
        try {
          await debugSupabaseQuery(
            supabase.rpc('update_profile_nickname', { p_nickname: userProfile.nickname })
          );
        } catch (e) {
          console.warn('Failed to sync nickname on login:', e);
        }

        await refetch();
        setToastMessage('게임 로그인에 성공했습니다!');
        setShowToast(true);
        setLoginError(false);
      } else {
        // 토스 로그인 미연동 사용자: 게임 로그인 hash만 사용 (제한적 기능)
        console.log('[로그인] 토스 로그인 미연동 사용자 - 게임 로그인 hash만 사용');
        const gameLoginProfile = {
          profileId: `game_${migrationResult.hash} `,
          nickname: '게이머',
          userId: `game_${migrationResult.hash} `,
          email: `game_${migrationResult.hash} @game.local`,
          createdAt: new Date().toISOString(),
          isAdmin: false,
          gameLoginHash: migrationResult.hash,
        };
        setProfile(gameLoginProfile);
        await refetch();
        setToastMessage('게임 로그인에 성공했습니다!');
        setShowToast(true);
        setLoginError(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.';
      setToastMessage(errorMessage);
      setShowToast(true);
      setLoginError(true);
    }
  };

  // 리더보드 열기 함수
  const handleOpenLeaderboard = async () => {
    setIsOpeningLeaderboard(true);
    setRetryCount(0);

    try {
      const result = await openLeaderboard(
        (message) => {
          // 에러 메시지를 AlertModal로 표시
          setAlertMessage(message);
          setShowAlert(true);
        },
        (attempt, maxRetries) => {
          // 재시도 중일 때 사용자에게 알림
          setRetryCount(attempt);
          setToastMessage(`리더보드를 여는 중... (${attempt}/${maxRetries})`);
          setShowToast(true);
        }
      );

      // 결과가 실패이고 메시지가 없으면 기본 메시지 표시
      if (!result.success && result.message) {
        setAlertMessage(result.message);
        setShowAlert(true);
      } else if (!result.success) {
        setAlertMessage('리더보드를 열 수 없습니다.');
        setShowAlert(true);
      }
    } finally {
      setIsOpeningLeaderboard(false);
      setRetryCount(0);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoginError(false);

      // 로컬 세션만 사용 (Supabase 인증 없이)
      const userProfile = {
        profileId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `,
        nickname: '게이머',
        createdAt: new Date().toISOString(),
        isAdmin: false,
      };

      setProfile(userProfile);

      // 로컬 세션 저장
      try {
        localStorage.setItem(
          'solve-climb-local-session',
          JSON.stringify({
            userId: userProfile.profileId,
            isAdmin: false,
            loginTime: new Date().toISOString(),
            loginType: 'anonymous',
          })
        );
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

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      console.log('[로그아웃] 시작');

      // Supabase 세션이 있으면 로그아웃
      const {
        data: { session: currentSession },
      } = await debugSupabaseQuery(supabase.auth.getSession());
      console.log('[로그아웃] 현재 세션 확인:', { hasSession: !!currentSession });

      if (currentSession) {
        console.log('[로그아웃] Supabase signOut 호출 전');
        await debugSupabaseQuery(supabase.auth.signOut());
        console.log('[로그아웃] Supabase signOut 완료');
      }

      // 로컬 세션 삭제
      try {
        localStorage.removeItem('solve-climb-local-session');
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
            <div className="my-page-guest-view">
              <div className="my-page-guest-icon">🔒</div>
              {ENV.IS_VERCEL && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 106, 255, 0.05)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#0066ff',
                    textAlign: 'center',
                    fontWeight: '500',
                    border: '1px solid rgba(0, 106, 255, 0.1)',
                  }}
                >
                  심사위원님 환영합니다! 🧗
                  <br />
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    Vercel 환경에서는 가상 프로필로 모든 기능을 체험해보실 수 있습니다.
                  </span>
                </div>
              )}
              <h1 className="my-page-guest-title">
                로그인하고
                <br />
                <strong className="my-page-guest-highlight">내 기록을 평생 간직하세요.</strong>
              </h1>
              <div className="my-page-guest-buttons">
                <button className="my-page-guest-login-button" onClick={handleLogin}>
                  {ENV.IS_VERCEL ? '체험 시작하기' : '3초 만에 시작하기'}
                </button>
                <button className="my-page-guest-anonymous-link" onClick={handleAnonymousLogin}>
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
            isOpeningLeaderboard={isOpeningLeaderboard}
            retryCount={retryCount}
            onNavigateHistory={() => navigate(APP_CONFIG.ROUTES.HISTORY)}
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

          {/* Admin / Dev Playground */}
          {(useProfileStore.getState().isAdmin || import.meta.env.DEV) && (
            <div
              style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <DailyRewardDebugSection />
              <StaticUISection />
              <NotificationPlayground />
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
      <WithdrawConfirmModal
        isOpen={showWithdrawConfirm}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setShowWithdrawConfirm(false)}
        isLoading={isWithdrawing}
      />
    </div>
  );
}
