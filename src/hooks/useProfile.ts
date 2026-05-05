import { useState, useCallback } from 'react';
import { UserProfile, useProfileStore } from '../stores/useProfileStore';
import { sanitizeNickname, validateNickname } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';

export function useProfile() {
  const profile = useProfileStore((state) => state.profile);
  const setProfileStore = useProfileStore((state) => state.setProfile);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = useCallback(
    async (nickname: string) => {
      setIsUpdating(true);
      try {
        const sanitizedNickname = sanitizeNickname(nickname);
        const validation = validateNickname(sanitizedNickname);

        if (!validation.valid) {
          throw new Error(validation.error || '닉네임이 올바르지 않습니다.');
        }

        const profileData: UserProfile = {
          profileId: profile?.profileId || '',
          nickname: sanitizedNickname,
          createdAt: profile?.createdAt || new Date().toISOString(),
          isAdmin: profile?.isAdmin || false,
        };

        // 1. Update local store
        setProfileStore(profileData);

        // 2. Sync to Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase.rpc('rpc_update_nickname', {
            p_nickname: sanitizedNickname,
          });
          if (error) {
            console.error('Failed to sync nickname to Supabase:', error);
          } else {
            console.log('Nickname synced to Supabase');
          }
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.',
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [profile, setProfileStore]
  );

  return {
    profile,
    updateProfile,
    isUpdating,
  };
}
