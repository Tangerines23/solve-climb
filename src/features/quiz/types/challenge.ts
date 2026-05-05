import { Database } from '@/types/database.types';

type DBChallenge = Database['public']['Tables']['today_challenges']['Row'];

/**
 * Today's Challenge data structure
 */
export type TodayChallenge = {
  id: DBChallenge['id'];
  title: DBChallenge['title'];
  category?: DBChallenge['category_name'];
  categoryId?: DBChallenge['category_id'];
  topic?: DBChallenge['topic_name'];
  topicId?: DBChallenge['topic_id'];
  mode?: DBChallenge['mode'];
  level?: DBChallenge['level'];
  worldId?: string;
};

export type ProgressData = {
  cleared: boolean;
  level: number;
};

export type ProgressMap = Record<string, Record<string, Record<string, ProgressData>>>;
