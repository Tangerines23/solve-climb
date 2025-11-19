// 프로필 스토어
import { create } from 'zustand';

export interface UserProfile {
  nickname: string;
  avatar?: string;
  userId?: string;
  email?: string; // 구글 로그인 이메일
  createdAt: string;
  isAdmin?: boolean; // 관리자 모드 플래그
}

interface ProfileState {
  profile: UserProfile | null;
  isProfileComplete: boolean;
  isAdmin: boolean; // 관리자 모드 상태
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

// localStorage에 저장/불러오기
const loadProfile = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem('solve-climb-profile');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveProfile = (profile: UserProfile | null) => {
  try {
    if (profile) {
      localStorage.setItem('solve-climb-profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('solve-climb-profile');
    }
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};

const savedProfile = loadProfile();

// 관리자 모드 상태를 localStorage에서 불러오기
const loadAdminMode = (): boolean => {
  try {
    const stored = localStorage.getItem('solve-climb-admin-mode');
    return stored === 'true';
  } catch {
    return false;
  }
};

const saveAdminMode = (isAdmin: boolean) => {
  try {
    if (isAdmin) {
      localStorage.setItem('solve-climb-admin-mode', 'true');
    } else {
      localStorage.removeItem('solve-climb-admin-mode');
    }
  } catch (error) {
    console.error('Failed to save admin mode:', error);
  }
};

// 프로필에서 관리자 모드 확인 (프로필의 isAdmin 또는 localStorage의 admin-mode)
const savedAdminMode = loadAdminMode() || (savedProfile?.isAdmin ?? false);

export const useProfileStore = create<ProfileState>((set) => ({
  profile: savedProfile,
  isProfileComplete: !!savedProfile,
  isAdmin: savedAdminMode,
  setProfile: (profile) => {
    saveProfile(profile);
    set({ profile, isProfileComplete: true });
    // 프로필이 변경되면 관리자 모드도 업데이트
    if (profile.isAdmin) {
      saveAdminMode(true);
      set({ isAdmin: true });
    } else if (savedAdminMode && profile.nickname !== 'admin') {
      // admin이 아니면 관리자 모드 해제
      saveAdminMode(false);
      set({ isAdmin: false });
    }
  },
  clearProfile: () => {
    saveProfile(null);
    saveAdminMode(false);
    set({ profile: null, isProfileComplete: false, isAdmin: false });
  },
  setIsAdmin: (isAdmin) => {
    saveAdminMode(isAdmin);
    set((state) => {
      // 프로필도 업데이트
      if (state.profile) {
        const updatedProfile = { ...state.profile, isAdmin };
        saveProfile(updatedProfile);
        return { isAdmin, profile: updatedProfile };
      }
      return { isAdmin };
    });
  },
}));

