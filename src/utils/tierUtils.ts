import { loadTierDefinitions, loadCycleCap } from '../constants/tiers';

/**
 * 티어 레벨과 별 개수로부터 필요한 마스터리 점수를 계산
 * @param level 티어 레벨 (0-6)
 * @param stars 별 개수 (0 이상)
 * @param bonusScore 추가 보너스 점수 (기본 0)
 * @returns 필요한 total_mastery_score
 */
export async function calculateScoreForTier(
  level: number, 
  stars: number = 0, 
  bonusScore: number = 0
): Promise<number> {
  const cycleCap = await loadCycleCap(); // 250000 (기본값)
  
  // stars가 0이면 첫 사이클
  if (stars === 0) {
    // level에 해당하는 최소 점수 계산
    const tierLevels = await loadTierDefinitions();
    const targetTier = tierLevels.find(t => t.level === level);
    return (targetTier?.minScore || 0) + bonusScore;
  }
  
  // stars가 있으면: cycleCap * stars + level 최소 점수 + bonus
  const tierLevels = await loadTierDefinitions();
  const targetTier = tierLevels.find(t => t.level === level);
  return cycleCap * stars + (targetTier?.minScore || 0) + bonusScore;
}
