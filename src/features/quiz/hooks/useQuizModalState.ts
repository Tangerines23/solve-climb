import { useState, useCallback } from 'react';

export interface QuizModalState {
  showPauseModal: boolean;
  showStaminaModal: boolean;
  showCountdown: boolean;
  showLastChanceModal: boolean;
  showTipModal: boolean;
  showRankPromoteModal: boolean;
  showLevelUpModal: boolean;
  showStaminaWarningModal: boolean;
  showUnderDevModal: boolean;
  underDevFeatureName: string;

  setShowPauseModal: (v: boolean) => void;
  setShowStaminaModal: (v: boolean) => void;
  setShowCountdown: (v: boolean) => void;
  setShowLastChanceModal: (v: boolean) => void;
  setShowTipModal: (v: boolean) => void;
  setShowRankPromoteModal: (v: boolean) => void;
  setShowLevelUpModal: (v: boolean) => void;
  setShowStaminaWarningModal: (v: boolean) => void;
  setShowUnderDevModal: (v: boolean) => void;
  setUnderDevFeatureName: (v: string) => void;
  closeAllModals: () => void;
}

export function useQuizModalState(): QuizModalState {
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRankPromoteModal, setShowRankPromoteModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showStaminaWarningModal, setShowStaminaWarningModal] = useState(false);
  const [showUnderDevModal, setShowUnderDevModal] = useState(false);
  const [underDevFeatureName, setUnderDevFeatureName] = useState('');

  const closeAllModals = useCallback(() => {
    setShowPauseModal(false);
    setShowStaminaModal(false);
    setShowCountdown(false);
    setShowLastChanceModal(false);
    setShowTipModal(false);
    setShowRankPromoteModal(false);
    setShowLevelUpModal(false);
    setShowStaminaWarningModal(false);
    setShowUnderDevModal(false);
  }, []);

  return {
    showPauseModal,
    showStaminaModal,
    showCountdown,
    showLastChanceModal,
    showTipModal,
    showRankPromoteModal,
    showLevelUpModal,
    showStaminaWarningModal,
    showUnderDevModal,
    underDevFeatureName,

    setShowPauseModal,
    setShowStaminaModal,
    setShowCountdown,
    setShowLastChanceModal,
    setShowTipModal,
    setShowRankPromoteModal,
    setShowLevelUpModal,
    setShowStaminaWarningModal,
    setShowUnderDevModal,
    setUnderDevFeatureName,
    closeAllModals,
  };
}
