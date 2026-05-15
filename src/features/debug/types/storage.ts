import { type MyPageStatsData as MyPageStats } from '@/features/mypage';

export interface DebugSnapshot {
  stats: MyPageStats;
  timestamp: string;
}
