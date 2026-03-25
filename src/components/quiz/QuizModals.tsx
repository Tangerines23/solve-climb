import { ItemFeedbackOverlay, ItemFeedbackRef } from '../game/ItemFeedbackOverlay';
import { LastChanceModal } from '../LastChanceModal';
import { CountdownOverlay } from '../CountdownOverlay';
import { SafetyRopeOverlay } from '../game/SafetyRopeOverlay';
import { GameTipModal } from '../GameTipModal';
import { GameOverlay } from '../game/GameOverlay';
import { GameAlertModal } from '../game/GameAlertModal';
import { RefObject } from 'react';
import { InventoryItem } from '../../types/user';
import { PauseModal } from '../game/PauseModal';
import { GameMode } from '../../types/quiz';

import { ITEM_MAP } from '../../constants/items';

interface QuizModalsProps {
  feedbackRef: RefObject<ItemFeedbackRef>;
  showLastChanceModal: boolean;
  gameMode: GameMode;
  inventory: InventoryItem[];
  minerals: number;
  handleRevive: (useItem: boolean) => void;
  handlePurchaseAndRevive: () => void;
  handleWatchAdAndRevive: () => void;
  handleGiveUp: () => void;
  showCountdown: boolean;
  handleCountdownComplete: () => void;
  showSafetyRope: boolean;
  setShowSafetyRope: (show: boolean) => void;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;
  showTipModal: boolean;
  handleBack: () => void;
  handleStartGame: (selectedItemIds: number[]) => void;
  showStaminaModal: boolean;
  setShowStaminaModal: (show: boolean) => void;
  // Pause System
  showPauseModal: boolean;
  remainingPauses: number;
  handlePauseClick: () => void;
  handlePauseResume: () => void;
  handlePauseExit: () => void;
  // Alert Modal
  isAnonymous: boolean;
  onAlertAction: (action: 'login' | 'charge' | 'play') => void;
}

export function QuizModals({
  feedbackRef,
  showLastChanceModal,
  gameMode,
  inventory,
  minerals,
  handleRevive,
  handlePurchaseAndRevive,
  handleWatchAdAndRevive,
  handleGiveUp,
  showCountdown,
  handleCountdownComplete,
  showSafetyRope,
  setShowSafetyRope,
  categoryParam,
  subParam,
  levelParam,
  showTipModal,
  handleBack,
  handleStartGame,
  showPauseModal,
  remainingPauses,
  handlePauseResume,
  handlePauseExit,
  showStaminaModal,
  setShowStaminaModal,
  isAnonymous,
  onAlertAction,
}: QuizModalsProps) {
  const reviveItemCode = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
  const basePrice = ITEM_MAP[reviveItemCode]?.price || 800;

  return (
    <>
      <ItemFeedbackOverlay ref={feedbackRef} />

      <LastChanceModal
        isVisible={showLastChanceModal && (gameMode === 'time-attack' || gameMode === 'survival')}
        gameMode={gameMode as 'time-attack' | 'survival'}
        inventoryCount={inventory.find((i) => i.code === reviveItemCode)?.quantity || 0}
        userMinerals={minerals}
        onUseItem={() => handleRevive(true)}
        onPurchaseAndUse={handlePurchaseAndRevive}
        onWatchAd={handleWatchAdAndRevive}
        onGiveUp={handleGiveUp}
        basePrice={basePrice}
      />

      {showCountdown && (
        <CountdownOverlay isVisible={showCountdown} onComplete={handleCountdownComplete} />
      )}

      {showSafetyRope && (
        <SafetyRopeOverlay isVisible={true} onAnimationComplete={() => setShowSafetyRope(false)} />
      )}

      <PauseModal
        isVisible={showPauseModal}
        remainingPauses={remainingPauses}
        onResume={handlePauseResume}
        onExit={handlePauseExit}
      />

      {categoryParam && subParam && (
        <GameTipModal
          isOpen={showTipModal}
          category={categoryParam}
          subTopic={subParam}
          level={levelParam}
          onClose={handleBack}
          onStart={handleStartGame}
        />
      )}
      <GameOverlay />
      <GameAlertModal
        isOpen={showStaminaModal}
        onClose={() => setShowStaminaModal(false)}
        onAction={onAlertAction}
        type={
          isAnonymous && (inventory.find((i) => i.code === 'oxygen_tank')?.quantity || 0) <= 0
            ? 'both'
            : isAnonymous
              ? 'anonymous'
              : 'stamina'
        }
      />
    </>
  );
}
