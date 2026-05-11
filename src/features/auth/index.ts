// src/features/auth/index.ts

// Pages
export { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';

// Components
export { RequireAuth } from './components/RequireAuth';
export { ProfileForm } from './components/ProfileForm';
export { WithdrawConfirmModal } from './components/WithdrawConfirmModal';
export { DataResetConfirmModal } from './components/DataResetConfirmModal';

// Hooks
export { useSession } from './hooks/useSession';
export type { UseSessionResult } from './hooks/useSession';
export { useProfile } from './hooks/useProfile';
export { useUserWithdraw } from './hooks/useUserWithdraw';
export { useRequireAuthBridge } from './hooks/useRequireAuthBridge';
export { useDataReset } from './hooks/useDataReset';

// Stores
export { useAuthStore } from './stores/useAuthStore';
export type { AuthState } from './stores/useAuthStore';
export { useUserStore } from './stores/useUserStore';
export { useProfileStore } from './stores/useProfileStore';
export type { ProfileState, UserProfile as MultiUserProfile } from './stores/useProfileStore';

// Utils
export { signInWithGoogle } from './utils/auth';
export { handleTossLoginFlow, getTossUserInfo, createOrUpdateSupabaseUser } from './utils/tossAuth';
export { handleTossLogin, isTossAppEnvironment } from './utils/tossLogin';
export {
  getGameLoginHash,
  checkTossLoginIntegration,
  getMigrationStatus,
  createMigrationLink,
  migrateToGameLogin,
} from './utils/tossGameLogin';
export { performUserWithdraw } from './utils/userWithdraw';
export { performDataReset } from './utils/dataReset';

// Domain (Value Objects)
export { Tier } from './domain/Tier';
export { Email } from './domain/Email';

// Types
export * from './types/user';
