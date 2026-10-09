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
import { AuthLoginStep } from './AuthLoginStep';
import {
  generateGuestProfileId,
  createInitialGuestProfile,
  createLocalAnonymousSession,
} from '../utils/authUtils';
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

  const [step, setStep] = useState<'login' | 'profile'>(() => {
    if (isAuthenticated && !isProfileComplete) return 'profile';
    return 'login';
  });
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
      const assignedProfileId = generateGuestProfileId(sbUser?.id);

      useProfileStore.getState().setProfile(createInitialGuestProfile(assignedProfileId));

      try {
        storageService.set(
          STORAGE_KEYS.LOCAL_SESSION,
          createLocalAnonymousSession(assignedProfileId)
        );
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

  const renderContent = () => {
    if (step === 'login') {
      return (
        <AuthLoginStep
          isToss={isTossAppEnvironment()}
          errorMessage={errorMessage}
          onGoogleLogin={handleGoogleLogin}
          onAnonymousLogin={handleAnonymousLogin}
        />
      );
    }

    return (
      <div className="auth-modal-profile-wrapper">
        <ProfileForm
          onComplete={handleProfileComplete}
          showBackButton={true}
          onCancel={handleCancelProfile}
          isModal={true}
        />
      </div>
    );
  };

  const handleSafeClose = onClose || (() => {});

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSafeClose}
      closeOnOverlayClick={false}
      className="auth-modal-base"
      overlayClassName="auth-modal-overlay-opaque"
    >
      {renderContent()}
    </BaseModal>
  );
};
