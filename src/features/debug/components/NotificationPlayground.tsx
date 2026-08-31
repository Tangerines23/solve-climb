import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urls } from '@/utils/navigation';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  sound,
  bgm,
  type BgmTheme,
  type BgmVersion,
  BGM_ARRANGEMENTS_V1,
  BGM_ARRANGEMENTS_V2,
  isInstrumentPlaying,
} from '@/utils/sound';
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
  const [activeBgm, setActiveBgm] = useState<BgmTheme | null>(null);
  const [bgmVersion, setBgmVersion] = useState<BgmVersion>(bgm.getVersion());
  const [currentStep, setCurrentStep] = useState<number>(0);

  const { soundEnabled, setSoundEnabled, bgmEnabled, setBgmEnabled } = useSettingsStore();

  // BGM 재생 중일 때 실시간 스텝 트래킹
  useEffect(() => {
    if (!activeBgm) return;
    const timer = setInterval(() => {
      setCurrentStep(bgm.getCurrentStep());
    }, 60);
    return () => clearInterval(timer);
  }, [activeBgm]);

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
              onChange={(e) =>
                setSpeedLineStyle(e.target.value as Parameters<typeof setSpeedLineStyle>[0])
              }
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
              triggerToast(`효과음 설정: ${next ? 'ON (켜짐)' : 'OFF (음소거)'}`);
            }}
          >
            🔊 효과음 마스터 {soundEnabled ? '(ON - 활성화)' : '(OFF - 음소거됨 ⚠️)'}
          </button>
          {!soundEnabled && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 61, 0, 0.15)',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              ⚠️ 현재 효과음이 OFF 상태입니다. 아래 버튼 클릭 시 자동 ON으로 켜집니다.
            </div>
          )}
          {[
            { label: '⌨️ Keypad: Tap', fn: () => sound.playKeypad(false) },
            { label: '⌫ Keypad: Backspace', fn: () => sound.playKeypad(true) },
            { label: '👆 UI: Tap', fn: () => sound.playTap() },
            { label: '🔙 뒤로가기: Back Tap', fn: () => sound.playBack() },
            { label: '💨 빈 공간: Chalk Tap', fn: () => sound.playEmptyTap() },
            { label: '✅ 정답: 3-Chime (C-E-G)', fn: () => sound.playCorrect() },
            { label: '🔥 콤보: 3 Combo', fn: () => sound.playCombo(3) },
            { label: '🔥 콤보: 7 Combo', fn: () => sound.playCombo(7) },
            { label: '🔥 콤보: 10 Combo (High)', fn: () => sound.playCombo(10) },
            { label: '❌ 오답: Buzzer', fn: () => sound.playWrong() },
            { label: '⏳ 카운트다운: 3, 2, 1', fn: () => sound.playCountdown(3) },
            { label: '🚀 카운트다운: GO! (Chord)', fn: () => sound.playCountdown(0) },
            { label: '⚡ 피버 / 모멘텀 (Shimmer)', fn: () => sound.playFever() },
            { label: '🏆 스테이지 클리어 (Fanfare)', fn: () => sound.playStageClear() },
            { label: '💀 게임 오버 (Jingle)', fn: () => sound.playGameOver() },
            { label: '🪙 점수 롤링 (Count-up)', fn: () => sound.playScoreCount() },
            { label: '💖 부활 (Revive Charge)', fn: () => sound.playRevive() },
            { label: '💓 스태미나 위기 (Heartbeat)', fn: () => sound.playStaminaWarning() },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!soundEnabled) {
                  setSoundEnabled(true);
                  triggerToast('🔊 효과음이 자동으로 ON으로 켜졌습니다');
                }
                item.fn();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Group 7: Procedural BGM (0Byte 배경음악) */}
        <div className="playground-section">
          <h4>7. Procedural BGM (0Byte) 🎵</h4>

          {/* BGM 마스터 온/오프 버튼 */}
          <button
            style={{
              backgroundColor: bgmEnabled ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 61, 0, 0.2)',
              borderColor: bgmEnabled ? 'var(--color-success)' : 'var(--color-error)',
              fontWeight: 'bold',
            }}
            onClick={() => {
              const next = !bgmEnabled;
              setBgmEnabled(next);
              if (!next) {
                bgm.stop();
                setActiveBgm(null);
              }
              triggerToast(`BGM 설정: ${next ? 'ON (켜짐)' : 'OFF (음소거)'}`);
            }}
          >
            🎵 BGM 마스터 {bgmEnabled ? '(ON - 활성화)' : '(OFF - 음소거됨 ⚠️)'}
          </button>
          {!bgmEnabled && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 61, 0, 0.15)',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              ⚠️ 현재 BGM이 OFF 상태입니다. 아래 트랙 클릭 시 자동 ON으로 켜집니다.
            </div>
          )}

          {/* 사운드 엔진 버전 비교 스위처 탭 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              margin: '10px 0 14px 0',
              padding: '4px',
              background: 'var(--color-bg-secondary, rgba(0,0,0,0.15))',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border:
                  bgmVersion === 'v1' ? '2px solid var(--color-warning)' : '1px solid transparent',
                backgroundColor: bgmVersion === 'v1' ? 'rgba(255, 193, 7, 0.25)' : 'transparent',
                color: bgmVersion === 'v1' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setBgmVersion('v1');
                bgm.setVersion('v1');
                triggerToast('📻 [원형] 초기 베이스 샘플 (v1 Simple Loop) 모드로 전환');
              }}
            >
              📻 [원형] 베이스 샘플 (v1)
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border:
                  bgmVersion === 'v2' ? '2px solid var(--color-success)' : '1px solid transparent',
                backgroundColor: bgmVersion === 'v2' ? 'rgba(0, 200, 83, 0.25)' : 'transparent',
                color: bgmVersion === 'v2' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setBgmVersion('v2');
                bgm.setVersion('v2');
                triggerToast('✨ [완성본] 고품질 마스터링 (v2 Full Master) 모드로 전환');
              }}
            >
              ✨ [완성본] 리마스터 (v2)
            </button>
          </div>

          {[
            {
              id: 'brain_age' as BgmTheme,
              num: 1,
              emoji: '🧠',
              title: '두뇌 트레이닝',
              genre: 'Brain Age Jazz',
              tempo: bgmVersion === 'v1' ? '104 BPM' : '106 BPM',
            },
            {
              id: 'celeste' as BgmTheme,
              num: 2,
              emoji: '🧗‍♀️',
              title: '셀레스트 등반',
              genre: 'Celeste First Steps',
              tempo: '118 BPM',
            },
            {
              id: 'climb' as BgmTheme,
              num: 3,
              emoji: '⚡',
              title: '신스웨이브 피버',
              genre: 'Climber Synthwave',
              tempo: bgmVersion === 'v1' ? '112 BPM' : '124 BPM',
            },
            {
              id: 'shop' as BgmTheme,
              num: 4,
              emoji: '🏪',
              title: '산악 만물상',
              genre: 'Cozy Outfitter Bossa',
              tempo: bgmVersion === 'v1' ? '100 BPM' : '102 BPM',
            },
            {
              id: 'victory' as BgmTheme,
              num: 5,
              emoji: '🏆',
              title: '정상 정복 팡파르',
              genre: 'Summit Victory',
              tempo: bgmVersion === 'v1' ? '100 BPM' : '108 BPM',
              activeColor: 'rgba(255, 193, 7, 0.3)',
              activeBorder: 'var(--color-warning)',
            },
            {
              id: 'crisis' as BgmTheme,
              num: 6,
              emoji: '💓',
              title: '스태미나 위기',
              genre: 'Crisis Heartbeat',
              tempo: bgmVersion === 'v1' ? '126 BPM' : '132 BPM',
              activeColor: 'rgba(255, 61, 0, 0.3)',
              activeBorder: 'var(--color-error)',
            },
            {
              id: 'puzzle' as BgmTheme,
              num: 7,
              emoji: '🧩',
              title: '퀴즈 포커스',
              genre: 'Lo-Fi Study Beats',
              tempo: bgmVersion === 'v1' ? '92 BPM' : '84 BPM',
            },
            {
              id: 'chill' as BgmTheme,
              num: 8,
              emoji: '🏔️',
              title: '산악 앰비언트 (미완의 산장)',
              genre: 'Uncharted Lodge Chill',
              tempo: bgmVersion === 'v1' ? '2.2s Step' : '76 BPM',
            },
            {
              id: 'arcade' as BgmTheme,
              num: 9,
              emoji: '👾',
              title: '레트로 아케이드',
              genre: '8-Bit NES Chiptune',
              tempo: bgmVersion === 'v1' ? '110 BPM' : '136 BPM',
            },
          ].map((track) => {
            const isActive = activeBgm === track.id;
            const versionBadge = bgmVersion === 'v1' ? ' [원형]' : ' [완성본]';

            const arrangement = (bgmVersion === 'v1' ? BGM_ARRANGEMENTS_V1 : BGM_ARRANGEMENTS_V2)[
              track.id
            ];

            const currentPart =
              arrangement?.parts.find(
                (p) => currentStep >= p.startStep && currentStep <= p.endStep
              ) || arrangement?.parts[0];

            const progressPct = arrangement
              ? Math.min(100, Math.max(0, (currentStep / arrangement.totalSteps) * 100))
              : 0;
            const currentSec = arrangement
              ? (currentStep * arrangement.stepDuration).toFixed(1)
              : '0';
            const totalSec = arrangement
              ? (arrangement.totalSteps * arrangement.stepDuration).toFixed(1)
              : '0';

            return (
              <div
                key={track.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '8px',
                }}
              >
                <button
                  style={{
                    backgroundColor: isActive
                      ? track.activeColor || 'rgba(0, 200, 83, 0.3)'
                      : 'var(--color-bg-secondary)',
                    borderColor: isActive
                      ? track.activeBorder || 'var(--color-success)'
                      : 'var(--color-border)',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    padding: '10px 14px',
                  }}
                  onClick={() => {
                    if (isActive) {
                      bgm.stop();
                      setActiveBgm(null);
                      triggerToast('⏹️ BGM 정지');
                    } else {
                      if (!bgmEnabled) {
                        setBgmEnabled(true);
                      }
                      bgm.play(track.id);
                      setActiveBgm(track.id);
                      triggerToast(
                        `${track.emoji} ${track.num}. ${track.title} (${track.genre})${versionBadge} 재생 중`
                      );
                    }
                  }}
                >
                  {track.emoji}{' '}
                  {isActive
                    ? `${track.num}. ${track.title}${versionBadge} (재생 중 ⏸)`
                    : `${track.num}. ${track.title} (${track.genre} - ${track.tempo})${versionBadge}`}
                </button>

                {/* 해당 곡 재생 시 버튼 바로 아래로 아코디언처럼 확장되는 실시간 진행바 패널 */}
                {isActive && arrangement && currentPart && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-bg-secondary, rgba(0, 0, 0, 0.25))',
                      border: '1.5px solid var(--color-success)',
                      boxShadow: '0 4px 14px rgba(0, 200, 83, 0.15)',
                      marginBottom: '6px',
                    }}
                  >
                    {/* 1. 진행 상태 헤더 */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-success)',
                            boxShadow: '0 0 8px var(--color-success)',
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 'bold',
                            fontSize: '13px',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          🎵 {currentPart.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        ⏱️ {currentSec}s / {totalSec}s ({currentStep} / {arrangement.totalSteps}{' '}
                        Step)
                      </span>
                    </div>

                    {/* 2. 클릭 가능한 실시간 진행바 */}
                    <div
                      style={{
                        position: 'relative',
                        height: '14px',
                        borderRadius: '7px',
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                      title="클릭하여 원하는 위치로 즉시 이동"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = Math.max(
                          0,
                          Math.min(1, (e.clientX - rect.left) / rect.width)
                        );
                        const target = Math.floor(ratio * arrangement.totalSteps);
                        bgm.seekToStep(target);
                        setCurrentStep(target);
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-success)',
                          borderRadius: '7px',
                          transition: 'width 0.08s linear',
                        }}
                      />
                      {[25, 50, 75].map((pct) => (
                        <div
                          key={pct}
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: `${pct}%`,
                            width: '2px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none',
                          }}
                        />
                      ))}
                    </div>

                    {/* 3. [1][2][3][4] 파트별 바로가기 점프 버튼 */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        marginTop: '10px',
                      }}
                    >
                      {arrangement.parts.map((part) => {
                        const isSelected = currentPart.partNum === part.partNum;
                        const partBadge =
                          part.partNum === 1
                            ? '기초'
                            : part.partNum === 2
                              ? '드럼'
                              : part.partNum === 3
                                ? '리드'
                                : '클라이맥스';

                        return (
                          <button
                            key={part.partNum}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '6px',
                              border: isSelected
                                ? '2px solid var(--color-success)'
                                : '1px solid var(--color-border)',
                              backgroundColor: isSelected
                                ? 'rgba(0, 200, 83, 0.25)'
                                : 'var(--color-bg-primary, rgba(255,255,255,0.05))',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => {
                              bgm.jumpToPart(part.partNum);
                              setCurrentStep(part.startStep);
                              triggerToast(
                                `⏩ [Part ${part.partNum}] ${part.name} 구간으로 즉시 이동`
                              );
                            }}
                          >
                            <div
                              style={{
                                fontSize: '12px',
                                color: isSelected ? 'var(--color-success)' : 'inherit',
                              }}
                            >
                              [{part.partNum}] {partBadge}
                            </div>
                            <div
                              style={{
                                fontSize: '9px',
                                color: 'var(--color-text-secondary)',
                                marginTop: '2px',
                              }}
                            >
                              {part.startStep}~{part.endStep}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* 4. 활성 악기 목록 태그 & 설명 */}
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-bg-primary, rgba(0,0,0,0.2))',
                        fontSize: '11px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'bold',
                          color: 'var(--color-text-primary)',
                          marginBottom: '4px',
                        }}
                      >
                        🎼 현재 추가된 악기 ({currentPart.instruments.length}개):
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          marginBottom: '6px',
                        }}
                      >
                        {currentPart.instruments.map((inst) => {
                          const isPlaying =
                            isActive && isInstrumentPlaying(track.id, inst, currentStep);

                          return (
                            <span
                              key={inst}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '12px',
                                backgroundColor: isPlaying
                                  ? 'rgba(255, 214, 0, 0.32)'
                                  : 'rgba(0, 200, 83, 0.12)',
                                border: isPlaying
                                  ? '1px solid #ffd600'
                                  : '1px solid rgba(0, 200, 83, 0.28)',
                                color: isPlaying ? '#fff9a6' : 'var(--color-success)',
                                fontSize: '10px',
                                fontWeight: isPlaying ? '800' : 'bold',
                                transform: isPlaying
                                  ? 'scale(1.08) translateY(-1px)'
                                  : 'scale(1) translateY(0)',
                                boxShadow: isPlaying ? '0 0 10px rgba(255, 214, 0, 0.6)' : 'none',
                                transition: 'all 0.1s ease-out',
                              }}
                            >
                              {inst}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        💬 {currentPart.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            style={{
              backgroundColor: 'rgba(255, 61, 0, 0.15)',
              borderColor: 'var(--color-error)',
            }}
            onClick={() => {
              bgm.stop();
              setActiveBgm(null);
              triggerToast('⏹️ BGM 정지');
            }}
          >
            ⏹️ BGM 전체 끄기 (Stop)
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
