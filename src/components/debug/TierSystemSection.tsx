import React from 'react';
import { useTierDebugBridge } from '@/features/quiz/hooks/bridge/useTierDebugBridge';
import { type TierLevel } from '@/features/quiz/constants/tiers';
import { TierUpgradeModal } from '@/features/quiz/components/TierUpgradeModal';
import './TierSystemSection.css';

export const TierSystemSection = React.memo(function TierSystemSection() {
  const {
    tierDefinitions,
    selectedTierLevel,
    setSelectedTierLevel,
    masteryInput,
    setMasteryInput,
    calculationResult,
    isUpdating,
    message,
    previousTierLevel,
    setPreviousTierLevel,
    currentTierLevel,
    setCurrentTierLevel,
    showUpgradeModal,
    setShowUpgradeModal,
    previousScore,
    currentScore,
    handleTierChange,
    handleMasterySet,
    handleMasteryChange,
    handleMasteryInputBlur,
    handleShowUpgradeModal,
  } = useTierDebugBridge();

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🏆 티어 시스템</h3>

      <div className="debug-tier-control">
        <div className="debug-tier-item">
          <label htmlFor="debug-tier-select" className="debug-tier-label">
            티어
          </label>
          <select
            id="debug-tier-select"
            name="selectedTierLevel"
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
          <button className="debug-tier-button" onClick={handleTierChange} disabled={isUpdating}>
            티어 변경
          </button>
        </div>

        <div className="debug-tier-item">
          <label htmlFor="debug-mastery-input" className="debug-tier-label">
            마스터리 점수
          </label>
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
              id="debug-mastery-input"
              name="mastery"
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
          <button className="debug-tier-button" onClick={handleMasterySet} disabled={isUpdating}>
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
              {tierDefinitions.find((t) => t.level === calculationResult.level)?.icon || ''}{' '}
              {tierDefinitions.find((t) => t.level === calculationResult.level)?.name ||
                calculationResult.level}
            </span>
          </div>
          <div className="debug-tier-result-item">
            <span className="debug-tier-result-label">별:</span>
            <span className="debug-tier-result-value">{calculationResult.stars}</span>
          </div>
          <div className="debug-tier-result-item">
            <span className="debug-tier-result-label">사이클 점수:</span>
            <span className="debug-tier-result-value">
              {calculationResult.currentCycleScore.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="debug-tier-upgrade-simulation">
        <h4 className="debug-subsection-title">티어 업그레이드 시뮬레이션</h4>
        <div className="debug-tier-upgrade-controls">
          <div className="debug-tier-upgrade-row">
            <label htmlFor="debug-previous-tier-select" className="debug-tier-upgrade-label">
              이전 티어:
            </label>
            <select
              id="debug-previous-tier-select"
              name="previousTierLevel"
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
            <label htmlFor="debug-current-tier-select" className="debug-tier-upgrade-label">
              현재 티어:
            </label>
            <select
              id="debug-current-tier-select"
              name="currentTierLevel"
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
          <button className="debug-tier-upgrade-button" onClick={handleShowUpgradeModal}>
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
        <div className={`debug-message debug-message-${message.type}`}>{message.text}</div>
      )}
    </div>
  );
});
