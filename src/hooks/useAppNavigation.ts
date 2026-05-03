import { useNavigate } from 'react-router-dom';
import { urls } from '../utils/navigation';

/**
 * useAppNavigation
 * 
 * A bridge hook to provide type-safe navigation functions to UI components,
 * adhering to architectural boundaries that disallow direct util imports in components.
 */
export function useAppNavigation() {
  const navigate = useNavigate();

  return {
    urls,
    navigate,
    // Add common navigation shortcuts here if needed
    goToHome: () => navigate(urls.home()),
    goToMyPage: (params?: { showProfileForm?: boolean }) => navigate(urls.myPage(params)),
    goToLogin: () => navigate(urls.login()),
    goToDebug: () => navigate(urls.debug()),
  };
}
