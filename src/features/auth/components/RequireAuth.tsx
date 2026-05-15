import { Navigate } from 'react-router-dom';
import { useRequireAuthBridge } from '../hooks/useRequireAuthBridge';

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

  // Visual Guardian 감사 모드인 경우 인증 건너뜀 (전체 페이지 접근 허용)
  const isGuardianMode = (window as any).__ENABLE_VISUAL_GUARDIAN__ === true;

  // 세션이 없거나 프로필이 미완성인 경우 마이페이지로 이동 (감사 모드 제외)
  if (!isAuthenticated && !isGuardianMode) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;
}
