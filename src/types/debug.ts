export interface DebugAction {
  type:
    | 'reset'
    | 'setTier'
    | 'setMasteryScore'
    | 'setMinerals'
    | 'setStamina'
    | 'grantAllItems'
    | 'grantAllBadges'
    | 'setGameTime';
  target?: string; // reset 타입에서 사용 ('all' | 'score' | 'minerals' | 'tier')
  level?: number; // setTier에서 사용
  value?: number; // setMinerals, setStamina, setMasteryScore에서 사용
  quantity?: number; // grantAllItems에서 사용
  seconds?: number; // setGameTime에서 사용
}

export interface DebugPreset {
  id: string;
  name: string;
  description: string;
  actions: DebugAction[];
}

export interface PresetHistory {
  id: string;
  presetId: string;
  presetName: string;
  appliedAt: Date;
  userId: string;
  success: boolean;
  error?: string;
}

export interface CustomPreset extends DebugPreset {
  isCustom: true;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: string;
}
