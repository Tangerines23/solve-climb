import { Database } from './database.types';

type DBBadgeDef = Database['public']['Tables']['badge_definitions']['Row'];
type DBUserBadge = Database['public']['Tables']['user_badges']['Row'];

export type BadgeDefinition = Pick<DBBadgeDef, 'id' | 'name' | 'description' | 'emoji'>;

export type UserBadge = Pick<DBUserBadge, 'badge_id'> & {
  earned_at: string; // Keep as string for compatibility if needed, though DB is string | null
};
