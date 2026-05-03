import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { useDebugStore } from '../stores/useDebugStore';

export type AuthMode = 'anonymous' | 'authenticated' | 'developer';

export interface TestResultData {
  accessible: boolean;
  data?: number;
  error?: string;
  hasData?: boolean;
  columns?: number;
  canPlay?: boolean;
}

export function useAuthModeDebugBridge() {
  const { isAdminMode, setAdminMode } = useDebugStore();
  const [currentMode, setCurrentMode] = useState<AuthMode>(
    isAdminMode ? 'developer' : 'authenticated'
  );
  const [testResults, setTestResults] = useState<Record<string, TestResultData>>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [actualMode, setActualMode] = useState<AuthMode>(isAdminMode ? 'developer' : 'anonymous');

  const testDataAccess = async () => {
    setLoading(true);
    const results: Record<string, TestResultData> = {};

    try {
      // Test 1: ranking_view 조회
      const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_view')
        .select('*')
        .limit(3);

      results.ranking_view = {
        accessible: !rankingError,
        data: rankingData?.length || 0,
        error: rankingError?.message,
      };

      // Test 2: profiles 전체 조회 시도
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);

      results.profiles_all = {
        accessible: !profilesError,
        data: profilesData?.length || 0,
        error: profilesError?.message,
      };

      // Test 3: 자기 프로필 조회
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: ownProfile, error: ownError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        results.own_profile = {
          accessible: !ownError,
          hasData: !!ownProfile,
          columns: ownProfile ? Object.keys(ownProfile).length : 0,
          error: ownError?.message,
        };
      } else {
        results.own_profile = {
          accessible: false,
          error: 'Not authenticated',
        };
      }

      // Test 4: game_config 조회 (공개 데이터)
      const { data: configData, error: configError } = await supabase
        .from('game_config')
        .select('*')
        .limit(1);

      results.game_config = {
        accessible: !configError,
        data: configData?.length || 0,
        error: configError?.message,
      };

      // Test 5: 게임 플레이 시도 (RPC 호출)
      if (currentUser) {
        const { data: staminaData, error: staminaError } = await supabase.rpc(
          'check_and_recover_stamina'
        );

        results.game_play = {
          accessible: !staminaError,
          canPlay: !!staminaData,
          error: staminaError?.message,
        };
      } else {
        results.game_play = {
          accessible: false,
          error: 'Authentication required',
        };
      }
    } catch (error: unknown) {
      results.system_error = {
        accessible: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  const handleModeChange = async (mode: AuthMode) => {
    setCurrentMode(mode);
    setAdminMode(mode === 'developer');

    if (mode === 'anonymous') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out failed:', error);
      } else {
        setActualMode('anonymous');
        setUser(null);
      }
    } else if (mode === 'authenticated' || mode === 'developer') {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        setTestResults((prev) => ({
          ...prev,
          auth_warning: {
            accessible: false,
            error: `${mode === 'developer' ? '개발자' : '일반'} 테스트를 위해서는 실제 로그인이 필요합니다. 로그인 페이지로 이동하여 로그인해 주세요.`,
          },
        }));
        return;
      }
    }

    await testDataAccess();
  };

  useEffect(() => {
    testDataAccess();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setActualMode(currentUser ? 'authenticated' : 'anonymous');
      setUser(currentUser);
    };
    checkUser();
  }, []);

  return {
    currentMode,
    actualMode,
    user,
    testResults,
    loading,
    handleModeChange,
    testDataAccess,
  };
}
