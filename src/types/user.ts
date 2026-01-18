export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  description: string;
  quantity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  minerals: number;
  stamina: number;
  last_stamina_update?: string;
}
