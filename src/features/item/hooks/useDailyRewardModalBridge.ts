import { useDailyRewardStore } from '../stores/useDailyRewardStore';

export const useDailyRewardModalBridge = () => {
  const { showModal, rewardResult, closeModal } = useDailyRewardStore();

  return {
    showModal,
    rewardResult,
    closeModal,
  };
};
