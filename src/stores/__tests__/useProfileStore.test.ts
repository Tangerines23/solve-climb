import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '../useProfileStore';

describe('useProfileStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useProfileStore.setState({
      profile: null,
      isProfileComplete: false,
      isAdmin: false,
      profiles: [],
    });
  });

  it('should set profile', () => {
    const { setProfile } = useProfileStore.getState();
    const newProfile = {
      profileId: 'test-profile',
      nickname: 'Test User',
      createdAt: new Date().toISOString(),
    };

    setProfile(newProfile);

    const { profile } = useProfileStore.getState();
    expect(profile?.profileId).toBe('test-profile');
    expect(profile?.nickname).toBe('Test User');
  });

  it('should clear profile', () => {
    const { setProfile, clearProfile } = useProfileStore.getState();
    setProfile({
      profileId: 'test-profile',
      nickname: 'Test User',
      createdAt: new Date().toISOString(),
    });

    clearProfile();

    const { profile, isProfileComplete } = useProfileStore.getState();
    expect(profile).toBeNull();
    expect(isProfileComplete).toBe(false);
  });

  it('should set admin mode', () => {
    const { setIsAdmin } = useProfileStore.getState();
    setIsAdmin(true);

    const { isAdmin } = useProfileStore.getState();
    expect(isAdmin).toBe(true);
  });

  it('should generate profileId when profileId is empty', () => {
    const { setProfile } = useProfileStore.getState();
    const newProfile = {
      profileId: '',
      nickname: 'Test User',
      createdAt: new Date().toISOString(),
    };

    setProfile(newProfile);

    const { profile } = useProfileStore.getState();
    expect(profile?.profileId).toBeTruthy();
    expect(profile?.profileId).not.toBe('');
  });

  it('should update existing profile', () => {
    const { setProfile } = useProfileStore.getState();
    const profileId = 'test-profile';
    const initialProfile = {
      profileId,
      nickname: 'Initial User',
      createdAt: new Date().toISOString(),
    };

    setProfile(initialProfile);

    const updatedProfile = {
      profileId,
      nickname: 'Updated User',
      createdAt: new Date().toISOString(),
    };

    setProfile(updatedProfile);

    const { profile, profiles } = useProfileStore.getState();
    expect(profile?.nickname).toBe('Updated User');
    expect(profiles.length).toBe(1); // Should not add duplicate
  });

  it('should add new profile when not exists', () => {
    const { setProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    setProfile(profile2);

    const { profiles } = useProfileStore.getState();
    expect(profiles.length).toBe(2);
  });

  it('should limit profiles to 3 and remove oldest', () => {
    const { setProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
    };
    const profile3 = {
      profileId: 'profile-3',
      nickname: 'User 3',
      createdAt: new Date().toISOString(),
    };
    const profile4 = {
      profileId: 'profile-4',
      nickname: 'User 4',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    setProfile(profile2);
    setProfile(profile3);
    setProfile(profile4);

    const { profiles } = useProfileStore.getState();
    expect(profiles.length).toBe(3);
    expect(profiles.find((p) => p.profileId === 'profile-1')).toBeUndefined();
    expect(profiles.find((p) => p.profileId === 'profile-4')).toBeDefined();
  });

  it('should set isAdmin when profile.isAdmin is true', () => {
    const { setProfile } = useProfileStore.getState();
    const adminProfile = {
      profileId: 'admin-profile',
      nickname: 'Admin User',
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };

    setProfile(adminProfile);

    const { isAdmin } = useProfileStore.getState();
    expect(isAdmin).toBe(true);
  });

  it('should switch profile successfully', () => {
    const { setProfile, switchProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    setProfile(profile2);

    switchProfile('profile-1');

    const { profile } = useProfileStore.getState();
    expect(profile?.profileId).toBe('profile-1');
  });

  it('should not switch to non-existent profile', () => {
    const { setProfile, switchProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);

    const initialProfile = useProfileStore.getState().profile;
    switchProfile('non-existent');

    const { profile } = useProfileStore.getState();
    expect(profile?.profileId).toBe(initialProfile?.profileId);
  });

  it('should delete profile and switch to first remaining', () => {
    const { setProfile, deleteProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    setProfile(profile2);
    deleteProfile('profile-1');

    const { profile, profiles } = useProfileStore.getState();
    expect(profiles.length).toBe(1);
    expect(profile?.profileId).toBe('profile-2');
  });

  it('should clear profile when deleting last profile', () => {
    const { setProfile, deleteProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    deleteProfile('profile-1');

    const { profile, profiles, isProfileComplete } = useProfileStore.getState();
    expect(profiles.length).toBe(0);
    expect(profile).toBeNull();
    expect(isProfileComplete).toBe(false);
  });

  it('should not switch profile when deleting non-active profile', () => {
    const { setProfile, deleteProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
    };

    setProfile(profile1);
    setProfile(profile2);
    deleteProfile('profile-1');

    const { profile } = useProfileStore.getState();
    expect(profile?.profileId).toBe('profile-2');
  });

  it('should update isAdmin when switching to admin profile', () => {
    const { setProfile, switchProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
      isAdmin: false,
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'Admin User',
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };

    setProfile(profile1);
    setProfile(profile2);
    switchProfile('profile-2');

    const { isAdmin } = useProfileStore.getState();
    expect(isAdmin).toBe(true);
  });

  it('should update isAdmin when switching to non-admin profile', () => {
    const { setProfile, switchProfile } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'Admin User',
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };
    const profile2 = {
      profileId: 'profile-2',
      nickname: 'User 2',
      createdAt: new Date().toISOString(),
      isAdmin: false,
    };

    setProfile(profile1);
    setProfile(profile2);
    switchProfile('profile-2');

    const { isAdmin } = useProfileStore.getState();
    expect(isAdmin).toBe(false);
  });

  it('should update profile when setIsAdmin is called with existing profile', () => {
    const { setProfile, setIsAdmin } = useProfileStore.getState();
    const profile1 = {
      profileId: 'profile-1',
      nickname: 'User 1',
      createdAt: new Date().toISOString(),
      isAdmin: false,
    };

    setProfile(profile1);
    setIsAdmin(true);

    const { profile, isAdmin } = useProfileStore.getState();
    expect(isAdmin).toBe(true);
    expect(profile?.isAdmin).toBe(true);
  });

  it('should not update profile when setIsAdmin is called without profile', () => {
    const { setIsAdmin } = useProfileStore.getState();
    setIsAdmin(true);

    const { isAdmin, profile } = useProfileStore.getState();
    expect(isAdmin).toBe(true);
    expect(profile).toBeNull();
  });
});
