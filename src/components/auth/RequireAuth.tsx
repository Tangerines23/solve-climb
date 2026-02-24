import { Navigate, useLocation } from 'react-router-dom';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { urls } from '@/utils/navigation';

interface RequireAuthProps {
  children: JSX.Element;
}

/**
 * 세션 및 프로필 정보가 없는 경우 마이페이지(로그인)로 리다이렉트하는 가드 컴포넌트
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const session = useAuthStore((state) => state.session);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="loading-fallback" role="alert" aria-busy="true">
        <div className="loading-text">인증 확인 중...</div>
      </div>
    );
  }

  // 세션이 없거나 프로필이 미완성인 경우 마이페이지로 이동
  if (!session || !isProfileComplete) {
    return <Navigate to={urls.myPage()} state={{ from: location }} replace />;
  }

  return children;
}
