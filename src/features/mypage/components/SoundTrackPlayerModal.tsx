import { useState, useEffect } from 'react';
import { bgm, sound, type BgmTheme, BGM_ARRANGEMENTS_V2, isInstrumentPlaying } from '@/utils/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface SoundTrackPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'bgm' | 'sfx';
}

function parseInstrumentTag(inst: string): { icon: string; name: string } {
  // 이모지나 특수 심볼로 시작하는 경우 (예: "🎻 워킹 콘트라베이스", "⚡ 16비트 모듈러")
  const emojiMatch = inst.match(
    /^(\p{Extended_Pictographic}|\p{Emoji}|[\u2600-\u27BF]|⚡|✨|🔥|💓|⏱️|🚨|📐|🪵|🪕|🪇|🔔|💥)\s*(.*)$/u
  );
  if (emojiMatch) {
    return {
      icon: emojiMatch[1],
      name: emojiMatch[2] || inst,
    };
  }
  return { icon: '🎵', name: inst };
}

const BGM_TRACKS: Array<{
  id: BgmTheme;
  num: number;
  emoji: string;
  title: string;
  genre: string;
  tempo: string;
  activeColor?: string;
  activeBorder?: string;
}> = [
  {
    id: 'brain_age',
    num: 1,
    emoji: '🧠',
    title: '두뇌 트레이닝',
    genre: 'Brain Age Jazz',
    tempo: '106 BPM',
  },
  {
    id: 'celeste',
    num: 2,
    emoji: '🧗‍♀️',
    title: '셀레스트 등반',
    genre: 'Celeste First Steps',
    tempo: '118 BPM',
  },
  {
    id: 'climb',
    num: 3,
    emoji: '⚡',
    title: '신스웨이브 피버',
    genre: 'Climber Synthwave',
    tempo: '124 BPM',
  },
  {
    id: 'shop',
    num: 4,
    emoji: '🏪',
    title: '산악 만물상',
    genre: 'Cozy Outfitter Bossa',
    tempo: '102 BPM',
  },
  {
    id: 'victory',
    num: 5,
    emoji: '🏆',
    title: '정상 정복 팡파르',
    genre: 'Summit Victory',
    tempo: '108 BPM',
    activeColor: 'rgba(255, 193, 7, 0.3)',
    activeBorder: 'var(--color-warning)',
  },
  {
    id: 'crisis',
    num: 6,
    emoji: '💓',
    title: '스태미나 위기',
    genre: 'Crisis Heartbeat',
    tempo: '132 BPM',
    activeColor: 'rgba(255, 61, 0, 0.3)',
    activeBorder: 'var(--color-error)',
  },
  {
    id: 'puzzle',
    num: 7,
    emoji: '🧩',
    title: '퀴즈 포커스',
    genre: 'Lo-Fi Study Beats',
    tempo: '84 BPM',
  },
  {
    id: 'chill',
    num: 8,
    emoji: '🏔️',
    title: '산악 앰비언트 (미완의 산장)',
    genre: 'Uncharted Lodge Chill',
    tempo: '76 BPM',
  },
  {
    id: 'arcade',
    num: 9,
    emoji: '👾',
    title: '레트로 아케이드',
    genre: '8-Bit NES Chiptune',
    tempo: '136 BPM',
  },
];

const SFX_ITEMS = [
  { name: '맑은 차임벨 (정답)', emoji: '🔔', action: () => sound.playCorrect() },
  { name: '버저 / 쿵 (오답)', emoji: '❌', action: () => sound.playWrong() },
  { name: '콤보 상승음 (5 Combo)', emoji: '🔥', action: () => sound.playCombo(5) },
  { name: '피버 발동 (FEVER)', emoji: '⚡', action: () => sound.playFever() },
  { name: '카운트다운 (3, 2, 1, GO)', emoji: '⏱️', action: () => sound.playCountdown(1) },
  { name: '스테이지 클리어 (완등)', emoji: '🎉', action: () => sound.playStageClear() },
  { name: '게임 오버 (탈락)', emoji: '💀', action: () => sound.playGameOver() },
  { name: '부활 / 에너지 충전', emoji: '✨', action: () => sound.playRevive() },
  { name: '점수 롤링 카운트업', emoji: '🔢', action: () => sound.playScoreCount() },
  { name: '스태미나 위기 심장박동', emoji: '💓', action: () => sound.playStaminaWarning() },
  { name: '키패드 입력음', emoji: '⌨️', action: () => sound.playKeypad() },
  { name: '일반 버튼 탭', emoji: '👆', action: () => sound.playTap() },
];

