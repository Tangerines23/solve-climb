import { Database } from './database.types';

type DBTierDef = Database['public']['Tables']['tier_definitions']['Row'];

export type TierDefinition = {
  name: DBTierDef['name'];
  goal: DBTierDef['min_score'];
  icon: DBTierDef['icon'];
  colorVar: DBTierDef['color_var'];
  overlapLandmark?: MilestoneItem;
};

export interface MilestoneItem {
  id: string;
  altitude: number;
  label: string;
  type: 'tier' | 'landmark';
  icon: string;
  description?: string;
  isTier?: boolean;
  bottom?: number;
  parentTierId?: string;
  subLandmarks?: MilestoneItem[];
  // For tiers
  stars?: number;
  overlapLandmark?: MilestoneItem;
  representativeLandmark?: MilestoneItem;
}

export interface ScaleConfig {
  ratio: number;
  upgrade?: number;
  downgrade?: number;
}

export const ROADMAP_SCALE_CONFIG: ScaleConfig[] = [
  { ratio: 5, upgrade: 5000 },
  { ratio: 10, downgrade: 3000, upgrade: 20000 },
  { ratio: 30, downgrade: 10000, upgrade: 60000 },
  { ratio: 100, downgrade: 40000, upgrade: 150000 },
  { ratio: 150, downgrade: 120000, upgrade: 200000 },
  { ratio: 300, downgrade: 180000 },
];

export const TIER_CYCLE_LIMIT = 250000;
