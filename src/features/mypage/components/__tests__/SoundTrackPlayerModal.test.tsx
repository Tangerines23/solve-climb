import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoundTrackPlayerModal } from '../SoundTrackPlayerModal';
import { bgm, sound } from '@/utils/sound';

vi.mock('@/utils/sound', () => ({
  bgm: {
    play: vi.fn(),
    stop: vi.fn(),
    getCurrentTheme: vi.fn(() => null),
    getCurrentStep: vi.fn(() => 0),
    jumpToPart: vi.fn(),
  },
  sound: {
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
    playCombo: vi.fn(),
    playFever: vi.fn(),
    playCountdown: vi.fn(),
    playStageClear: vi.fn(),
    playGameOver: vi.fn(),
    playRevive: vi.fn(),
    playScoreCount: vi.fn(),
    playStaminaWarning: vi.fn(),
    playKeypad: vi.fn(),
    playTap: vi.fn(),
  },
  BGM_ARRANGEMENTS_V2: {
    brain_age: {
      totalSteps: 32,
      stepDuration: 0.1415,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    celeste: {
      totalSteps: 32,
      stepDuration: 0.127,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    climb: {
      totalSteps: 32,
      stepDuration: 0.121,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    shop: {
      totalSteps: 32,
      stepDuration: 0.147,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    victory: {
      totalSteps: 32,
      stepDuration: 0.138,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    crisis: {
      totalSteps: 32,
      stepDuration: 0.113,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    puzzle: {
      totalSteps: 32,
      stepDuration: 0.178,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
    chill: {
      totalSteps: 256,
      stepDuration: 0.1974,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 63 }],
    },
    arcade: {
      totalSteps: 32,
      stepDuration: 0.11,
      parts: [{ partNum: 1, name: 'Part 1', startStep: 0, endStep: 31 }],
    },
  },
}));

describe('SoundTrackPlayerModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<SoundTrackPlayerModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText('🎵 사운드 트랙')).not.toBeInTheDocument();
  });

  it('renders all 9 BGM tracks when open in BGM tab', () => {
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="bgm" />);
    expect(screen.getByText('🎵 사운드 트랙')).toBeInTheDocument();
    expect(screen.getByText('1. 두뇌 트레이닝')).toBeInTheDocument();
    expect(screen.getByText('2. 셀레스트 등반')).toBeInTheDocument();
    expect(screen.getByText('3. 신스웨이브 피버')).toBeInTheDocument();
    expect(screen.getByText('4. 산악 만물상')).toBeInTheDocument();
    expect(screen.getByText('5. 정상 정복 팡파르')).toBeInTheDocument();
    expect(screen.getByText('6. 스태미나 위기')).toBeInTheDocument();
    expect(screen.getByText('7. 퀴즈 포커스')).toBeInTheDocument();
    expect(screen.getByText('8. 산악 앰비언트 (미완의 산장)')).toBeInTheDocument();
    expect(screen.getByText('9. 레트로 아케이드')).toBeInTheDocument();
  });

  it('plays BGM when clicking a track', () => {
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="bgm" />);
    const track1 = screen.getByText('1. 두뇌 트레이닝');
    fireEvent.click(track1);
    expect(bgm.play).toHaveBeenCalledWith('brain_age');
  });

  it('switches to SFX tab and plays sounds on click', () => {
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="sfx" />);
    expect(screen.getByText('맑은 차임벨 (정답)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('맑은 차임벨 (정답)'));
    expect(sound.playCorrect).toHaveBeenCalled();

    fireEvent.click(screen.getByText('버저 / 쿵 (오답)'));
    expect(sound.playWrong).toHaveBeenCalled();
  });

  it('calls onClose when clicking back button', () => {
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });
});
