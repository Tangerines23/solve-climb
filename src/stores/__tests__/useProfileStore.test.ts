import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});

