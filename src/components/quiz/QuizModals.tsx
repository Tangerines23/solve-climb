import { ItemFeedbackOverlay, ItemFeedbackRef } from '../game/ItemFeedbackOverlay';
import { LastChanceModal } from '../LastChanceModal';
import { CountdownOverlay } from '../CountdownOverlay';
import { SafetyRopeOverlay } from '../game/SafetyRopeOverlay';
import { GameTipModal } from '../GameTipModal';
import { GameOverlay } from '../game/GameOverlay';
import { StaminaWarningModal } from '../game/StaminaWarningModal';
import { RefObject } from 'react';
import { InventoryItem } from '../../types/user';

interface QuizModalsProps {
    feedbackRef: RefObject<ItemFeedbackRef | null>;
    showLastChanceModal: boolean;
    gameMode: 'survival' | 'time-attack';
    inventory: InventoryItem[];
    minerals: number;
    handleRevive: (useItem: boolean) => void;
    handlePurchaseAndRevive: () => void;
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
    handlePlayAnyway: () => void;
    handleWatchAd: () => void;
}

export function QuizModals({
    feedbackRef,
    showLastChanceModal,
    gameMode,
    inventory,
    minerals,
    handleRevive,
    handlePurchaseAndRevive,
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
    showStaminaModal,
    setShowStaminaModal,
    handlePlayAnyway,
    handleWatchAd,
}: QuizModalsProps) {
    return (
        <>
            <ItemFeedbackOverlay ref={feedbackRef} />

            <LastChanceModal
                isVisible={showLastChanceModal}
                gameMode={gameMode}
                inventoryCount={
                    inventory.find((i) => i.code === (gameMode === 'time-attack' ? 'last_spurt' : 'flare'))
                        ?.quantity || 0
                }
                userMinerals={minerals}
                onUseItem={() => handleRevive(true)}
                onPurchaseAndUse={handlePurchaseAndRevive}
                onGiveUp={handleGiveUp}
                basePrice={gameMode === 'time-attack' ? 800 : 800}
            />

            {showCountdown && (
                <CountdownOverlay isVisible={showCountdown} onComplete={handleCountdownComplete} />
            )}

            {showSafetyRope && (
                <SafetyRopeOverlay isVisible={true} onAnimationComplete={() => setShowSafetyRope(false)} />
            )}

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
            <StaminaWarningModal
                isOpen={showStaminaModal}
                onClose={() => setShowStaminaModal(false)}
                onPlayAnyway={handlePlayAnyway}
                onWatchAd={handleWatchAd}
            />
        </>
    );
}
