// Web Audio API 기반 프로시저럴 효과음(SFX) 엔진
// 별도 mp3/wav 파일 다운로드 없이 0 Byte로 실시간 합성 재생합니다.

import { audioContextManager } from './audioContext';
import { setupGlobalTapListener } from './globalTapListener';
import { playTone, playSweep, playChord, playFilteredTone, playMultiPulse } from './synthesizers';

export class SoundEngine {
  private removeTapListener?: () => void;
  private lastTapAudioTime: number = 0;

  constructor() {
    this.removeTapListener = setupGlobalTapListener(
      () => this.playTap(),
      () => this.playEmptyTap(),
      () => this.playBack()
    );
  }

  private getGraph(): { ctx: AudioContext; destination: AudioNode } | null {
    if (!audioContextManager.isEnabled()) return null;
    const ctx = audioContextManager.getContext();
    const destination = audioContextManager.getMasterGain();
    if (!ctx || !destination) return null;
    return { ctx, destination };
  }

  // ==========================================
  // 1. 키패드 입력음 (Custom / Qwerty Keypad)
  // ==========================================
  playKeypad(isBackspace: boolean = false): void {
    const graph = this.getGraph();
    if (!graph) return;

    playSweep(graph.ctx, graph.destination, {
      startFreq: isBackspace ? 440 : 750,
      endFreq: isBackspace ? 240 : 380,
      duration: 0.03,
      volume: 0.18,
      type: 'sine',
    });
  }

  // ==========================================
  // 2. 정답 효과음 (맑은 3화음 차임벨)
  // ==========================================
  playCorrect(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playChord(graph.ctx, graph.destination, {
      notes: [{ freq: 523.25 }, { freq: 659.25 }, { freq: 783.99 }], // C5, E5, G5
      type: 'triangle',
      interval: 0.06,
      defaultDuration: 0.35,
      defaultVolume: 0.2,
    });
  }

  // ==========================================
  // 3. 콤보 효과음 (콤보 수에 따라 음높이 상승)
  // ==========================================
  playCombo(combo: number): void {
    const graph = this.getGraph();
    if (!graph) return;

    const scale = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      698.46, // F5
      783.99, // G5
      880.0, // A5
      987.77, // B5
      1046.5, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
    ];

    const baseIndex = Math.min(Math.max(0, combo - 1), scale.length - 2);
    const rootNote = scale.at(baseIndex) ?? 523.25;
    const secondNote = scale.at(baseIndex + 1) ?? 659.25;

