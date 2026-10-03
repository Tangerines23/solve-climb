import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { ProfileForm } from '@/components/ProfileForm';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { signInWithGoogle } from '@/utils/auth';
import { isTossAppEnvironment } from '@/utils/tossLogin';
import { storageService, STORAGE_KEYS } from '@/services';
import { logError } from '@/utils/errorHandler';
import './AuthModal.css';

export interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  redirectPath?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  redirectPath,
}) => {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const isAuthenticated = Boolean(user || session);

  const [step, setStep] = useState<'login' | 'profile'>(() =>
    isAuthenticated && !isProfileComplete ? 'profile' : 'login'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isProfileComplete) {
      setStep('profile');
    }
  }, [isAuthenticated, isProfileComplete]);

  const handleCancelProfile = async () => {
    try {
      if (!useProfileStore.getState().isProfileComplete) {
        await useAuthStore.getState().signOut();
        storageService.remove(STORAGE_KEYS.LOCAL_SESSION);
        useProfileStore.getState().clearProfile();
      }
    } catch {
      // ignore
    }
    setStep('login');
  };

  useEffect(() => {
    const handleBack = () => {
      if (step === 'profile') {
        handleCancelProfile();
      }
    };
    window.addEventListener('home-back-button', handleBack);
    window.addEventListener('mypage-back-button', handleBack);
    window.addEventListener('popstate', handleBack);
    return () => {
      window.removeEventListener('home-back-button', handleBack);
      window.removeEventListener('mypage-back-button', handleBack);
      window.removeEventListener('popstate', handleBack);
    };
  }, [step]);

  const handleAnonymousLogin = async () => {
    try {
      setErrorMessage(null);
      if (redirectPath) {
        storageService.set(STORAGE_KEYS.LOGIN_REDIRECT, redirectPath);
      }

      await useAuthStore.getState().signInAnonymously();
      const sbUser = useAuthStore.getState().user;
      const assignedProfileId =
        sbUser?.id ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `guest_${Date.now()}`);

      useProfileStore.getState().setProfile({
        profileId: assignedProfileId,
        nickname: '',
        userId: assignedProfileId,
        createdAt: new Date().toISOString(),
        isAdmin: false,
      });

      try {
        storageService.set(STORAGE_KEYS.LOCAL_SESSION, {
          userId: assignedProfileId,
          isAdmin: false,
          loginTime: new Date().toISOString(),
          loginType: 'anonymous',
        });
      } catch (e) {
        console.warn('[AuthModal] Failed to save local session:', e);
      }

      await useLevelProgressStore.getState().syncProgress();
      setStep('profile');
    } catch (error) {
      logError('AuthModal#handleAnonymousLogin', error);
      setErrorMessage('익명 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      if (redirectPath) {
        storageService.set(STORAGE_KEYS.LOGIN_REDIRECT, redirectPath);
      }
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || '구글 로그인을 시작할 수 없습니다.');
      }
    } catch (error) {
      logError('AuthModal#handleGoogleLogin', error);
      setErrorMessage('구글 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleProfileComplete = () => {
    onComplete?.();
    onClose?.();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      closeOnOverlayClick={false}
      className="auth-modal-base"
      overlayClassName="auth-modal-overlay-opaque"
    >
      {step === 'login' ? (
        <div className="auth-modal-content">
          <div className="auth-modal-icon">🔒</div>
          <h2 className="auth-modal-title" id="auth-modal-title">
            로그인하고
            <br />
            <strong className="auth-modal-highlight">내 기록을 평생 간직하세요.</strong>
          </h2>
          <p className="auth-modal-desc">
            3초 만에 시작하고 랭킹 등록 및 실시간 클라우드 동기화 혜택을 누리세요!
          </p>

          {errorMessage && <p className="auth-modal-error">{errorMessage}</p>}

          <div className="auth-modal-buttons">
            <button
              className="auth-modal-login-btn"
              onClick={handleGoogleLogin}
              aria-label="3초 만에 시작하기"
            >
              {!isTossAppEnvironment() && (
                <svg
                  className="auth-modal-google-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {isTossAppEnvironment() ? '토스로 3초 만에 시작하기' : '구글로 3초 만에 시작하기'}
            </button>
            <button
              className="auth-modal-anon-btn"
              onClick={handleAnonymousLogin}
              aria-label="익명으로 시작하기"
            >
              익명으로 바로 시작하기
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-modal-profile-wrapper">
          <ProfileForm
            onComplete={handleProfileComplete}
            showBackButton={true}
            onCancel={handleCancelProfile}
            isModal={true}
          />
        </div>
      )}
    </BaseModal>
  );
};
