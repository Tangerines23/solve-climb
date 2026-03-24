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

export interface UserState {
  minerals: number;
  stamina: number;
  inventory: InventoryItem[];
  isLoading: boolean;
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

  // DEV ONLY
  debugAddItems: () => Promise<void>;
  debugResetItems: () => Promise<void>;
  debugRemoveItems: () => Promise<void>;
  debugSetStamina: (amount: number) => Promise<void>;
  debugSetMinerals: (amount: number) => Promise<void>;

  lastStaminaConsumeTime: number;
}
