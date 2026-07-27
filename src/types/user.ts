import { Database } from './database.types';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbItem = Database['public']['Tables']['items']['Row'];

export type InventoryItem = Pick<DbItem, 'code' | 'name'> & {
  id: number;
  description: string;
  quantity: number;
};

export type UserProfile = Omit<DbProfile, 'nickname' | 'avatar_url'> & {
  email: string;
  nickname?: string;
  avatar_url?: string;
  last_stamina_update?: string;
};

export interface UserState {
  minerals: number;
  stamina: number;
  inventory: InventoryItem[];
  isLoading: boolean;
  isAdLoading?: boolean;
  isAnonymous: boolean;
  lastAdRechargeTime: string | null;

  handleWatchAd: () => void;
  // Pause System
  showPauseModal: boolean;
  remainingPauses: number;
  handlePauseClick: () => void;
  handlePauseResume: () => void;
  handlePauseExit: () => void;

  fetchUserData: () => Promise<void>;
  purchaseItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  checkStamina: () => Promise<void>;
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  consumeStamina: () => Promise<{ success: boolean; message: string }>;
  setMinerals: (minerals: number) => Promise<void>;
  setStamina: (stamina: number) => void;
  recoverStaminaAds: () => Promise<{ success: boolean; message: string }>;
  recoverMineralsAds: () => Promise<{ success: boolean; message: string }>;
  rewardMinerals: (
    amount: number,
    isBonus?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  refundStamina: () => Promise<{ success: boolean; message: string }>;
  updateNickname: (nickname: string) => Promise<{ success: boolean; message: string }>;

  // DEV ONLY
  debugAddItems: () => Promise<void>;
  debugResetItems: () => Promise<void>;
  debugRemoveItems: () => Promise<void>;
  debugSetStamina: (amount: number) => Promise<void>;
  debugSetMinerals: (amount: number) => Promise<void>;

  lastStaminaConsumeTime: number;
}
