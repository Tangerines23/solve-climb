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
            onCancel={() => setStep('login')}
          />
        </div>
      )}
    </BaseModal>
  );
};
