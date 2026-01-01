import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import './BoundaryTestSection.css';

export const BoundaryTestSection = React.memo(function BoundaryTestSection() {
  const { setMinerals, setStamina, fetchUserData } = useUserStore();
  const { refetch } = useMyPageStats();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStaminaSet = async (value: number) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);
      await setStamina(value);
      await fetchUserData();
      setMessage({ type: 'success', text: `스태미나가 ${value}로 설정되었습니다.` });
    } catch (err) {
      setMessage({ type: 'error', text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMineralsSet = async (value: number) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);
      await setMinerals(value);
      await fetchUserData();
      setMessage({ type: 'success', text: `미네랄이 ${value.toLocaleString()}로 설정되었습니다.` });
    } catch (err) {
      setMessage({ type: 'error', text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTierSet = async (level: number) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase.rpc('debug_set_tier', {
        p_user_id: user.id,
        p_level: level,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `티어가 레벨 ${level}로 설정되었습니다.` });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMasteryScoreSet = async (score: number) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase.rpc('debug_set_mastery_score', {
        p_user_id: user.id,
        p_score: score,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `마스터리 점수가 ${score.toLocaleString()}로 설정되었습니다.` });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: `설정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🔬 경계값 테스트</h3>

      <div className="debug-boundary-group">
        <h4 className="debug-subsection-title">스태미나</h4>
        <div className="debug-boundary-buttons">
          <button
            className="debug-boundary-button"
            onClick={() => handleStaminaSet(0)}
            disabled={isUpdating}
          >
            0
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleStaminaSet(1)}
            disabled={isUpdating}
          >
            1
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleStaminaSet(5)}
            disabled={isUpdating}
          >
            5
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleStaminaSet(10)}
            disabled={isUpdating}
          >
            10
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleStaminaSet(999)}
            disabled={isUpdating}
          >
            999
          </button>
        </div>
      </div>

      <div className="debug-boundary-group">
        <h4 className="debug-subsection-title">미네랄</h4>
        <div className="debug-boundary-buttons">
          <button
            className="debug-boundary-button"
            onClick={() => handleMineralsSet(0)}
            disabled={isUpdating}
          >
            0
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleMineralsSet(1)}
            disabled={isUpdating}
          >
            1
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleMineralsSet(10000)}
            disabled={isUpdating}
          >
            10,000
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleMineralsSet(999999)}
            disabled={isUpdating}
          >
            999,999
          </button>
        </div>
      </div>

      <div className="debug-boundary-group">
        <h4 className="debug-subsection-title">티어</h4>
        <div className="debug-boundary-buttons">
          <button
            className="debug-boundary-button"
            onClick={() => handleTierSet(0)}
            disabled={isUpdating}
          >
            0 (베이스캠프)
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleTierSet(1)}
            disabled={isUpdating}
          >
            1 (등산로)
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleTierSet(6)}
            disabled={isUpdating}
          >
            6 (전설)
          </button>
        </div>
      </div>

      <div className="debug-boundary-group">
        <h4 className="debug-subsection-title">마스터리 점수</h4>
        <div className="debug-boundary-buttons">
          <button
            className="debug-boundary-button"
            onClick={() => handleMasteryScoreSet(0)}
            disabled={isUpdating}
          >
            0
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleMasteryScoreSet(250000)}
            disabled={isUpdating}
          >
            250,000
          </button>
          <button
            className="debug-boundary-button"
            onClick={() => handleMasteryScoreSet(2500000)}
            disabled={isUpdating}
          >
            2,500,000
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
});

