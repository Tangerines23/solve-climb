// 프로필 스토어
import { create } from 'zustand';
import { useLevelProgressStore } from './useLevelProgressStore';
import { storageService, STORAGE_KEYS } from '../services';
import type { UserProgress } from './useLevelProgressStore';

export interface UserProfile {
  profileId: string; // 고유 프로필 ID
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
  profiles: UserProfile[]; // 프로필 목록 (최대 3개)
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
  switchProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
}

// 고유 ID 생성
const generateProfileId = (): string => {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 기기 ID 가져오기 또는 생성
const getDeviceId = (): string => {
  let deviceId = storageService.get<string>(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storageService.set(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
};

// 프로필 목록 로드 (계정/기기당 최대 3개)
const loadProfiles = (): UserProfile[] => {
  const deviceId = getDeviceId();
  return storageService.get<UserProfile[]>(STORAGE_KEYS.PROFILES(deviceId)) || [];
};

// 프로필 목록 저장
const saveProfiles = (profiles: UserProfile[]) => {
  const deviceId = getDeviceId();
  // 최대 3개로 제한
  const limitedProfiles = profiles.slice(0, 3);
  storageService.set(STORAGE_KEYS.PROFILES(deviceId), limitedProfiles);
};

// 현재 활성 프로필 ID 로드
const loadActiveProfileId = (): string | null => {
  return storageService.get<string>(STORAGE_KEYS.ACTIVE_PROFILE_ID);
};

// 현재 활성 프로필 ID 저장
const saveActiveProfileId = (profileId: string | null) => {
  if (profileId) {
    storageService.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
  } else {
    storageService.remove(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  }
};

// 프로필 목록과 활성 프로필 로드
const initialProfiles = loadProfiles();

const savedProfiles = initialProfiles;
const activeProfileId = loadActiveProfileId();
const savedProfile = activeProfileId
  ? savedProfiles.find((p) => p.profileId === activeProfileId) || null
  : savedProfiles[0] || null;

// 관리자 모드 상태를 localStorage에서 불러오기
const loadAdminMode = (): boolean => {
  const stored = storageService.get<string>(STORAGE_KEYS.ADMIN_MODE);
  return stored === 'true';
};

const saveAdminMode = (isAdmin: boolean) => {
  if (isAdmin) {
    storageService.set(STORAGE_KEYS.ADMIN_MODE, 'true');
  } else {
    storageService.remove(STORAGE_KEYS.ADMIN_MODE);
  }
};

// 프로필에서 관리자 모드 확인 (프로필의 isAdmin 또는 localStorage의 admin-mode)
const savedAdminMode = loadAdminMode() || (savedProfile?.isAdmin ?? false);

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: savedProfile,
  isProfileComplete: !!savedProfile && !!savedProfile.nickname,
  isAdmin: savedAdminMode,
  profiles: savedProfiles,
  setProfile: (profile) => {
    const state = get();
    const updatedProfiles = [...state.profiles];

    // 프로필에 ID가 없거나 빈 문자열이면 생성 (새 프로필)
    if (!profile.profileId || profile.profileId === '') {
      profile.profileId = generateProfileId();
    }

    // 기존 프로필이 있으면 업데이트, 없으면 추가
    const existingIndex = updatedProfiles.findIndex((p) => p.profileId === profile.profileId);
    if (
      existingIndex >= 0 &&
      Object.prototype.hasOwnProperty.call(updatedProfiles, existingIndex)
    ) {
      // eslint-disable-next-line security/detect-object-injection -- index from findIndex, validated above
      updatedProfiles[existingIndex] = profile;
    } else {
      // 새 프로필 추가 (최대 3개)
      if (updatedProfiles.length >= 3) {
        // 가장 오래된 프로필 제거
        updatedProfiles.shift();
      }
      updatedProfiles.push(profile);
    }

    // 프로필 목록 저장
    saveProfiles(updatedProfiles);
    saveActiveProfileId(profile.profileId);

    // 프로필이 변경되면 기록도 함께 변경
    const levelProgressStore = useLevelProgressStore.getState();
    const currentProgress = levelProgressStore.progress;

    // 프로필 ID를 키로 사용하여 기록 저장
    storageService.set(STORAGE_KEYS.PROGRESS(profile.profileId), currentProgress);

    set({ profile, isProfileComplete: !!profile.nickname, profiles: updatedProfiles });

    // 프로필이 변경되면 관리자 모드도 업데이트
    if (profile.isAdmin) {
      saveAdminMode(true);
      set({ isAdmin: true });
    } else if (savedAdminMode) {
      // 프로필이 관리자가 아니면 관리자 모드 해제
      saveAdminMode(false);
      set({ isAdmin: false });
    }
  },
  clearProfile: () => {
    saveActiveProfileId(null);
    set({ profile: null, isProfileComplete: false, isAdmin: false });
  },
  setIsAdmin: (isAdmin) => {
    saveAdminMode(isAdmin);
    set((state) => {
      // 프로필도 업데이트
      if (state.profile) {
        const updatedProfile = { ...state.profile, isAdmin };
        const updatedProfiles = state.profiles.map((p) =>
          p.profileId === updatedProfile.profileId ? updatedProfile : p
        );
        saveProfiles(updatedProfiles);
        return { isAdmin, profile: updatedProfile, profiles: updatedProfiles };
      }
      return { isAdmin };
    });
  },
  switchProfile: (profileId: string) => {
    const state = get();
    const profile = state.profiles.find((p) => p.profileId === profileId);
    if (!profile) return;

    // 활성 프로필 ID 저장
    saveActiveProfileId(profileId);

    // 해당 프로필의 기록 로드
    const progress = storageService.get<UserProgress>(STORAGE_KEYS.PROGRESS(profileId)) || {};
    useLevelProgressStore.setState({ progress });

    set({ profile, isProfileComplete: !!profile.nickname });

    // 관리자 모드 업데이트
    if (profile.isAdmin) {
      saveAdminMode(true);
      set({ isAdmin: true });
    } else {
      saveAdminMode(false);
      set({ isAdmin: false });
    }
  },
  deleteProfile: (profileId: string) => {
    const state = get();
    const updatedProfiles = state.profiles.filter((p) => p.profileId !== profileId);
    saveProfiles(updatedProfiles);

    // 삭제된 프로필의 기록도 삭제
    storageService.remove(STORAGE_KEYS.PROGRESS(profileId));

    // 현재 프로필이 삭제된 프로필이면 첫 번째 프로필로 전환
    if (state.profile?.profileId === profileId) {
      if (updatedProfiles.length > 0) {
        get().switchProfile(updatedProfiles[0].profileId);
      } else {
        saveActiveProfileId(null);
        set({ profile: null, isProfileComplete: false, profiles: [] });
      }
    } else {
      set({ profiles: updatedProfiles });
    }
  },
}));
