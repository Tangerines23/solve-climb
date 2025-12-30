import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { useUserStore } from '../../stores/useUserStore';
import './DataResetSection.css';

export function DataResetSection() {
  const { stats, refetch } = useMyPageStats();
  const { fetchUserData } = useUserStore();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResetProfile = async (resetType: 'all' | 'score' | 'minerals' | 'tier') => {
    if (isResetting) return;
    if (!confirm(`프로필을 초기화하시겠습니까? (타입: ${resetType})`)) return;

    try {
      setIsResetting(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { data, error } = await supabase.rpc('debug_reset_profile', {
        p_user_id: user.id,
        p_reset_type: resetType,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '프로필이 초기화되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({ type: 'error', text: `초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solve-climb-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '데이터가 내보내졌습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: `내보내기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setIsResetting(true);
          setMessage(null);

          const data = JSON.parse(event.target?.result as string);
          
          if (!data.stats) {
            setMessage({ type: 'error', text: '유효하지 않은 데이터 형식입니다.' });
            setIsResetting(false);
            return;
          }

          const { data: { user } } = await supabase.auth.getSession();
          if (!user) {
            setMessage({ type: 'error', text: '로그인이 필요합니다.' });
            setIsResetting(false);
            return;
          }

          // 실제 데이터 적용
          const updatePromises: Promise<any>[] = [];

          // 마스터리 점수 적용
          if (data.stats.totalMasteryScore !== undefined) {
            updatePromises.push(
              supabase.rpc('debug_set_mastery_score', {
                p_user_id: user.id,
                p_score: data.stats.totalMasteryScore,
              })
            );
          }

          // 티어 레벨 적용
          if (data.stats.currentTierLevel !== undefined && data.stats.currentTierLevel !== null) {
            updatePromises.push(
              supabase.rpc('debug_set_tier', {
                p_user_id: user.id,
                p_level: data.stats.currentTierLevel,
              })
            );
          }

          // 모든 업데이트 실행
          const results = await Promise.allSettled(updatePromises);
          
          // 에러 확인
          const errors = results.filter(r => r.status === 'rejected');
          if (errors.length > 0) {
            const errorMessages = errors.map(e => 
              e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''
            ).join(', ');
            setMessage({ type: 'error', text: `일부 데이터 적용 실패: ${errorMessages}` });
          } else {
            setMessage({ type: 'success', text: '데이터가 가져와져 적용되었습니다.' });
            await Promise.all([refetch(), fetchUserData()]);
          }
        } catch (err) {
          setMessage({ type: 'error', text: `가져오기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
        } finally {
          setIsResetting(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveSnapshot = () => {
    try {
      const snapshot = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('debug_snapshot', JSON.stringify(snapshot));
      setMessage({ type: 'success', text: '스냅샷이 저장되었습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: `스냅샷 저장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    }
  };

  const handleRestoreSnapshot = async () => {
    try {
      setIsResetting(true);
      setMessage(null);

      const snapshotStr = localStorage.getItem('debug_snapshot');
      if (!snapshotStr) {
        setMessage({ type: 'error', text: '저장된 스냅샷이 없습니다.' });
        setIsResetting(false);
        return;
      }

      const snapshot = JSON.parse(snapshotStr);
      
      if (!snapshot.stats) {
        setMessage({ type: 'error', text: '유효하지 않은 스냅샷 형식입니다.' });
        setIsResetting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        setIsResetting(false);
        return;
      }

      // 실제 데이터 적용 (JSON 가져오기와 동일한 로직)
      const updatePromises: Promise<any>[] = [];

      if (snapshot.stats.totalMasteryScore !== undefined) {
        updatePromises.push(
          supabase.rpc('debug_set_mastery_score', {
            p_user_id: user.id,
            p_score: snapshot.stats.totalMasteryScore,
          })
        );
      }

      if (snapshot.stats.currentTierLevel !== undefined && snapshot.stats.currentTierLevel !== null) {
        updatePromises.push(
          supabase.rpc('debug_set_tier', {
            p_user_id: user.id,
            p_level: snapshot.stats.currentTierLevel,
          })
        );
      }

      const results = await Promise.allSettled(updatePromises);
      
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        const errorMessages = errors.map(e => 
          e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''
        ).join(', ');
        setMessage({ type: 'error', text: `일부 데이터 복원 실패: ${errorMessages}` });
      } else {
        setMessage({ type: 'success', text: '스냅샷이 복원되었습니다.' });
        await Promise.all([refetch(), fetchUserData()]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: `스냅샷 복원 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">💾 데이터 관리</h3>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">프로필 초기화</h4>
        <div className="debug-reset-buttons">
          <button
            className="debug-reset-button debug-reset-button-score"
            onClick={() => handleResetProfile('score')}
            disabled={isResetting}
          >
            점수만
          </button>
          <button
            className="debug-reset-button debug-reset-button-minerals"
            onClick={() => handleResetProfile('minerals')}
            disabled={isResetting}
          >
            미네랄만
          </button>
          <button
            className="debug-reset-button debug-reset-button-tier"
            onClick={() => handleResetProfile('tier')}
            disabled={isResetting}
          >
            티어만
          </button>
          <button
            className="debug-reset-button debug-reset-button-all"
            onClick={() => handleResetProfile('all')}
            disabled={isResetting}
          >
            전체
          </button>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">상태 내보내기/가져오기</h4>
        <div className="debug-export-buttons">
          <button
            className="debug-export-button"
            onClick={handleExportData}
          >
            JSON 다운로드
          </button>
          <button
            className="debug-export-button"
            onClick={handleImportData}
          >
            JSON 가져오기
          </button>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">스냅샷</h4>
        <div className="debug-snapshot-buttons">
          <button
            className="debug-snapshot-button"
            onClick={handleSaveSnapshot}
          >
            저장
          </button>
          <button
            className="debug-snapshot-button"
            onClick={handleRestoreSnapshot}
          >
            복원
          </button>
        </div>
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

