import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { loadTierDefinitions, calculateTier, type TierInfo, type TierLevel } from '../../constants/tiers';
import { calculateScoreForTier } from '../../utils/tierUtils';
import { verifySync } from '../../utils/debugSync';
import { TierUpgradeModal } from '../TierUpgradeModal';
import './TierSystemSection.css';

export const TierSystemSection = React.memo(function TierSystemSection() {
  const { stats, refetch } = useMyPageStats();
  const [tierDefinitions, setTierDefinitions] = useState<TierInfo[]>([]);
  const [selectedTierLevel, setSelectedTierLevel] = useState<TierLevel>(0);
  const [masteryInput, setMasteryInput] = useState('0');
  const [calculationResult, setCalculationResult] = useState<{
    level: TierLevel;
    stars: number;
    currentCycleScore: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 티어 업그레이드 시뮬레이션 상태
  const [previousTierLevel, setPreviousTierLevel] = useState<TierLevel>(0);
  const [currentTierLevel, setCurrentTierLevel] = useState<TierLevel>(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    loadTierDefinitions().then(setTierDefinitions);
  }, []);

  useEffect(() => {
    if (stats) {
      const masteryScore = stats.totalMasteryScore ?? 0;
      setMasteryInput(masteryScore.toString());
      if (stats.currentTierLevel !== null) {
        setSelectedTierLevel(stats.currentTierLevel as TierLevel);
      }
      // 계산 결과 업데이트
      calculateTier(masteryScore).then(result => {
        setCalculationResult({
          level: result.level,
          stars: result.stars,
          currentCycleScore: result.currentCycleScore,
        });
      });
    }
  }, [stats]);

  const handleTierChange = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { data, error } = await supabase.rpc('debug_set_tier', {
        p_user_id: user.id,
        p_level: selectedTierLevel,
      });

      if (error) {
        setMessage({ type: 'error', text: `티어 변경 실패: ${error.message}` });
        return;
      }

      setMessage({ type: 'success', text: '티어가 변경되었습니다.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMasteryChange = (delta: number) => {
    const current = parseInt(masteryInput, 10) || 0;
    const newValue = Math.max(0, current + delta);
    setMasteryInput(newValue.toString());
  };

  const handleMasteryInputBlur = () => {
    const numValue = parseInt(masteryInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      const masteryScore = stats?.totalMasteryScore ?? 0;
      setMasteryInput(masteryScore.toString());
    }
  };

  const handleMasterySet = async () => {
    if (isUpdating) return;

    const numValue = parseInt(masteryInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      setMessage({ type: 'error', text: '유효한 점수를 입력하세요.' });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { data, error } = await supabase.rpc('debug_set_mastery_score', {
        p_user_id: user.id,
        p_score: numValue,
      });

      if (error) {
        setMessage({ type: 'error', text: `점수 설정 실패: ${error.message}` });
        return;
      }

      setMessage({ type: 'success', text: '마스터리 점수가 설정되었습니다.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowUpgradeModal = async () => {
    try {
      // 이전 티어와 현재 티어의 점수 계산
      // 티어 레벨에서 기본 점수를 계산 (별 0개, 보너스 0점)
      const prevScore = await calculateScoreForTier(previousTierLevel, 0, 0);
      const currScore = await calculateScoreForTier(currentTierLevel, 0, 0);
      
      setPreviousScore(prevScore);
      setCurrentScore(currScore);
      setShowUpgradeModal(true);
    } catch (err) {
      setMessage({ type: 'error', text: `점수 계산 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🏆 티어 시스템</h3>

      <div className="debug-tier-control">
        <div className="debug-tier-item">
          <label className="debug-tier-label">티어</label>
          <select
            className="debug-tier-select"
            value={selectedTierLevel}
            onChange={(e) => setSelectedTierLevel(parseInt(e.target.value, 10) as TierLevel)}
            disabled={isUpdating}
          >
            {tierDefinitions.map((tier) => (
              <option key={tier.level} value={tier.level}>
                {tier.icon} {tier.name}
              </option>
            ))}
          </select>
          <button
            className="debug-tier-button"
            onClick={handleTierChange}
            disabled={isUpdating}
          >
            티어 변경
          </button>
        </div>

        <div className="debug-tier-item">
          <label className="debug-tier-label">마스터리 점수</label>
          <div className="debug-tier-input-group">
            <button
              className="debug-tier-button-small"
              onClick={() => handleMasteryChange(-1000)}
              disabled={isUpdating}
            >
              -1000
            </button>
            <input
              type="number"
              className="debug-tier-input"
              value={masteryInput}
              onChange={(e) => setMasteryInput(e.target.value)}
              onBlur={handleMasteryInputBlur}
              min="0"
              disabled={isUpdating}
            />
            <button
              className="debug-tier-button-small"
              onClick={() => handleMasteryChange(1000)}
              disabled={isUpdating}
            >
              +1000
            </button>
          </div>
          <button
            className="debug-tier-button"
            onClick={handleMasterySet}
            disabled={isUpdating}
          >
            점수 설정
          </button>
        </div>
      </div>

      {calculationResult && (
        <div className="debug-tier-result">
          <h4 className="debug-subsection-title">계산 결과</h4>
          <div className="debug-tier-result-item">
            <span className="debug-tier-result-label">레벨:</span>
            <span className="debug-tier-result-value">
              {tierDefinitions.find(t => t.level === calculationResult.level)?.icon || ''}{' '}
              {tierDefinitions.find(t => t.level === calculationResult.level)?.name || calculationResult.level}
            </span>
          </div>
          <div className="debug-tier-result-item">
            <span className="debug-tier-result-label">별:</span>
            <span className="debug-tier-result-value">{calculationResult.stars}</span>
          </div>
          <div className="debug-tier-result-item">
            <span className="debug-tier-result-label">사이클 점수:</span>
            <span className="debug-tier-result-value">{calculationResult.currentCycleScore.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="debug-tier-upgrade-simulation">
        <h4 className="debug-subsection-title">티어 업그레이드 시뮬레이션</h4>
        <div className="debug-tier-upgrade-controls">
          <div className="debug-tier-upgrade-row">
            <label className="debug-tier-upgrade-label">이전 티어:</label>
            <select
              className="debug-tier-upgrade-select"
              value={previousTierLevel}
              onChange={(e) => setPreviousTierLevel(parseInt(e.target.value, 10) as TierLevel)}
            >
              {tierDefinitions.map((tier) => (
                <option key={tier.level} value={tier.level}>
                  {tier.icon} {tier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="debug-tier-upgrade-row">
            <label className="debug-tier-upgrade-label">현재 티어:</label>
            <select
              className="debug-tier-upgrade-select"
              value={currentTierLevel}
              onChange={(e) => setCurrentTierLevel(parseInt(e.target.value, 10) as TierLevel)}
            >
              {tierDefinitions.map((tier) => (
                <option key={tier.level} value={tier.level}>
                  {tier.icon} {tier.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="debug-tier-upgrade-button"
            onClick={handleShowUpgradeModal}
          >
            티어 업그레이드 모달 표시
          </button>
        </div>
      </div>

      {showUpgradeModal && (
        <TierUpgradeModal
          isOpen={showUpgradeModal}
          previousScore={previousScore}
          currentScore={currentScore}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
});

