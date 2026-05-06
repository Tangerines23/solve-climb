import { useLocation } from 'react-router-dom';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { urls } from '@/utils/navigation';

export function useRequireAuthBridge() {
  const session = useAuthStore((state) => state.session);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const location = useLocation();

  return {
    isAuthenticated: !!session && isProfileComplete,
    isLoading: isLoadingAuth,
    loginPath: urls.myPage(),
    location,
  };
}
