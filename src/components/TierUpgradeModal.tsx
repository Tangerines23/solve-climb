// src/components/TierUpgradeModal.tsx
import React, { useEffect, useState } from 'react';
import { calculateTier, getTierInfo, type TierCalculationResult } from '../constants/tiers';
import './TierUpgradeModal.css';

interface TierUpgradeModalProps {
  isOpen: boolean;
  previousScore: number;
  currentScore: number;
  onClose: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  previousScore,
  currentScore,
  onClose
}) => {
  const [previousTier, setPreviousTier] = useState<TierCalculationResult | null>(null);
  const [currentTier, setCurrentTier] = useState<TierCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStarsAnimation, setShowStarsAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadTiers = async () => {
        setLoading(true);
        const prev = await calculateTier(previousScore);
        const curr = await calculateTier(currentScore);
        setPreviousTier(prev);
        setCurrentTier(curr);
        setLoading(false);

        // 별 추가 시 특별 애니메이션
        if (curr.stars > prev.stars) {
          setShowStarsAnimation(true);
          setTimeout(() => setShowStarsAnimation(false), 2000);
        }
      };
      loadTiers();
    }
  }, [isOpen, previousScore, currentScore]);

  // 티어 정보를 동기적으로 가져오기 위한 상태
  const [previousTierInfo, setPreviousTierInfo] = useState<{ icon: string; name: string } | null>(null);
  const [currentTierInfo, setCurrentTierInfo] = useState<{ icon: string; name: string } | null>(null);

  useEffect(() => {
    if (previousTier) {
      getTierInfo(previousTier.level).then(info => {
        if (info) {
          setPreviousTierInfo({ icon: info.icon, name: info.name });
        }
      });
    }
  }, [previousTier]);

  useEffect(() => {
    if (currentTier) {
      getTierInfo(currentTier.level).then(info => {
        if (info) {
          setCurrentTierInfo({ icon: info.icon, name: info.name });
        }
      });
    }
  }, [currentTier]);

  if (!isOpen || loading || !previousTier || !currentTier || !previousTierInfo || !currentTierInfo) return null;

  const tierUpgraded = currentTier.level > previousTier.level;
  const starsAdded = currentTier.stars > previousTier.stars;

  // 티어 업그레이드 또는 별 추가가 없으면 모달 표시 안 함
  if (!tierUpgraded && !starsAdded) return null;

  return (
    <div className="tier-upgrade-modal-overlay" onClick={onClose}>
      <div className="tier-upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tier-upgrade-header">
          {starsAdded ? (
            <>
              <h2>🌟 사이클 완료! 🌟</h2>
              <p>축하합니다! 새로운 사이클을 시작합니다!</p>
            </>
          ) : (
            <>
              <h2>🎉 티어 업그레이드! 🎉</h2>
              <p>축하합니다! 더 높은 티어에 도달했습니다!</p>
            </>
          )}
        </div>

        <div className="tier-upgrade-content">
          <div className="tier-comparison">
            <div className="tier-before">
              <div className="tier-icon-small">
                {previousTierInfo.icon}
              </div>
              <div className="tier-name-small">
                {previousTierInfo.name}
                {previousTier.stars > 0 && (
                  <span className="tier-stars-small">
                    {previousTier.stars >= 5 ? `★×${previousTier.stars}` : '★'.repeat(previousTier.stars)}
                  </span>
                )}
              </div>
            </div>

            <div className="tier-arrow">→</div>

            <div className="tier-after">
              <div className={`tier-icon-large ${showStarsAnimation ? 'stars-animation' : ''}`}>
                {currentTierInfo.icon}
              </div>
              <div className="tier-name-large">
                {currentTierInfo.name}
                {currentTier.stars > 0 && (
                  <span className="tier-stars-large">
                    {currentTier.stars >= 5 ? `★×${currentTier.stars}` : '★'.repeat(currentTier.stars)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {starsAdded && (
            <div className="stars-celebration">
              <div className="stars-display">
                {'★'.repeat(currentTier.stars)}
              </div>
              <p>새로운 사이클이 시작됩니다!</p>
            </div>
          )}
        </div>

        <div className="tier-upgrade-actions">
          <button className="tier-upgrade-button" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

