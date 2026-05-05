export interface LevelRecord {
  level: number;
  cleared: boolean;
  bestScore: {
    'time-attack': number | null;
    survival: number | null;
    infinite: number | null;
  };
  clearedAt?: string;
}

export interface CategoryProgress {
  [category: string]: {
    [level: number]: LevelRecord;
  };
}

export interface UserProgress {
  [world: string]: CategoryProgress;
}

export interface RankingRecord {
  user_id: string;
  nickname: string;
  score: number;
  rank: number;
  week_start_date?: string;
  tier_level?: number;
  tier_stars?: number;
}
