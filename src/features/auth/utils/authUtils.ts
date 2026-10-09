import type { UserProfile } from '@/stores/useProfileStore';

export interface LocalAnonymousSession {
  userId: string;
  isAdmin: boolean;
  loginTime: string;
  loginType: 'anonymous';
}

/**
 * 게스트 프로필 ID 생성 순수 함수
 * - 전달된 candidateId가 유효하면 우선 사용
 * - crypto.randomUUID() 지원 시 UUID 생성
 * - 폴백으로 guest_timestamp 생성
 * (Zero Else, Depth 1)
 */
export function generateGuestProfileId(candidateId?: string | null): string {
  if (candidateId && typeof candidateId === 'string' && candidateId.trim() !== '') {
    return candidateId.trim();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `guest_${Date.now()}`;
}

/**
 * 게스트 유저 초기 프로필 생성 순수 팩토리 함수
 */
export function createInitialGuestProfile(profileId: string, timestamp?: string): UserProfile {
  const safeTime = timestamp || new Date().toISOString();
  return {
    profileId,
    nickname: '',
    userId: profileId,
    createdAt: safeTime,
    isAdmin: false,
  };
}

/**
 * 게스트 로컬 세션 생성 순수 팩토리 함수
 */
export function createLocalAnonymousSession(
  profileId: string,
  timestamp?: string
): LocalAnonymousSession {
  const safeTime = timestamp || new Date().toISOString();
  return {
    userId: profileId,
    isAdmin: false,
    loginTime: safeTime,
    loginType: 'anonymous',
  };
}

/**
 * 환경(Toss vs Google)에 따른 로그인 버튼 라벨 반환 순수 함수 (Zero Else)
 */
export function getAuthLoginButtonText(isToss: boolean): string {
  if (isToss) {
    return '토스로 3초 만에 시작하기';
  }
  return '구글로 3초 만에 시작하기';
}
