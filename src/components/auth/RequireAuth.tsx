import { Navigate } from 'react-router-dom';
import { useRequireAuthBridge } from '@/hooks/useRequireAuthBridge';

interface RequireAuthProps {
  children: JSX.Element;
}

/**
 * 세션 및 프로필 정보가 없는 경우 마이페이지(로그인)로 리다이렉트하는 가드 컴포넌트
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, loginPath, location } = useRequireAuthBridge();

  if (isLoading) {
    return (
      <div className="loading-fallback" role="alert" aria-busy="true">
        <div className="loading-text">인증 확인 중...</div>
      </div>
    );
  }

  // 세션이 없거나 프로필이 미완성인 경우 마이페이지로 이동
  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;
}
