import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppNavigation } from './useAppNavigation';
import { useDailyRewardStore } from '@/stores/useDailyRewardStore';
import { APP_CONFIG } from '@/config/app';

/**
 * Bridge hook for HomePage.
 * Encapsulates store interactions and complex logic (like back button handling)
 * to keep the UI component clean and compliant with architectural rules.
 */
export function useHomePageBridge() {
  const { navigate } = useAppNavigation();
  const [showExitToast, setShowExitToast] = useState(false);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWaitingForSecondBackRef = useRef<boolean>(false);
  const [showAgeRating, setShowAgeRating] = useState(true);

  const checkDailyLogin = useDailyRewardStore((state) => state.checkDailyLogin);

  // Age rating visibility logic
  useEffect(() => {
    setShowAgeRating(true);
    const timer = setTimeout(() => {
      setShowAgeRating(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Daily login check
  useEffect(() => {
    checkDailyLogin();
  }, [checkDailyLogin]);

  // Back button handling logic
  const handleHomeBackButton = useCallback(() => {
    // Note: window.history.length and document.referrer check should be done carefully
    const isFirstVisit = window.history.length <= 1 && document.referrer === '';
    if (isFirstVisit) return;

    if (isWaitingForSecondBackRef.current) {
      isWaitingForSecondBackRef.current = false;
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
        exitConfirmTimeoutRef.current = null;
      }
      setShowExitToast(false);
      navigate(APP_CONFIG.ROUTES.MY_PAGE, { replace: true });
    } else {
      isWaitingForSecondBackRef.current = true;
      setShowExitToast(true);

      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
      }
      exitConfirmTimeoutRef.current = setTimeout(() => {
        setShowExitToast(false);
        isWaitingForSecondBackRef.current = false;
        exitConfirmTimeoutRef.current = null;
      }, 3000);
    }
  }, [navigate]);

  useEffect(() => {
    const listener = (_event: Event) => {
      handleHomeBackButton();
    };
    window.addEventListener('home-back-button', listener);
    return () => {
      window.removeEventListener('home-back-button', listener);
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
      }
    };
  }, [handleHomeBackButton]);

  const closeExitToast = useCallback(() => {
    setShowExitToast(false);
    isWaitingForSecondBackRef.current = false;
    if (exitConfirmTimeoutRef.current) {
      clearTimeout(exitConfirmTimeoutRef.current);
      exitConfirmTimeoutRef.current = null;
    }
  }, []);

  return {
    showAgeRating,
    showExitToast,
    closeExitToast,
  };
}
