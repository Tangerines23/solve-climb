// src/components/TierBadge.tsx
import React, { useEffect, useState } from 'react';
import { TierLevel, calculateTier, getTierInfo, type TierInfo } from '../constants/tiers';
import './TierBadge.css';

interface TierBadgeProps {
  totalScore: number; // 점수로부터 티어 계산
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showStars?: boolean;
  currentTierLevel?: TierLevel; // 승급 대기자 구분용 (랭킹에서 사용)
}

export function TierBadge({ 
  totalScore,
  size = 'medium',
  showLabel = true,
  showStars = true,
  currentTierLevel
}: TierBadgeProps) {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [tierResult, setTierResult] = useState<{ level: TierLevel; stars: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTier = async () => {
      try {
        const result = await calculateTier(totalScore);
        setTierResult(result);
        
        // currentTierLevel이 제공되면 그것을 사용 (승급 대기자 구분용)
        const levelToUse = currentTierLevel !== undefined ? currentTierLevel : result.level;
        const info = await getTierInfo(levelToUse);
        setTierInfo(info);
      } catch (error) {
        console.error('Failed to load tier:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTier();
  }, [totalScore, currentTierLevel]);
  
  if (loading || !tierInfo || !tierResult) {
    return (
      <div className={`tier-badge tier-badge-${size}`}>
        <div className="tier-icon">⛺</div>
      </div>
    );
  }
  
  // 별 표시 (5개 이상이면 숫자로)
  const starsDisplay = tierResult.stars > 0 
    ? (tierResult.stars >= 5 ? `★×${tierResult.stars}` : '★'.repeat(tierResult.stars))
    : '';

  // 테두리 시스템: 별 개수에 따라 테두리 색상 변경
  // ⚠️ UX 개선: 별이 있는 베이스캠프는 특별한 스타일 (상실감 방지)
  const getBorderStyle = (stars: number, level: TierLevel): React.CSSProperties => {
    // 별이 있는 베이스캠프는 전설의 잔향이 남은 스타일
    if (level === 0 && stars > 0) {
      return {
        borderColor: 'var(--color-tier-legend)', // 금색 테두리
        borderWidth: '3px',
        borderStyle: 'solid',
        background: 'linear-gradient(135deg, var(--color-tier-base) 0%, var(--color-tier-legend) 100%)', // 그라데이션
        boxShadow: '0 0 12px var(--color-tier-legend)',
        animation: 'tier-glow 2s ease-in-out infinite'
      };
    }
    
    // 일반 테두리 시스템
    if (stars === 0) return {}; // 일반 (테두리 없음)
    if (stars === 1) return { 
      borderColor: 'var(--color-tier-trail)',
      borderWidth: '2px',
      borderStyle: 'solid'
    }; // 동색
    if (stars === 2) return { 
      borderColor: 'var(--color-tier-mid)',
      borderWidth: '2px',
      borderStyle: 'solid'
    }; // 은색
    if (stars >= 3) return { 
      borderColor: 'var(--color-tier-legend)', // 금색
      borderWidth: '2px',
      borderStyle: 'solid',
      boxShadow: '0 0 8px var(--color-tier-legend)', // 반짝임 효과
      animation: 'tier-glow 2s ease-in-out infinite'
    };
    return {};
  };

  return (
    <div className={`tier-badge tier-badge-${size}`}>
      <div 
        className="tier-icon"
        style={{ 
          color: `var(${tierInfo.colorVar})`,
          ...getBorderStyle(tierResult.stars, tierResult.level)
        }}
      >
        <span className="tier-emoji">{tierInfo.icon}</span>
      </div>
      {showLabel && (
        <div className="tier-label">
          <span className="tier-name">
            {tierInfo.name}
            {showStars && tierResult.stars > 0 && (
              <span className="tier-stars">{starsDisplay}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

