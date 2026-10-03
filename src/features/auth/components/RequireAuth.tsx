import type React from 'react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSession } from '../hooks/useSession';
import { AuthModal } from './AuthModal';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 인증 및 프로필 완료 상태 가드:
 * - 미인증 또는 프로필 미완료 상태일 때:
 *   뒷페이지(children)를 렌더링하지 않고, 100% 솔리드 배경의 AuthModal만 단독 렌더링하여
 *   페이지 전환이나 뒤로가기 시 이전 페이지(홈, 마이페이지 등)가 뒤에 비치는 현상을 완벽히 차단합니다.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useSession();
  const isProfileComplete = useProfileStore((state) => state.isProfileComplete);

  // 이미 세션이나 유저 정보가 존재하는 경우, 라우트 이동 중 백그라운드 isLoadingAuth가 발생해도
  // 화면 깜빡임(Flash of Loading Component) 없이 자식 컴포넌트를 부드럽게 유지합니다.
  if (isLoading && !isAuthenticated) {
    return (
      <div className="loading-fallback" role="alert" aria-busy="true">
        <div className="loading-text">인증 확인 중...</div>
      </div>
    );
  }

  // 세션(또는 게스트 유저)과 프로필 완료 상태 확인 (지연 익명 인증 지원)
  if (!isAuthenticated || !isProfileComplete) {
    return <AuthModal isOpen={true} />;
  }

  return <>{children}</>;
}
