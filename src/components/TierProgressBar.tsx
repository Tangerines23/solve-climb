// src/components/TierProgressBar.tsx
import React, { useEffect, useState } from 'react';
import { calculateTier, getNextTierInfo, type TierCalculationResult } from '../constants/tiers';
import './TierProgressBar.css';

interface TierProgressBarProps {
  totalScore: number;
  size?: 'small' | 'medium' | 'large';
}

export const TierProgressBar: React.FC<TierProgressBarProps> = ({ 
  totalScore, 
  size = 'medium' 
}) => {
  const [tierResult, setTierResult] = useState<TierCalculationResult | null>(null);
  const [nextTierInfo, setNextTierInfo] = useState<{ name: string; minScore: number; remaining: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTierInfo = async () => {
      try {
        const tier = await calculateTier(totalScore);
        setTierResult(tier);
        
        const next = await getNextTierInfo(totalScore);
        setNextTierInfo(next);
        
        if (next) {
          // 진행률 계산
          const currentScore = tier.stars === 0 ? totalScore : tier.currentCycleScore;
          const progressPercent = next.minScore > 0 
            ? (currentScore / next.minScore) * 100 
            : 0;
          setProgress(Math.min(100, Math.max(0, progressPercent)));
        }
      } catch (error) {
        console.error('Failed to load tier info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTierInfo();
  }, [totalScore]);
  
  if (loading || !tierResult || !nextTierInfo) {
    return null;
  }
  
  return (
    <div className={`tier-progress-bar tier-progress-bar-${size}`}>
      <div className="tier-progress-label">
        <span className="current-tier">
          {tierResult.stars > 0 && `★${tierResult.stars >= 5 ? `×${tierResult.stars}` : '★'.repeat(tierResult.stars)} `}
          현재 티어
        </span>
        <span className="next-tier">→ {nextTierInfo.name}</span>
      </div>
      <div className="tier-progress-bar-container">
        <div 
          className="tier-progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="tier-progress-text">
        <span className="remaining-score">{nextTierInfo.remaining.toLocaleString()}점 남음</span>
      </div>
    </div>
  );
};

