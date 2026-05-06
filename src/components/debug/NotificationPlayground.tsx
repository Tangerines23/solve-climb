import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebugActions } from '../../hooks/useDebugActions';
import {
  PauseModal,
  LastChanceModal,
  GameTipModal,
  GameAlertModal,
  ItemFeedbackOverlay,
  CountdownOverlay,
  SafetyRopeOverlay,
  GameOverlay,
  BackpackBottomSheet,
  KeyboardInfoModal,
  useGameActions,
  ChallengeCard,
  UnknownMountainCard,
} from '@/features/quiz';
import {
  CyclePromotionModal,
  ModeSelectModal,
  MyRecordCard,
  StatusCard,
  TierUpgradeModal,
  LevelListCard,
} from '@/features/quiz';
import { AlertModal } from '../AlertModal';
import { ConfirmModal } from '../ConfirmModal';
import { DataResetConfirmModal } from '../DataResetConfirmModal';
import { CustomPresetModal } from './CustomPresetModal';
import { Toast } from '../Toast';
import { ItemFeedbackRef } from '@/features/quiz/types/feedback';
import { BadgeNotification } from '../BadgeNotification';
import { UnderDevelopmentModal } from '../UnderDevelopmentModal';
import './NotificationPlayground.css';

export function NotificationPlayground() {
  const navigate = useNavigate();
  const { urls } = useDebugActions();
  const { setExhausted, setCombo, resetCombo, isExhausted, feverLevel } = useGameActions();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const itemFeedbackRef = useRef<ItemFeedbackRef>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);

  const handleAlertAction = (action: 'login' | 'charge' | 'play') => {
    triggerToast(`Action: ${action}`);
    closeModals();
  };

  const toggleVignette = () => {
    setExhausted(!isExhausted);
  };

  const toggleSpeedLines = (level: 1 | 2) => {
    // If already showing speed lines at this level (or higher for level 1 check), toggle off
    // Logic:
    // Lvl 1 button: if feverLevel >= 1, turn off. Else turn on lvl 1 (combo 5)
    // Lvl 2 button: if feverLevel == 2, turn off. Else turn on lvl 2 (combo 20)

    if (level === 1) {
      if (feverLevel >= 1) resetCombo();
      else setCombo(5);
    } else {
      if (feverLevel === 2) resetCombo();
      else setCombo(20);
    }
  };

  const closeModals = () => {
    setActiveModal(null);
    setBadgeIds([]);
    setShowCountdown(false);
    setShowSafetyRope(false);
    // Reset GameOverlay effects
    setExhausted(false);
    resetCombo();
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const triggerItemFeedback = (text: string, sub: string, type: 'success' | 'info' = 'success') => {
    itemFeedbackRef.current?.show(text, sub, type);
  };

  return (
    <div className="notification-playground">
      <h3 className="playground-title">🎨 UI Notification Playground (v2)</h3>
      <p className="playground-desc">All Components from Guide 1-4</p>

      <div className="playground-grid">
        {/* Group 1: Common & System */}
        <div className="playground-section">
          <h4>1. Common & System</h4>
          <button onClick={() => triggerToast('Standard Toast')}>Toast Message</button>
          <button onClick={() => setActiveModal('alert')}>Alert Modal</button>
          <button onClick={() => setActiveModal('confirm')}>Confirm Modal</button>
          <button onClick={() => setActiveModal('dataReset')}>Data Reset</button>
          <button onClick={() => setActiveModal('keyboard')}>Keyboard Info</button>
          <button onClick={() => setActiveModal('underDev')}>Under Dev</button>
          <button onClick={() => setActiveModal('preset')}>Custom Preset</button>
        </div>

        {/* Group 2: Lobby & Preparation */}
        <div className="playground-section">
          <h4>2. Lobby & Prep</h4>
          <button onClick={() => setActiveModal('cards_preview')}>Show Dashboard Cards</button>
          <button onClick={() => setActiveModal('levelList')}>Level List Card</button>
          <button onClick={() => setActiveModal('modeSelect')}>Mode Select Modal</button>
          <button onClick={() => setActiveModal('gameTip')}>Game Tip Modal</button>
        </div>

        {/* Group 3: In-Game Actions & FX */}
        <div className="playground-section">
          <h4>3. In-Game & FX</h4>
          <button onClick={() => setActiveModal('pause')}>Pause Menu</button>
          <button onClick={() => setActiveModal('backpack')}>Backpack</button>
          <button onClick={() => setShowCountdown(true)}>Countdown</button>
          <button onClick={() => setShowSafetyRope(true)}>Safety Rope</button>
          <button onClick={() => triggerItemFeedback('Item Used', '+10s')}>Item Feedback</button>
          <button onClick={toggleVignette}>FX: Vignette {isExhausted ? '(ON)' : '(OFF)'}</button>
          <button onClick={() => toggleSpeedLines(2)}>
            FX: Speed Lines {feverLevel === 2 ? '(ON)' : '(OFF)'}
          </button>
        </div>

        {/* Group 4: Events & Progression */}
        <div className="playground-section">
          <h4>4. Events & Progression</h4>
          <button onClick={() => setActiveModal('stamina')}>Stamina Warning</button>
          <button onClick={() => setActiveModal('lastChance')}>Last Chance</button>
          <button onClick={() => setActiveModal('tierUpgrade')}>Tier Upgrade</button>
          <button onClick={() => setActiveModal('cycle')}>Cycle Promotion</button>
          <button onClick={() => setBadgeIds(['first_login'])}>Badge Notification</button>
        </div>

        {/* Group 5: Monetization & Ads */}
        <div className="playground-section">
          <h4>5. Monetization & Ads</h4>
          <button onClick={() => setActiveModal('lastChance')}>Ad Revive (Modal)</button>
          <button onClick={() => navigate(urls.shop())}>Go to Shop (Recharge)</button>
          <button
            onClick={() =>
              navigate(
                urls.result(
                  new URLSearchParams({
                    score: '1250',
                    mode: 'survival',
                    world: 'earth',
                    category: 'math',
                  })
                )
              )
            }
          >
            Go to Result (Double Reward)
          </button>
          <button onClick={() => triggerToast('Mineral +500 (Simulated)')}>
            Simulate Ad Success
          </button>
        </div>
      </div>

      {/* --- 1. Modals --- */}
      <AlertModal
        isOpen={activeModal === 'alert'}
        title="Alert"
        message="Test Alert"
        onClose={closeModals}
      />
      <ConfirmModal
        isOpen={activeModal === 'confirm'}
        title="Confirm"
        message="Are you sure?"
        onConfirm={closeModals}
        onCancel={closeModals}
      />

      <PauseModal
        isVisible={activeModal === 'pause'}
        remainingPauses={2}
        onResume={closeModals}
        onExit={closeModals}
      />

      <LastChanceModal
        isVisible={activeModal === 'lastChance'}
        gameMode="time-attack"
        inventoryCount={1}
        userMinerals={100}
        basePrice={50}
        onUseItem={() => triggerToast('Item Used')}
        onPurchaseAndUse={() => triggerToast('Purchased')}
        onWatchAd={() => triggerToast('Ad Watched - Reviving...')}
        onGiveUp={closeModals}
      />

      <ModeSelectModal
        isOpen={activeModal === 'modeSelect'}
        level={5}
        levelName="Multiplication"
        onClose={closeModals}
        onSelectMode={(mode: string) => triggerToast(`Selected: ${mode}`)}
      />

      <GameTipModal
        isOpen={activeModal === 'gameTip'}
        category="math"
        subTopic="arithmetic"
        level={1}
        onClose={closeModals}
        onStart={() => {
          triggerToast('Start Game');
          closeModals();
        }}
      />

      <GameAlertModal
        isOpen={activeModal === 'stamina'}
        onClose={closeModals}
        onAction={handleAlertAction}
        type="stamina"
      />

      <TierUpgradeModal
        isOpen={activeModal === 'tierUpgrade'}
        previousScore={900}
        currentScore={1500}
        onClose={closeModals}
      />

      <KeyboardInfoModal isOpen={activeModal === 'keyboard'} onClose={closeModals} />

      <CyclePromotionModal
        isOpen={activeModal === 'cycle'}
        stars={5}
        pendingScore={5000}
        onPromote={closeModals}
        onClose={closeModals}
      />

      <DataResetConfirmModal
        isOpen={activeModal === 'dataReset'}
        onConfirm={closeModals}
        onCancel={closeModals}
      />

      <CustomPresetModal
        isOpen={activeModal === 'preset'}
        editingPreset={null}
        onSave={() => closeModals()}
        onClose={closeModals}
      />

      <UnderDevelopmentModal isOpen={activeModal === 'underDev'} onClose={closeModals} />

      <BackpackBottomSheet
        isOpen={activeModal === 'backpack'}
        onClose={closeModals}
        selectedItemIds={[]}
        onToggleItem={(id) => triggerToast(`Toggle Item ${id}`)}
      />

      {/* --- 2. Notifications --- */}
      <BadgeNotification badgeIds={badgeIds} onClose={() => setBadgeIds([])} />

      <ItemFeedbackOverlay ref={itemFeedbackRef} />

      <Toast message={toastMessage} isOpen={showToast} onClose={() => setShowToast(false)} />

      {/* --- 3. Overlays --- */}
      <CountdownOverlay isVisible={showCountdown} onComplete={() => setShowCountdown(false)} />

      <SafetyRopeOverlay
        isVisible={showSafetyRope}
        onAnimationComplete={() => setShowSafetyRope(false)}
      />

      {/* GameOverlay is global, so we rely on store state triggered by buttons */}
      <GameOverlay />

      {/* --- 4. Cards Preview --- */}
      {activeModal === 'cards_preview' && (
        <div className="playground-overlay" onClick={closeModals}>
          <div className="playground-card-scroll-container" onClick={(e) => e.stopPropagation()}>
            <div className="card-preview-row">
              <h5>Challenge Card</h5>
              <div className="debug-card-wrapper">
                <ChallengeCard />
              </div>
            </div>
            <div className="card-preview-row">
              <h5>My Record Card</h5>
              <div className="debug-card-wrapper">
                <MyRecordCard world="World1" category="기초" categoryName="사칙연산" />
              </div>
            </div>
            <div className="card-preview-row">
              <h5>Unknown Mountain Card</h5>
              <div className="debug-card-wrapper">
                <UnknownMountainCard onToast={triggerToast} />
              </div>
            </div>
            <div className="card-preview-row">
              <h5>Status Card</h5>
              <div className="debug-card-wrapper">
                <StatusCard />
              </div>
            </div>
            <button className="playground-close-btn" onClick={closeModals}>
              닫기
            </button>
          </div>
        </div>
      )}

      {activeModal === 'levelList' && (
        <div className="playground-overlay" onClick={closeModals}>
          <div className="playground-card-container" onClick={(e) => e.stopPropagation()}>
            <LevelListCard
              world="World1"
              category="기초"
              levels={[
                { level: 1, name: 'Level 1', description: 'Test' },
                { level: 2, name: 'Level 2', description: 'Test' },
              ]}
              onLevelClick={(lvl: number) => triggerToast(`Level ${lvl}`)}
              onLevelLongPress={(lvl: number) => triggerToast(`Long Press ${lvl}`)}
            />
            <button className="playground-close-btn" onClick={closeModals}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
