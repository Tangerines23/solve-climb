import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useProfileStore, type ProfileState } from '../stores/useProfileStore';
import type { UserProfile as Profile } from '../stores/useProfileStore';
import { Email } from '../domain/Email';

/**
 * Nickname validation logic
 * - Length: 2-10 characters
 * - No special characters (only Korean, English, Numbers)
 */
export const validateNickname = (nickname: string): string | null => {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return '닉네임을 입력해주세요.';
  if (trimmed.length < 2) return '닉네임은 2자 이상이어야 합니다.';
  if (trimmed.length > 10) return '닉네임은 10자 이하이어야 합니다.';

  // 특수문자 제외 (한글, 영문, 숫자만 허용)
  const regex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
  if (!regex.test(trimmed)) return '특수문자는 사용할 수 없습니다.';

  return null;
};

/**
 * Hook for managing user profile
 * Handles local store and remote Supabase synchronization
 */
export function useProfile() {
  const profile = useProfileStore((state: ProfileState) => state.profile);
  const setProfile = useProfileStore((state: ProfileState) => state.setProfile);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Updates profile both locally and remotely
   * Supports both Partial<Profile> object and nickname string for backward compatibility
   */
  const updateProfile = async (updates: Partial<Profile> | string) => {
    setIsUpdating(true);

    // Normalize updates
    const finalUpdates: Partial<Profile> =
      typeof updates === 'string' ? { nickname: updates } : { ...updates };

    // 1. Nickname validation & sanitization (Do this first!)
    if (finalUpdates.nickname !== undefined) {
      const sanitized = finalUpdates.nickname.trim();
      const validationError = validateNickname(sanitized);
      if (validationError) {
        setIsUpdating(false);
        return { success: false, error: validationError };
      }
      finalUpdates.nickname = sanitized;
    }

    // 2. Target Profile ID (or userId for creation)
    const targetProfileId = finalUpdates.profileId || profile?.profileId;

    // If it's a new profile (no targetProfileId), we can still proceed with nickname update via RPC
    // as it uses the authenticated session's UID.
    if (!targetProfileId && !finalUpdates.nickname) {
      setIsUpdating(false);
      return { success: false, error: '프로필 ID가 없습니다.' };
    }

    const previousProfile = profile;

    try {
      // 1. Remote update (Supabase)
      if (finalUpdates.nickname) {
        // Use secure RPC for nickname updates
        const { error: rpcError } = await supabase.rpc('rpc_update_nickname', {
          p_nickname: finalUpdates.nickname,
        });
        if (rpcError) throw rpcError;

        // If there are other updates, perform them separately (requires profile ID)
        const { nickname, ...otherUpdates } = finalUpdates;
        if (Object.keys(otherUpdates).length > 0 && targetProfileId) {
          const { error } = await supabase
            .from('profiles')
            .update(otherUpdates)
            .eq('profile_id', targetProfileId);
          if (error) throw error;
        }
      } else if (targetProfileId) {
        // Other fields can be updated directly via RLS
        const { error } = await supabase
          .from('profiles')
          .update(finalUpdates)
          .eq('profile_id', targetProfileId);
        if (error) throw error;
      }

      // 2. Local update (After successful remote update)
      // If profile exists, update it. If not, we're in creation flow.
      if (profile) {
        setProfile({ ...profile, ...finalUpdates });
      } else if (finalUpdates.nickname) {
        // For new profiles, we fetch the current session to populate initial profile data
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setProfile({
          profileId: targetProfileId || '', // setProfile will generate one if empty
          nickname: finalUpdates.nickname,
          email: Email.create(session?.user?.email || 'anonymous@solveclimb.com'),
          createdAt: new Date().toISOString(),
          userId: session?.user?.id,
          ...finalUpdates,
        } as Profile);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Rollback local state on failure
      if (previousProfile) {
        setProfile(previousProfile);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.',
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    setProfile, // Export for initial setup (e.g. anonymous login)
    updateProfile,
    validateNickname,
    isUpdating,
  };
}
