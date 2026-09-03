import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/stores/useAuthStore';
import { storageService, STORAGE_KEYS } from '@/services';

export const SESSION_ENTRY_KEY = 'solve_climb_session_entry_recorded';

export function useAnonymousEntryWarning() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const isAnonymous = Boolean(user && (user.is_anonymous || !user.email));

  const recordEntryAndCheck = useCallback(() => {
    const currentUser = useAuthStore.getState().user;
    const currentIsAnonymous = Boolean(currentUser && (currentUser.is_anonymous || !currentUser.email));

    if (!currentIsAnonymous) {
      // 정식 로그인 상태이면 카운터 정리
      if (currentUser?.email) {
        storageService.remove(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT);
      }
      return;
    }

    // 진입 횟수 증가
    const prevCount = storageService.get<number>(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT) || 0;
    const nextCount = prevCount + 1;
    storageService.set(STORAGE_KEYS.ANONYMOUS_ENTRY_COUNT, nextCount);

    // 3회 주기 (3, 6, 9, ...) 검사
    if (nextCount > 0 && nextCount % 3 === 0) {
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    // 1. Cold Start / 세션 첫 진입 확인
    try {
      const hasCounted = sessionStorage.getItem(SESSION_ENTRY_KEY);
      if (!hasCounted) {
        sessionStorage.setItem(SESSION_ENTRY_KEY, 'true');
        recordEntryAndCheck();
      }
    } catch {
      // sessionStorage 사용 불가능한 환경 fallback
      recordEntryAndCheck();
    }

    // 2. Capacitor 백그라운드 복귀(Resume) 감지
    if (Capacitor.isNativePlatform()) {
      let cleanupListener: (() => void) | null = null;
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            recordEntryAndCheck();
          }
        }).then((handle) => {
          cleanupListener = () => handle.remove();
        });
      }).catch((err) => {
        console.warn('Failed to attach appStateChange listener:', err);
      });

      return () => {
        if (cleanupListener) cleanupListener();
      };
    }
  }, [recordEntryAndCheck]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleGoToMyPage = useCallback(() => {
    setIsModalOpen(false);
    navigate('/my-page');
  }, [navigate]);

  return {
    isModalOpen,
    isAnonymous,
    closeModal,
    handleGoToMyPage,
  };
}
