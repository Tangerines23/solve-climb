import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { urls } from '@/utils/navigation';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUserStore } from '@/stores/useUserStore';
import { useDebugStore } from '@/stores/useDebugStore';
import { useToastStore } from '@/stores/useToastStore';
import { storageService, STORAGE_KEYS } from '@/services';

export function useHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMineralsLoading, setIsMineralsLoading] = useState(false);

  const isAdmin = useProfileStore((state) => state.isAdmin);
  const { minerals, stamina, fetchUserData, checkStamina, recoverMineralsAds } = useUserStore();
  const { showToast } = useToastStore();

  const { isAdminMode, selectedResource, setSelectedResource, toggleDebugPanel, isDebugPanelOpen } =
    useDebugStore();

  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    fetchUserData();
    checkStamina();
  }, [fetchUserData, checkStamina]);

  // URL 파라미터 및 localStorage로 디버그 패널 자동 활성화
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // URL 파라미터 체크: ?debug=true
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('debug') === 'true' && !isDebugPanelOpen) {
      toggleDebugPanel();
    }

    // localStorage 체크: debug_mode = 'true'
    if (storageService.get<string>(STORAGE_KEYS.DEBUG_MODE) === 'true' && !isDebugPanelOpen) {
      toggleDebugPanel();
    }
  }, [location.search, isDebugPanelOpen, toggleDebugPanel]);

  const handleNotificationClick = useCallback(() => {
    navigate(APP_CONFIG.ROUTES.NOTIFICATIONS);
  }, [navigate]);

  const handleLogoDoubleClick = useCallback(() => {
    if (isAdmin) {
      navigate(urls.myPage({ showProfileForm: true }));
    }
  }, [isAdmin, navigate]);

  const handleLogoClick = useCallback(() => {
    if (!isAdmin) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    if (timeSinceLastClick < 300) {
      handleLogoDoubleClick();
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = null;
      }
    } else {
      doubleClickTimeoutRef.current = setTimeout(() => {
        doubleClickTimeoutRef.current = null;
      }, 300);
    }

    lastClickTimeRef.current = now;
  }, [isAdmin, handleLogoDoubleClick]);

  const handleStaminaClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdminMode) return;
      e.stopPropagation();
      setSelectedResource(selectedResource === 'stamina' ? null : 'stamina');
    },
    [isAdminMode, selectedResource, setSelectedResource]
  );

  const handleMineralsClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdminMode) return;
      e.stopPropagation();
      setSelectedResource(selectedResource === 'minerals' ? null : 'minerals');
    },
    [isAdminMode, selectedResource, setSelectedResource]
  );

  const handleMineralsAdRecharge = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMineralsLoading) return;

      setIsMineralsLoading(true);
      showToast('광고를 불러오는 중... 📺', 'info');

      const result = await recoverMineralsAds();
      if (result.success) {
        showToast(result.message, '💎');
      }
      setIsMineralsLoading(false);
    },
    [isMineralsLoading, recoverMineralsAds, showToast]
  );

  const handleItemsClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdminMode) return;
      e.stopPropagation();
      setSelectedResource(selectedResource === 'items' ? null : 'items');
    },
    [isAdminMode, selectedResource, setSelectedResource]
  );

  const clearSelection = useCallback(() => {
    setSelectedResource(null);
  }, [setSelectedResource]);

  return {
    minerals,
    stamina,
    isAdmin,
    isAdminMode,
    isDebugPanelOpen,
    selectedResource,
    isMineralsLoading,
    handleNotificationClick,
    handleLogoClick,
    handleStaminaClick,
    handleMineralsClick,
    handleMineralsAdRecharge,
    handleItemsClick,
    clearSelection,
    toggleDebugPanel,
    navigate,
  };
}
