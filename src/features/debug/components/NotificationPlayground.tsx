import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from '@/utils/navigation';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { sound } from '@/utils/sound';
import { AlertModal } from '@/components/AlertModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CyclePromotionModal } from '@/components/CyclePromotionModal';
import { DataResetConfirmModal } from './DataResetConfirmModal';
import { CustomPresetModal } from './CustomPresetModal';
import { Toast } from '@/components/Toast';
import { LevelListCard } from '@/components/LevelListCard';
import { PauseModal } from '@/components/game/PauseModal';
import { LastChanceModal } from '@/components/LastChanceModal';
import { ModeSelectModal } from '@/components/ModeSelectModal';
import { GameTipModal } from '@/components/GameTipModal';
import { GameAlertModal } from '@/components/game/GameAlertModal';
import { ItemFeedbackOverlay, ItemFeedbackRef } from '@/components/game/ItemFeedbackOverlay';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { SafetyRopeOverlay } from '@/components/game/SafetyRopeOverlay';
import { GameOverlay } from '@/components/game/GameOverlay';
import { ChallengeCard } from '@/components/ChallengeCard';
import { MyRecordCard } from '@/components/MyRecordCard';
import { UnknownMountainCard } from '@/components/UnknownMountainCard';
import { StatusCard } from '@/components/StatusCard';
import { TierUpgradeModal } from '@/components/TierUpgradeModal';
import { KeyboardInfoModal } from '@/components/KeyboardInfoModal';
import { BackpackBottomSheet } from '@/components/game/BackpackBottomSheet';
import { BadgeNotification } from '@/components/BadgeNotification';
import { UnderDevelopmentModal } from '@/components/UnderDevelopmentModal';
import './NotificationPlayground.css';

export function NotificationPlayground() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const itemFeedbackRef = useRef<ItemFeedbackRef>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSafetyRope, setShowSafetyRope] = useState(false);

  const { soundEnabled, setSoundEnabled } = useSettingsStore();

  // Store access for GameOverlay effects
  const {
    setExhausted,
    setCombo,
    resetCombo,
    isExhausted,
    feverLevel,
    speedLineStyle,
    setSpeedLineStyle,
  } = useGameStore();

  const handleAlertAction = (action: 'login' | 'charge' | 'play' | 'shop') => {
    triggerToast(`Action: ${action}`);
    closeModals();
  };

  const toggleVignette = () => {
    setExhausted(!isExhausted);
  };

  const toggleSpeedLines = (level: 1 | 2) => {
    if (level === 1) {
      if (feverLevel === 1) {
        setCombo(0);
      } else {
        setCombo(5);
        setActiveModal('keyboard');
      }
    } else {
      if (feverLevel === 2) {
        setCombo(0);
      } else {
        setCombo(25);
        setActiveModal('keyboard');
      }
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
          <button onClick={() => toggleSpeedLines(1)}>
            FX: Speed Lvl 1 {feverLevel === 1 ? '(ON)' : '(OFF)'}
          </button>
          <button onClick={() => toggleSpeedLines(2)}>
            FX: Speed Lvl 2 {feverLevel === 2 ? '(ON)' : '(OFF)'}
          </button>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              gridColumn: 'span 2',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            <span
              style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'bold' }}
            >
              Level 1 Style (Press Left/Right Arrow to cycle):
            </span>
            <select
              value={speedLineStyle}
              onChange={(e) => setSpeedLineStyle(e.target.value as any)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--color-pure-white)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--rounded-sm)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="original" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                1. Original Speedline
              </option>
              <option value="fog" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                2. Focus Edge Fog
              </option>
              <option value="glow" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                3. Subtle Edge Glow
              </option>
              <option value="float" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                4. Card Float & Depth
              </option>
              <option value="liquid" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                5. Liquid Border Gauge
              </option>
              <option value="sweep" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                6. Light Sweep Scan
              </option>
              <option value="zen" style={{ backgroundColor: 'var(--color-grey-800)' }}>
                7. Zen Focus Blur
              </option>
            </select>
          </div>
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

        {/* Group 6: Sound Effects (SFX) */}
        <div className="playground-section">
          <h4>6. Sound Effects (SFX) 🔊</h4>
          <button
            style={{
              backgroundColor: soundEnabled ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 61, 0, 0.2)',
              borderColor: soundEnabled ? 'var(--color-success)' : 'var(--color-error)',
              fontWeight: 'bold',
            }}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) sound.playTap();
              triggerToast(`효과음 설정: ${next ? 'ON' : 'OFF'}`);
            }}
          >
            🔊 효과음 마스터 {soundEnabled ? '(ON)' : '(OFF)'}
          </button>
          <button onClick={() => sound.playKeypad(false)}>⌨️ Keypad: Tap</button>
          <button onClick={() => sound.playKeypad(true)}>⌫ Keypad: Backspace</button>
          <button onClick={() => sound.playTap()}>👆 UI: Tap</button>
          <button onClick={() => sound.playBack()}>🔙 뒤로가기: Back Tap</button>
          <button onClick={() => sound.playEmptyTap()}>💨 빈 공간: Chalk Tap</button>
          <button onClick={() => sound.playCorrect()}>✅ 정답: 3-Chime (C-E-G)</button>
          <button onClick={() => sound.playCombo(3)}>🔥 콤보: 3 Combo</button>
          <button onClick={() => sound.playCombo(7)}>🔥 콤보: 7 Combo</button>
          <button onClick={() => sound.playCombo(10)}>🔥 콤보: 10 Combo (High)</button>
          <button onClick={() => sound.playWrong()}>❌ 오답: Buzzer</button>
          <button onClick={() => sound.playCountdown(3)}>⏳ 카운트다운: 3, 2, 1</button>
          <button onClick={() => sound.playCountdown(0)}>🚀 카운트다운: GO! (Chord)</button>
          <button onClick={() => sound.playFever()}>⚡ 피버 / 모멘텀 (Shimmer)</button>
          <button onClick={() => sound.playStageClear()}>🏆 스테이지 클리어 (Fanfare)</button>
          <button onClick={() => sound.playGameOver()}>💀 게임 오버 (Jingle)</button>
          <button onClick={() => sound.playScoreCount()}>🪙 점수 롤링 (Count-up)</button>
          <button onClick={() => sound.playRevive()}>💖 부활 (Revive Charge)</button>
          <button onClick={() => sound.playStaminaWarning()}>💓 스태미나 위기 (Heartbeat)</button>
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
        onSelectMode={(mode) => triggerToast(`Selected: ${mode}`)}
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