export function SoundTrackPlayerModal({
  isOpen,
  onClose,
  initialTab = 'bgm',
}: SoundTrackPlayerModalProps) {
  const [activeTab, setActiveTab] = useState<'bgm' | 'sfx'>(initialTab);
  const [activeBgm, setActiveBgm] = useState<BgmTheme | null>(() => bgm.getCurrentTheme());
  const [currentStep, setCurrentStep] = useState<number>(0);

  const bgmEnabled = useSettingsStore((s) => s.bgmEnabled);
  const setBgmEnabled = useSettingsStore((s) => s.setBgmEnabled);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setActiveBgm(bgm.getCurrentTheme());
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!activeBgm) return;
    const timer = setInterval(() => {
      setCurrentStep(bgm.getCurrentStep());
    }, 40);
    return () => clearInterval(timer);
  }, [activeBgm]);

  if (!isOpen) return null;

  return (
    <div
      className="sound-player-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="사운드 트랙 플레이어"
    >
      <div className="sound-player-modal-container">
        {/* 헤더 */}
        <div className="sound-player-modal-header">
          <button
            type="button"
            className="sound-player-back-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>뒤로가기</span>
          </button>
          <h2 className="sound-player-modal-title">🎵 사운드 트랙</h2>
          <div style={{ width: '68px' }} />
        </div>

        {/* 탭 전환 (BGM / 효과음) */}
        <div className="sound-player-tabs">
          <button
            type="button"
            className={`sound-player-tab ${activeTab === 'bgm' ? 'active' : ''}`}
            onClick={() => setActiveTab('bgm')}
          >
            배경음악 (BGM)
          </button>
          <button
            type="button"
            className={`sound-player-tab ${activeTab === 'sfx' ? 'active' : ''}`}
            onClick={() => setActiveTab('sfx')}
          >
            효과음 (SFX)
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div className="sound-player-content">
          {activeTab === 'bgm' ? (
            <div className="sound-player-bgm-list">
              {/* 상단 컨트롤 상태 바 */}
              <div className="sound-player-status-bar">
                <div className="sound-player-status-info">
                  <span
                    className="sound-player-status-indicator"
                    data-active={bgmEnabled && !!activeBgm}
                  />
                  <span className="sound-player-status-text">
                    {bgmEnabled && activeBgm
                      ? `재생 중: ${BGM_TRACKS.find((t) => t.id === activeBgm)?.title || activeBgm}`
                      : '정지됨 (트랙을 눌러 재생)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="sound-player-toggle-btn"
                  onClick={() => {
                    const next = !bgmEnabled;
                    setBgmEnabled(next);
                    if (!next) {
                      bgm.stop();
                      setActiveBgm(null);
                    }
                  }}
                >
                  {bgmEnabled ? '🔊 BGM 켜짐' : '🔇 BGM 꺼짐'}
                </button>
              </div>

              {/* 1~9번 BGM 트랙 카드 목록 */}
              <div className="sound-player-track-grid">
                {BGM_TRACKS.map((track) => {
                  const isActive = activeBgm === track.id;
                  const arrangement = BGM_ARRANGEMENTS_V2[track.id];
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
                      className={`sound-player-track-card ${isActive ? 'active' : ''}`}
                      style={{
                        borderColor: isActive
                          ? track.activeBorder || 'var(--color-success)'
                          : undefined,
                        backgroundColor: isActive
                          ? track.activeColor || 'rgba(0, 200, 83, 0.15)'
                          : undefined,
                      }}
                    >
                      <button
                        type="button"
                        className="sound-player-track-main-btn"
                        onClick={() => {
                          if (isActive) {
                            bgm.stop();
                            setActiveBgm(null);
                          } else {
                            if (!bgmEnabled) {
                              setBgmEnabled(true);
                            }
                            bgm.play(track.id);
                            setActiveBgm(track.id);
                          }
                        }}
                      >
                        <div className="sound-player-track-header">
                          <span className="sound-player-track-emoji">{track.emoji}</span>
                          <div className="sound-player-track-meta">
                            <span className="sound-player-track-title">
                              {track.num}. {track.title}
                            </span>
                            <span className="sound-player-track-tempo">
                              {track.genre} • {track.tempo}
                            </span>
                          </div>
                        </div>
                        <span className="sound-player-play-icon">{isActive ? '⏸' : '▶'}</span>
                      </button>

                      {/* 실시간 진행 상태 패널 (재생 중일 때 확장) */}
                      {isActive && arrangement && currentPart && (
                        <div className="sound-player-progress-panel">
                          {/* 1. 파트 이름 & 실시간 시간 헤더 */}
                          <div className="sound-player-progress-header">
                            <span className="sound-player-part-name">🎵 {currentPart.name}</span>
                            <span className="sound-player-part-time">
                              ⏱️ {currentSec}s / {totalSec}s ({currentStep} /{' '}
                              {arrangement.totalSteps} Step)
                            </span>
                          </div>

                          {/* 2. 클릭/탐색 가능한 실시간 진행 바 */}
                          <div
                            className="sound-player-progress-bar-bg sound-player-progress-bar-interactive"
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
                              className="sound-player-progress-bar-fill"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* 3. [1][2][3][4] 파트별 바로가기 점프 버튼 */}
                          <div className="sound-player-part-buttons">
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
                                  type="button"
                                  className={`sound-player-part-btn ${isSelected ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    bgm.jumpToPart(part.partNum);
                                    setCurrentStep(part.startStep);
                                  }}
                                >
                                  <div className="sound-player-part-btn-title">
                                    [{part.partNum}] {partBadge}
                                  </div>
                                  <div className="sound-player-part-btn-range">
                                    {part.startStep}~{part.endStep}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* 4. 활성 악기 목록 태그 및 파트 설명 */}
                          <div className="sound-player-instruments-panel">
                            <div className="sound-player-instruments-title">
                              🎼 현재 추가된 악기 ({currentPart.instruments.length}개):
                            </div>
                            <div className="sound-player-instruments-tags">
                              {currentPart.instruments.map((inst) => {
                                const isPlaying =
                                  isActive && isInstrumentPlaying(track.id, inst, currentStep);
                                const { icon, name } = parseInstrumentTag(inst);

                                return (
                                  <span
                                    key={inst}
                                    className={`sound-player-instrument-tag ${isPlaying ? 'is-playing' : ''}`}
                                    data-playing={isPlaying}
                                    title={isPlaying ? `${name} 연주 중 🎵` : name}
                                  >
                                    <span className="instrument-icon">{icon}</span>
                                    <span className="instrument-name">{name}</span>
                                    <span className="instrument-wave" />
                                  </span>
                                );
                              })}
                            </div>
                            {currentPart.description && (
                              <div className="sound-player-part-desc">
                                💬 {currentPart.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="sound-player-sfx-list">
              {/* 효과음 마스터 스위치 상태 */}
              <div className="sound-player-status-bar">
                <div className="sound-player-status-info">
                  <span className="sound-player-status-indicator" data-active={soundEnabled} />
                  <span className="sound-player-status-text">
                    {soundEnabled ? '효과음 활성화됨' : '효과음 음소거됨 (클릭 시 자동 켜짐)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="sound-player-toggle-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? '🔊 효과음 켜짐' : '🔇 효과음 꺼짐'}
                </button>
              </div>

              {/* 효과음 버튼 그리드 */}
              <div className="sound-player-sfx-grid">
                {SFX_ITEMS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sound-player-sfx-btn"
                    onClick={() => {
                      if (!soundEnabled) {
                        setSoundEnabled(true);
                      }
                      item.action();
                    }}
                  >
                    <span className="sound-player-sfx-emoji">{item.emoji}</span>
                    <span className="sound-player-sfx-name">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
