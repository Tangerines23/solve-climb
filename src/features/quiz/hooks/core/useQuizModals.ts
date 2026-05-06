import { useState, useCallback } from 'react';

export function useQuizModals() {
  const [showLastChanceModal, setShowLastChanceModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPromise, setShowPromise] = useState(false);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(true);
  const [isFlarePaused, setIsFlarePaused] = useState(false);

  const openPauseModal = useCallback(() => setShowPauseModal(true), []);
  const closePauseModal = useCallback(() => setShowPauseModal(false), []);

  const openTutorial = useCallback(() => setShowTutorial(true), []);
  const closeTutorial = useCallback(() => setShowTutorial(false), []);

  const openStaminaModal = useCallback(() => setShowStaminaModal(true), []);
  const closeStaminaModal = useCallback(() => setShowStaminaModal(false), []);

  return {
    modals: {
      showLastChanceModal,
      showCountdown,
      showSafetyRope,
      showPauseModal,
      showTutorial,
      showPromise,
      showStaminaModal,
      showTipModal,
      isFlarePaused,
    },
    modalHandlers: {
      setShowLastChanceModal,
      setShowCountdown,
      setShowSafetyRope,
      setShowPauseModal,
      setShowTutorial,
      setShowPromise,
      setShowStaminaModal,
      setShowTipModal,
      setIsFlarePaused,
      openPauseModal,
      closePauseModal,
      openTutorial,
      closeTutorial,
      openStaminaModal,
      closeStaminaModal,
    },
  };
}
