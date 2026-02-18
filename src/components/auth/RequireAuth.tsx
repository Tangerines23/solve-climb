import { Navigate, useLocation } from 'react-router-dom';
import { useProfileStore } from '@/stores/useProfileStore';
import { urls } from '@/utils/navigation';

interface RequireAuthProps {
  children: JSX.Element;
}

/**
 * 프로필 정보가 없는 경우 마이페이지(로그인)로 리다이렉트하는 가드 컴포넌트
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const location = useLocation();

  if (!isProfileComplete) {
    // 현재 시도했던 경로를 쿼리 파라미터로 전달하여 로그인 후 복귀 가능하게 함 (선택 사항)
    return <Navigate to={urls.myPage()} state={{ from: location }} replace />;
  }

  return children;
}
