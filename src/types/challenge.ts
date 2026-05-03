/**
 * Today's Challenge data structure
 */
export interface TodayChallenge {
  id: string;
  title: string;
  category?: string;
  categoryId?: string;
  topic?: string;
  topicId?: string;
  mode?: string;
  level?: number;
  worldId?: string;
}

export type ProgressData = {
  cleared: boolean;
  level: number;
};

export type ProgressMap = Record<string, Record<string, Record<string, ProgressData>>>;
