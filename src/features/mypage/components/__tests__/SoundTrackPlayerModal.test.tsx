import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoundTrackPlayerModal } from '../SoundTrackPlayerModal';
import { bgm, sound, isInstrumentPlaying } from '@/utils/sound';

vi.mock('@/utils/sound', () => ({
  isInstrumentPlaying: vi.fn(() => false),
  bgm: {
    play: vi.fn(),
    stop: vi.fn(),
    getCurrentTheme: vi.fn(() => null),
    getCurrentStep: vi.fn(() => 0),
    jumpToPart: vi.fn(),
    seekToStep: vi.fn(),
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
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 15,
          instruments: ['EP(Rhodes 피아노)', 'Upright Bass'],
          description: 'EP와 베이스로 감미로운 재즈 바 분위기 형성',
        },
        {
          partNum: 2,
          name: 'Part 2',
          startStep: 16,
          endStep: 31,
          instruments: ['EP(Rhodes 피아노)', 'Upright Bass', 'Brush Drums'],
          description: '드럼이 추가되어 리듬감 강화',
        },
      ],
    },
    celeste: {
      totalSteps: 32,
      stepDuration: 0.127,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['Celeste Piano'],
          description: '',
        },
      ],
    },
    climb: {
      totalSteps: 32,
      stepDuration: 0.121,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['80s Synth Bass'],
          description: '',
        },
      ],
    },
    shop: {
      totalSteps: 32,
      stepDuration: 0.147,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['Acoustic Guitar'],
          description: '',
        },
      ],
    },
    victory: {
      totalSteps: 32,
      stepDuration: 0.138,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['Brass Fanfare'],
          description: '',
        },
      ],
    },
    crisis: {
      totalSteps: 32,
      stepDuration: 0.113,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['Heartbeat Pulse'],
          description: '',
        },
      ],
    },
    puzzle: {
      totalSteps: 32,
      stepDuration: 0.178,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['Lo-Fi EP'],
          description: '',
        },
      ],
    },
    chill: {
      totalSteps: 256,
      stepDuration: 0.1974,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 63,
          instruments: ['Ambient Pad'],
          description: '',
        },
      ],
    },
    arcade: {
      totalSteps: 32,
      stepDuration: 0.11,
      parts: [
        {
          partNum: 1,
          name: 'Part 1',
          startStep: 0,
          endStep: 31,
          instruments: ['8-Bit Lead'],
          description: '',
        },
      ],
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

  it('plays BGM and shows instrument details when clicking a track', () => {
    vi.mocked(bgm.getCurrentTheme).mockReturnValue('brain_age');
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="bgm" />);

    expect(screen.getByText(/현재 추가된 악기/)).toBeInTheDocument();
    expect(screen.getByText('EP(Rhodes 피아노)')).toBeInTheDocument();
    expect(screen.getByText('Upright Bass')).toBeInTheDocument();
    expect(screen.getByText(/EP와 베이스로 감미로운 재즈 바 분위기 형성/)).toBeInTheDocument();

    const track1 = screen.getByText('1. 두뇌 트레이닝');
    fireEvent.click(track1);
    expect(bgm.stop).toHaveBeenCalled();
  });

  it('switches to SFX tab and plays sounds on click', () => {
    vi.mocked(bgm.getCurrentTheme).mockReturnValue(null);
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="sfx" />);
    expect(screen.getByText('맑은 차임벨 (정답)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('맑은 차임벨 (정답)'));
    expect(sound.playCorrect).toHaveBeenCalled();

    fireEvent.click(screen.getByText('버저 / 쿵 (오답)'));
    expect(sound.playWrong).toHaveBeenCalled();
  });

  it('highlights instrument tag with is-playing class when active note is emitted', () => {
    vi.mocked(bgm.getCurrentTheme).mockReturnValue('brain_age');
    vi.mocked(isInstrumentPlaying).mockImplementation((_track, inst) =>
      inst.includes('Upright Bass')
    );

    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} initialTab="bgm" />);

    const bassTag = screen.getByText('Upright Bass').closest('.sound-player-instrument-tag');
    expect(bassTag).toHaveClass('is-playing');
    expect(bassTag).toHaveAttribute('data-playing', 'true');

    const epTag = screen.getByText('EP(Rhodes 피아노)').closest('.sound-player-instrument-tag');
    expect(epTag).not.toHaveClass('is-playing');
  });

  it('calls onClose when clicking back button', () => {
    render(<SoundTrackPlayerModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });
});