    playChord(graph.ctx, graph.destination, {
      notes: [{ freq: rootNote }, { freq: secondNote }],
      type: 'sine',
      interval: 0.05,
      defaultDuration: 0.28,
      defaultVolume: 0.22,
    });
  }

  // ==========================================
  // 4. 오답 효과음 (둔탁한 버저 / 쿵)
  // ==========================================
  playWrong(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playFilteredTone(graph.ctx, graph.destination, {
      freq: 160,
      endFreq: 80,
      duration: 0.22,
      volume: 0.24,
      type: 'sawtooth',
      filter: {
        type: 'lowpass',
        frequency: 450,
      },
    });
  }

  // ==========================================
  // 5. 카운트다운 효과음 (3, 2, 1 -> GO!)
  // ==========================================
  playCountdown(count: number): void {
    const graph = this.getGraph();
    if (!graph) return;

    if (count > 0) {
      // 3, 2, 1: 맑고 집중도 높은 틱 비프음
      playTone(graph.ctx, graph.destination, {
        freq: 880,
        type: 'sine',
        duration: 0.08,
        attack: 0.01,
        volume: 0.2,
      });
    } else {
      // 0 또는 GO!: 에너제틱 화음 버스트
      playChord(graph.ctx, graph.destination, {
        notes: [{ freq: 523.25 }, { freq: 659.25 }, { freq: 783.99 }, { freq: 1046.5 }],
        type: 'triangle',
        defaultDuration: 0.35,
        defaultVolume: 0.18,
      });
    }
  }

  // ==========================================
  // 6. 피버 모드 진입 (Fever / Momentum)
  // ==========================================
  playFever(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playSweep(graph.ctx, graph.destination, {
      startFreq: 350,
      endFreq: 1100,
      duration: 0.3,
      attack: 0.1,
      volume: 0.22,
      type: 'sine',
    });
  }

  // ==========================================
  // 7. 스테이지 클리어 / 완등 팡파르
  // ==========================================
  playStageClear(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playChord(graph.ctx, graph.destination, {
      notes: [
        { freq: 523.25, time: 0, dur: 0.12 },
        { freq: 659.25, time: 0.12, dur: 0.12 },
        { freq: 783.99, time: 0.24, dur: 0.15 },
        { freq: 1046.5, time: 0.39, dur: 0.6 },
      ],
      type: 'triangle',
      defaultVolume: 0.22,
    });
  }

  // ==========================================
  // 8. 게임 오버 / 등반 실패 징글
  // ==========================================
  playGameOver(): void {
    const graph = this.getGraph();
    if (!graph) return;

    const notes = [
      { freq: 392.0, time: 0, dur: 0.2 },
      { freq: 311.13, time: 0.2, dur: 0.2 },
      { freq: 261.63, time: 0.4, dur: 0.45 },
    ];

    notes.forEach(({ freq, time, dur }) => {
      playFilteredTone(graph.ctx, graph.destination, {
        freq,
        duration: dur,
        volume: 0.2,
        startTimeOffset: time,
        type: 'sawtooth',
        filter: {
          type: 'lowpass',
          frequency: 700,
        },
      });
    });
  }

  // ==========================================
  // 9. 점수 롤링 카운트업 소리
  // ==========================================
  playScoreCount(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playSweep(graph.ctx, graph.destination, {
      startFreq: 1600,
      endFreq: 700,
      duration: 0.02,
      volume: 0.12,
      type: 'sine',
    });
  }

  // ==========================================
  // 10. Last Chance 부활 / 에너지 충전
  // ==========================================
  playRevive(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playSweep(graph.ctx, graph.destination, {
      startFreq: 220,
      endFreq: 880,
      duration: 0.4,
      attack: 0.15,
      volume: 0.24,
      type: 'triangle',
    });
  }

  // ==========================================
  // 12. 스태미나 위기 심장박동 (Heartbeat Pulse)
  // ==========================================
  playStaminaWarning(): void {
    const graph = this.getGraph();
    if (!graph) return;

    playMultiPulse(graph.ctx, graph.destination, [
      { offset: 0, startFreq: 160, endFreq: 75, punchFreq: 320, dur: 0.12, vol: 0.35 },
      { offset: 0.15, startFreq: 180, endFreq: 85, punchFreq: 380, dur: 0.15, vol: 0.4 },
    ]);
  }

  // ==========================================
  // 일반 UI 탭 사운드 (스마트하고 청량한 팝/틱)
  // ==========================================
  playTap(): void {
    const graph = this.getGraph();
    if (!graph) return;

    const now = Date.now();
    if (now - this.lastTapAudioTime < 80) return;
    this.lastTapAudioTime = now;

    playSweep(graph.ctx, graph.destination, {
      startFreq: 680,
      endFreq: 340,
      duration: 0.025,
      volume: 0.08,
      type: 'sine',
    });
  }

  // ==========================================
  // 뒤로가기 / 취소 / 닫기 사운드 (부드러운 하강 팝/틱)
  // ==========================================
  playBack(): void {
    const graph = this.getGraph();
    if (!graph) return;

    const now = Date.now();
    if (now - this.lastTapAudioTime < 80) return;
    this.lastTapAudioTime = now;

    playSweep(graph.ctx, graph.destination, {
      startFreq: 520,
      endFreq: 260,
      duration: 0.03,
      volume: 0.07,
      type: 'sine',
    });
  }

  // ==========================================
  // 빈 공간 터치음 (암벽/초크 톡 짚는 느낌)
  // ==========================================
  playEmptyTap(): void {
    const graph = this.getGraph();
    if (!graph) return;

    const now = Date.now();
    if (now - this.lastTapAudioTime < 80) return;
    this.lastTapAudioTime = now;

    playFilteredTone(graph.ctx, graph.destination, {
      freq: 260,
      endFreq: 110,
      duration: 0.02,
      volume: 0.04,
      type: 'triangle',
      filter: {
        type: 'lowpass',
        frequency: 350,
      },
    });
  }

  /**
   * 리스너 정리 (테스트 및 HMR용)
   */
  dispose(): void {
    if (this.removeTapListener) {
      this.removeTapListener();
      this.removeTapListener = undefined;
    }
  }
}

export const sound = new SoundEngine();
