import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { urls } from '@/utils/navigation';
import { AuthModal } from './AuthModal';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 세션 및 프로필 정보가 없는 경우:
 * - 홈 화면(/)인 경우: /my-page로 리다이렉트하지 않고 인플레이스 AuthModal을 띄움
 * - 마이페이지(/my-page)인 경우: 자식 컴포넌트 렌더링 허용
 * - 기타 보호된 라우트: 마이페이지로 리다이렉트
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);
  const location = useLocation();

  const isAuthenticatedOrGuest = Boolean(session || user);

  // 이미 세션이나 유저 정보가 존재하는 경우, 라우트 이동 중 백그라운드 isLoadingAuth가 발생해도
  // 화면 깜빡임(Flash of Loading Component) 없이 자식 컴포넌트를 부드럽게 유지합니다.
  if (isLoadingAuth && !isAuthenticatedOrGuest) {
    return (
      <div className="loading-fallback" role="alert" aria-busy="true">
        <div className="loading-text">인증 확인 중...</div>
      </div>
    );
  }

  // 세션(또는 게스트 유저)과 프로필 완료 상태 확인 (지연 익명 인증 지원)
  if (!isAuthenticatedOrGuest || !isProfileComplete) {
    if (location.pathname === urls.myPage()) {
      return children;
    }
    // 홈 화면(/)인 경우: /my-page로 리다이렉트 핑퐁하지 않고 홈 화면 위에 인플레이스 AuthModal 렌더링
    if (location.pathname === '/' || location.pathname === '') {
      return (
        <>
          {children}
          <AuthModal isOpen={true} />
        </>
      );
    }
    return <Navigate to={urls.myPage()} state={{ from: location }} replace />;
  }

  return children;
}
