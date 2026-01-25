import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import './AuthModeSection.css';

type AuthMode = 'anonymous' | 'authenticated' | 'developer';

export function AuthModeSection() {
    const [currentMode, setCurrentMode] = useState<AuthMode>('authenticated');
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [actualMode, setActualMode] = useState<AuthMode>('anonymous');

    const testDataAccess = async () => {
        setLoading(true);
        const results: Record<string, any> = {};

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
            const { data: { user } } = await supabase.auth.getUser();
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
            if (user) {
                const { data: staminaData, error: staminaError } = await supabase
                    .rpc('check_and_recover_stamina');

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

        } catch (error: any) {
            results.error = error.message;
        }

        setTestResults(results);
        setLoading(false);
    };

    const handleModeChange = async (mode: AuthMode) => {
        setCurrentMode(mode);

        // 실제로는 로그아웃/로그인 처리가 필요하지만,
        // 여기서는 현재 상태만 표시
        await testDataAccess();
    };

    // 초기 로드 시 자동으로 테스트 실행
    useEffect(() => {
        testDataAccess();
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setActualMode(user ? 'authenticated' : 'anonymous');
            setUser(user);
        };
        checkUser();
    }, []);

    return (
        <div className="debug-section">
            <h3>🔐 인증 모드 테스트</h3>

            <div className="debug-user-info-box">
                <p><strong>현재 실제 상태:</strong> {actualMode === 'authenticated' ? '✅ 로그인됨' : '❌ 익명'}</p>
                {user && <p><strong>User ID:</strong> {user.id.slice(0, 8)}...</p>}
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

            {loading && <p>테스트 중...</p>}

            {Object.keys(testResults).length > 0 && (
                <div className="debug-results">
                    <h4>📊 접근 테스트 결과</h4>

                    <div className="test-result-item">
                        <strong>랭킹 뷰 (ranking_view):</strong>
                        <span className={testResults.ranking_view?.accessible ? 'success' : 'error'}>
                            {testResults.ranking_view?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
                        </span>
                        {testResults.ranking_view?.data > 0 && (
                            <span> - {testResults.ranking_view.data}건 조회</span>
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
                        {testResults.own_profile?.columns > 0 && (
                            <span> - {testResults.own_profile.columns}개 컬럼</span>
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

            <div className="debug-user-info-box" style={{ marginTop: '1rem' }}>
                <h4>📋 모드별 차이</h4>
                <ul>
                    <li><strong>익명:</strong> 랭킹, 게임 설정만 조회 가능</li>
                    <li><strong>일반 계정:</strong> 게임 플레이, 자기 정보 조회/수정 가능</li>
                    <li><strong>개발자:</strong> 디버그 기능 + 모든 권한</li>
                </ul>
            </div>
        </div>
    );
}
