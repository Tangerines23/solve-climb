import { ItemFeedbackOverlay } from './game/ItemFeedbackOverlay';
import { LastChanceModal } from './game/LastChanceModal';
import { CountdownOverlay } from './overlays/CountdownOverlay';
import { SafetyRopeOverlay } from './game/SafetyRopeOverlay';
import { GameTipModal } from './game/GameTipModal';
import { GameOverlay } from './game/GameOverlay';
import { GameAlertModal } from './game/GameAlertModal';
import { PauseModal } from './game/PauseModal';
import { ITEM_MAP, ItemMetadata } from '@/constants/items';
import { useQuiz } from '../contexts/QuizContext';
import { useValidation } from '@/hooks/useValidation';
import { InventoryItem } from '@/types/user';

export function QuizModals() {
  const { quizState, modalState, modalHandlers, feedbackRef, inventory, minerals, isAnonymous } =
    useQuiz();
  const { safeAccess } = useValidation();

  const {
    showLastChanceModal,
    showCountdown,
    showSafetyRope,
    showTipModal,
    showPauseModal,
    showStaminaModal,
  } = modalState;

  const {
    handleRevive,
    handlePurchaseAndRevive,
    handleWatchAdAndRevive,
    handleGiveUp,
    handleCountdownComplete,
    setShowSafetyRope,
    handleBack,
    handleStartGame,
    handlePauseResume,
    handlePauseExit,
    setShowStaminaModal,
    onAlertAction,
  } = modalHandlers;

  const { gameMode, categoryParam, subParam, levelParam } = quizState;

  const reviveItemCode = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
  const itemMeta = safeAccess(ITEM_MAP, reviveItemCode) as ItemMetadata | undefined;
  const basePrice = itemMeta?.price || 800;

  return (
    <>
      <ItemFeedbackOverlay ref={feedbackRef} />

      <LastChanceModal
        isVisible={showLastChanceModal && (gameMode === 'time-attack' || gameMode === 'survival')}
        gameMode={gameMode as 'time-attack' | 'survival'}
        inventoryCount={inventory.find((i: InventoryItem) => i.code === reviveItemCode)?.quantity || 0}
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
        remainingPauses={3}
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
          isAnonymous && (inventory.find((i: InventoryItem) => i.code === 'oxygen_tank')?.quantity || 0) <= 0
            ? 'both'
            : isAnonymous
              ? 'anonymous'
              : 'stamina'
        }
      />
    </>
  );
}
