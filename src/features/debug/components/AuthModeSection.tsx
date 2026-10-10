import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';
import { useDebugStore } from '@/stores/useDebugStore';
import './AuthModeSection.css';

type AuthMode = 'anonymous' | 'authenticated' | 'developer';

interface TestResultData {
  accessible: boolean;
  data?: number;
  error?: string;
  hasData?: boolean;
  columns?: number;
  canPlay?: boolean;
}

export function AuthModeSection() {
  const { isAdminMode, setAdminMode } = useDebugStore();
  const [currentMode, setCurrentMode] = useState<AuthMode>(
    isAdminMode ? 'developer' : 'authenticated'
  );
  const [testResults, setTestResults] = useState<Record<string, TestResultData>>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [actualMode, setActualMode] = useState<AuthMode>(isAdminMode ? 'developer' : 'anonymous');

  const getDefaultTestResult = (accessible: boolean, error: string): TestResultData => ({
    accessible,
    error,
  });

  const testDataAccess = async () => {
    setLoading(true);
    const results: Record<string, TestResultData> = {};

    try {
      // ranking_view test
      const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_view')
        .select('*')
        .limit(3);
      results.ranking_view = {
        accessible: !rankingError,
        data: rankingData?.length || 0,
      };

      // profiles_all test
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);
      results.profiles_all = {
        accessible: !profilesError,
        data: profilesData?.length || 0,
      };

      // own_profile test
      results.own_profile = getDefaultTestResult(false, 'Not authenticated');
      const { data: { user } = {} } = await supabase.auth.getUser();
      if (user) {
        const { data: ownProfile, error: ownError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        results.own_profile = {
          accessible: !ownError,
          hasData: !!ownProfile,
          columns: ownProfile ? Object.keys(ownProfile).length : 0,
        };
      }

      // game_config test
      const { data: configData, error: configError } = await supabase
        .from('game_config')
        .select('*')
        .limit(1);
      results.game_config = {
        accessible: !configError,
        data: configData?.length || 0,
      };

      // game_play test
      results.game_play = getDefaultTestResult(false, 'Authentication required');
      if (user) {
        const { data: staminaData, error: staminaError } = await supabase.rpc(
          'check_and_recover_stamina'
        );
        results.game_play = {
          accessible: !staminaError,
          canPlay: !!staminaData,
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
        return;
      }
      setActualMode('anonymous');
      setUser(null);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTestResults((prev) => ({
        ...prev,
        auth_warning: {
          accessible: false,
          error: `${mode === 'developer' ? '개발자' : '일반'} 테스트를 위해서는 실제 로그인이 필요합니다. 로그인 페이지로 이동하여 로그인해 주세요.`,
        },
      }));
      return;
    }

    setActualMode(user ? 'authenticated' : 'anonymous');
    setUser(user);
    await testDataAccess();
  };

  useEffect(() => {
    testDataAccess();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setActualMode(user ? 'authenticated' : 'anonymous');
      setUser(user);
    };
    checkUser();
  }, []);

  return (
    <div className="debug-section">
      <h3>🔐 인증 모드 테스트</h3>

      <div className="debug-user-info-box">
        <p>
          <strong>현재 실제 상태:</strong>{' '}
          {actualMode === 'authenticated' ? '✅ 로그인됨' : '❌ 익명'}
        </p>
        {user && (
          <p>
            <strong>User ID:</strong> {user.id.slice(0, 8)}...
          </p>
        )}
      </div>

      <div className="debug-button-group">
        <button
          onClick={() => handleModeChange('anonymous')}
          className={currentMode === 'anonymous' ? 'active' : ''}
          disabled={loading}
        >
          👤 익명 모드 테스트
        </button>
        <button
          onClick={() => handleModeChange('authenticated')}
          className={currentMode === 'authenticated' ? 'active' : ''}
          disabled={loading}
        >
          ✅ 일반 계정 테스트
        </button>
        <button
          onClick={() => handleModeChange('developer')}
          className={currentMode === 'developer' ? 'active' : ''}
          disabled={loading}
        >
          🔧 개발자 모드 테스트
        </button>
      </div>

      <div className="debug-hint-box">
        <p>
          ℹ️ <strong>익명 모드 테스트</strong> 클릭 시 현재 세션에서 로그아웃됩니다.
        </p>
      </div>

      {loading && <p>테스트 중...</p>}

      {Object.keys(testResults).length > 0 && (
        <div className="debug-results">
          <h4>📊 접근 테스트 결과</h4>

          <div className="test-result-item">
            <strong>랭킹 뷰 (ranking_view):</strong>
            <span className={testResults.ranking_view?.accessible ? 'success' : 'error'}>
              {testResults.ranking_view?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {(testResults.ranking_view?.data ?? 0) > 0 && (
              <span> - {testResults.ranking_view?.data}건 조회</span>
            )}
          </div>

          <div className="test-result-item">
            <strong>전체 프로필 (profiles):</strong>
            <span className={testResults.profiles_all?.accessible ? 'success' : 'error'}>
              {testResults.profiles_all?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {testResults.profiles_all?.error && (
              <div className="error-detail">⚠️ {testResults.profiles_all.error}</div>
            )}
          </div>

          <div className="test-result-item">
            <strong>내 프로필:</strong>
            <span className={testResults.own_profile?.accessible ? 'success' : 'error'}>
              {testResults.own_profile?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {(testResults.own_profile?.columns ?? 0) > 0 && (
              <span> - {testResults.own_profile?.columns}개 컬럼</span>
            )}
          </div>

          <div className="test-result-item">
            <strong>게임 설정 (game_config):</strong>
            <span className={testResults.game_config?.accessible ? 'success' : 'error'}>
              {testResults.game_config?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
          </div>

          <div className="test-result-item">
            <strong>게임 플레이:</strong>
            <span className={testResults.game_play?.accessible ? 'success' : 'error'}>
              {testResults.game_play?.accessible ? '✅ 가능' : '❌ 불가능'}
            </span>
            {testResults.game_play?.error && (
              <div className="error-detail">⚠️ {testResults.game_play.error}</div>
            )}
          </div>
        </div>
      )}

      <div className="debug-info-list">
        <h4>📋 모드별 차이</h4>
        <ul>
          <li>
            <strong>익명:</strong> 랭킹, 게임 설정만 조회 가능
          </li>
          <li>
            <strong>일반 계정:</strong> 게임 플레이, 자기 정보 조회/수정 가능
          </li>
          <li>
            <strong>개발자:</strong> 디버그 기능 + 모든 권한
          </li>
        </ul>
      </div>
    </div>
  );
}
