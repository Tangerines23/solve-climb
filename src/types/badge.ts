export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}
