import { Database } from '@/types/database.types';

type DBHallOfFame = Database['public']['Tables']['hall_of_fame']['Row'];

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

export type RankingRecord = Omit<DBHallOfFame, 'created_at' | 'id' | 'mode' | 'week_start_date'> & {
  week_start_date?: string;
};
