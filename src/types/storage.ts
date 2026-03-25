// 스토리지 관련 타입 정의
import { World, Category } from './quiz';
import { MyPageStats } from '../hooks/useMyPageStats';

export interface LocalSession {
  userId?: string;
  isAdmin?: boolean;
  world: World;
  category: Category;
  level: number;
  lastVisited?: number;
}

export interface DebugSnapshot {
  stats: MyPageStats;
  timestamp: string;
}

export type StorageKeyType =
  | 'local-session'
  | 'debug_snapshot'
  | 'last_visited_mountain'
  | 'last_visited_world'
  | 'last_visited_category'
  | 'admin-mode'
  | 'debug_mode';
