// Web Audio API 기반 0Byte 프로시저럴 배경음악(BGM) 엔진

import { audioContextManager } from './audioContext';

export type BgmTheme =
  | 'brain_age'
  | 'celeste'
  | 'climb'
  | 'shop'
  | 'victory'
  | 'crisis'
  | 'puzzle'
  | 'chill'
  | 'arcade';

export class BgmEngine {
  private currentTheme: BgmTheme | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private isMuffled: boolean = false;
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private volume: number = 0.35;
  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  /**
   * BGM 전용 게인 및 마스터 로우패스 필터 노드 초기화
   */
  private getGraph(): { ctx: AudioContext; destination: AudioNode } | null {
    if (!audioContextManager.isEnabled()) return null;
    const ctx = audioContextManager.getContext();
    if (!ctx) return null;

    if (!this.masterGain || !this.masterFilter) {
      this.masterFilter = ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = this.isMuffled ? 500 : 20000;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    return { ctx, destination: this.masterFilter };
  }

  /**
   * BGM 재생 시작 (또는 테마 전환)
   * @param theme 재생할 테마
   * @param muffled 시작 시 먹먹한 저음 필터 적용 여부
   */
  play(theme: BgmTheme, muffled: boolean = false): void {
    this.isMuffled = muffled;
    const graph = this.getGraph();
    if (!graph) return;

    if (this.currentTheme === theme && this.isRunning) {
      // 이미 같은 테마가 재생 중이면 먹먹함 필터만 즉시 업데이트
      this.setMuffled(muffled, 0.35);
      return;
    }

    // 기존 재생 중인 루프 부드럽게 정지 후 전환
    this.stop(0.2);

    this.currentTheme = theme;
    this.isRunning = true;
    this.currentStep = 0;
    this.nextStepTime = graph.ctx.currentTime + 0.05;

    const targetGain = this.isMuffled ? this.volume * 0.6 : this.volume;
    if (this.masterGain) {
      const now = graph.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.3);
    }

    if (this.masterFilter) {
      const now = graph.ctx.currentTime;
      this.masterFilter.Q.value = 1.5;
      this.masterFilter.frequency.cancelScheduledValues(now);
      this.masterFilter.frequency.setValueAtTime(this.isMuffled ? 280 : 20000, now);
    }

    this.startScheduler();
  }

  /**
   * BGM 정지 (부드러운 페이드아웃)
   */
  stop(fadeDuration: number = 0.4): void {
    if (!this.isRunning && !this.currentTheme) return;

    this.isRunning = false;
    this.currentTheme = null;

    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    const graph = this.getGraph();
    if (graph && this.masterGain) {
      const now = graph.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
    }

    // 활성 노드 정리
    setTimeout(
      () => {
        this.activeNodes.forEach(({ osc, gain }) => {
          try {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        });
        this.activeNodes = [];
      },
      fadeDuration * 1000 + 100
    );
  }

  /**
   * BGM 볼륨 조절 (0.0 ~ 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.isRunning) {
      const graph = this.getGraph();
      if (graph) {
        const now = graph.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
      }
    }
  }

  /**
   * BGM 저음 필터링 (먹먹한 로우패스 효과 - 게임팁 모달 / 일시정지 연출)
   * @param muffled true: 280Hz 로우패스 (먹먹한 딥 베이스), false: 20000Hz (전체 대역 개방)
   * @param duration 필터 전환 시간 (초)
   */
  setMuffled(muffled: boolean, duration: number = 0.35): void {
    this.isMuffled = muffled;
    const graph = this.getGraph();
    if (!graph || !this.masterFilter) return;

    const now = graph.ctx.currentTime;
    const targetFreq = muffled ? 280 : 20000;
    this.masterFilter.frequency.cancelScheduledValues(now);
    this.masterFilter.frequency.setValueAtTime(this.masterFilter.frequency.value, now);
    this.masterFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + duration);

    if (this.masterGain) {
      const targetGain = muffled ? this.volume * 0.6 : this.volume;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + duration);
    }
  }

  getIsMuffled(): boolean {
    return this.isMuffled;
  }

  getVolume(): number {
    return this.volume;
  }

  getCurrentTheme(): BgmTheme | null {
    return this.currentTheme;
  }

  isPlaying(): boolean {
    return this.isRunning;
  }

  // ==========================================
  // 스케줄러 & 음악 생성 엔진
  // ==========================================
  private startScheduler(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
    }

    this.schedulerTimer = window.setInterval(() => {
      this.scheduleLoop();
    }, 40);
  }

  private scheduleLoop(): void {
    const graph = this.getGraph();
    if (!graph || !this.isRunning) return;

    const scheduleAheadTime = 0.25;

    while (this.nextStepTime < graph.ctx.currentTime + scheduleAheadTime) {
      if (this.currentTheme === 'brain_age') {
        this.scheduleBrainAgeStep(
          graph.ctx,
          graph.destination,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1442; // 104 BPM 16분음표 (스마트한 스윙 재즈)
        this.currentStep = (this.currentStep + 1) % 64; // 4마디 루프
      } else if (this.currentTheme === 'celeste') {
        this.scheduleCelesteStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.1271; // 118 BPM 16분음표 (First Steps 등반 모멘텀)
        this.currentStep = (this.currentStep + 1) % 128; // 8마디 대형 발전 루프
      } else if (this.currentTheme === 'climb') {
        this.scheduleClimbStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.1339; // 112 BPM 16분음표
        this.currentStep = (this.currentStep + 1) % 64;
      } else if (this.currentTheme === 'shop') {
        this.scheduleShopStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.15; // 100 BPM 16분음표 (아기자기한 산악 만물상 보사노바)
        this.currentStep = (this.currentStep + 1) % 64; // 4마디 루프
      } else if (this.currentTheme === 'victory') {
        this.scheduleVictoryStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.15; // 100 BPM 16분음표 (웅장한 완등 승리 피날레)
        this.currentStep = (this.currentStep + 1) % 64; // 4마디 루프
      } else if (this.currentTheme === 'crisis') {
        this.scheduleCrisisStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.119; // 126 BPM 16분음표 (긴박한 심장박동 위기)
        this.currentStep = (this.currentStep + 1) % 32; // 2마디 루프
      } else if (this.currentTheme === 'chill') {
        this.scheduleChillStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 2.2;
        this.currentStep = (this.currentStep + 1) % 8;
      } else if (this.currentTheme === 'arcade') {
        this.scheduleArcadeStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.136;
        this.currentStep = (this.currentStep + 1) % 32;
      } else if (this.currentTheme === 'puzzle') {
        this.schedulePuzzleStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.163;
        this.currentStep = (this.currentStep + 1) % 32;
      } else {
        break;
      }
    }
  }

  /**
   * 테마 1: 🧠 두뇌 트레이닝 (Brain Age Style - 104 BPM 라운지 재즈 ⭐)
   */
  private scheduleBrainAgeStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const chordIndex = Math.floor(step / 16);

    const walkingBass: Record<number, number[]> = {
      0: [65.41, 82.41, 98.0, 116.54],
      1: [110.0, 138.59, 164.81, 155.56],
      2: [73.42, 87.31, 110.0, 103.83],
      3: [98.0, 123.47, 146.83, 138.59],
    };
    const currentBass = walkingBass[chordIndex] || walkingBass[0];
    const beatIndex = Math.floor((step % 16) / 4);

    if (step % 4 === 0 && currentBass) {
      const bFreq = currentBass[beatIndex];
      if (bFreq) {
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        const bFilter = ctx.createBiquadFilter();

        bGain.gain.value = 0;
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bFreq, time);

        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(380, time);

        bGain.gain.setValueAtTime(0.0001, time);
        bGain.gain.linearRampToValueAtTime(0.13, time + 0.015);
        bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(destination);

        bOsc.start(time);
        bOsc.stop(time + 0.38);
        this.trackActiveNode(bOsc, bGain);
      }
    }

    const isPianoComp = step % 16 === 0 || step % 16 === 6 || step % 16 === 10;
    if (isPianoComp) {
      const jazzChords: Record<number, number[]> = {
        0: [261.63, 329.63, 392.0, 493.88, 587.33],
        1: [220.0, 277.18, 329.63, 415.3, 523.25],
        2: [293.66, 349.23, 440.0, 523.25, 659.25],
        3: [246.94, 329.63, 392.0, 440.0, 587.33],
      };
      const chordNotes = jazzChords[chordIndex] || jazzChords[0];

      chordNotes.forEach((cFreq, cIdx) => {
        const pOsc = ctx.createOscillator();
        const pGain = ctx.createGain();
        const pFilter = ctx.createBiquadFilter();

        pGain.gain.value = 0;
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(cFreq, time);

        pFilter.type = 'lowpass';
        pFilter.frequency.setValueAtTime(950, time);

        const pVol = cIdx === 0 ? 0.05 : 0.038;
        pGain.gain.setValueAtTime(0.0001, time);
        pGain.gain.linearRampToValueAtTime(pVol, time + 0.012);
        pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);

        pOsc.connect(pFilter);
        pFilter.connect(pGain);
        pGain.connect(destination);

        pOsc.start(time);
        pOsc.stop(time + 0.28);
        this.trackActiveNode(pOsc, pGain);
      });
    }

    if (step % 8 === 4) {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();

      hGain.gain.value = 0;
      hOsc.type = 'triangle';
      hOsc.frequency.setValueAtTime(1600, time);

      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(2200, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.035, time + 0.005);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

      hOsc.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(destination);

      hOsc.start(time);
      hOsc.stop(time + 0.045);
      this.trackActiveNode(hOsc, hGain);
    }
  }

  /**
   * 테마 2: 🧗‍♀️ 셀레스트 등반 (Celeste 'First Steps' Style - 118 BPM ⭐⭐⭐)
   */
  private scheduleCelesteStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const isPartTwo = step >= 64;
    const localStep = step % 64;
    const chordIndex = Math.floor(localStep / 16);

    if (isPartTwo && step % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(120, time);
      kickOsc.frequency.exponentialRampToValueAtTime(45, time + 0.05);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(0.14, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.065);
      this.trackActiveNode(kickOsc, kickGain);
    }

    const pianoPatterns: Record<number, number[]> = {
      0: [
        261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63, 261.63, 329.63, 392.0, 493.88,
        523.25, 659.25, 523.25, 392.0,
      ],
      1: [
        246.94, 329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63, 246.94, 329.63, 392.0, 493.88,
        587.33, 783.99, 587.33, 493.88,
      ],
      2: [
        220.0, 261.63, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0,
        523.25, 659.25, 523.25, 329.63,
      ],
      3: [
        174.61, 220.0, 261.63, 349.23, 440.0, 349.23, 261.63, 220.0, 174.61, 220.0, 261.63, 349.23,
        523.25, 659.25, 523.25, 440.0,
      ],
    };
    const currentPianoArp = pianoPatterns[chordIndex] || pianoPatterns[0];
    const pianoFreq = currentPianoArp[localStep % 16];

    if (pianoFreq) {
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pFilter = ctx.createBiquadFilter();

      pGain.gain.value = 0;
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(pianoFreq, time);

      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(isPartTwo ? 1400 : 900, time);

      const pVol = isPartTwo ? 0.055 : 0.075;
      pGain.gain.setValueAtTime(0.0001, time);
      pGain.gain.linearRampToValueAtTime(pVol, time + 0.008);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      pOsc.connect(pFilter);
      pFilter.connect(pGain);
      pGain.connect(destination);

      pOsc.start(time);
      pOsc.stop(time + 0.2);
      this.trackActiveNode(pOsc, pGain);
    }

    if (isPartTwo && step % 2 === 0) {
      const synthBassMap: Record<number, number> = {
        0: 65.41,
        1: 87.31,
        2: 55.0,
        3: 49.0,
      };
      const sbFreq = synthBassMap[chordIndex] || 65.41;

      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sGain.gain.value = 0;
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(sbFreq, time);

      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(450, time);

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.12, time + 0.012);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      sOsc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);

      sOsc.start(time);
      sOsc.stop(time + 0.18);
      this.trackActiveNode(sOsc, sGain);
    }

    if (isPartTwo) {
      const leadMelody: Record<number, number> = {
        0: 523.25,
        4: 659.25,
        8: 783.99,
        12: 659.25,
        16: 880.0,
        20: 783.99,
        24: 659.25,
        28: 523.25,
        32: 659.25,
        36: 783.99,
        40: 880.0,
        44: 1046.5,
        48: 987.77,
        52: 880.0,
        56: 783.99,
        60: 659.25,
      };
      const lFreq = leadMelody[localStep];
      if (lFreq) {
        const lOsc = ctx.createOscillator();
        const lGain = ctx.createGain();
        const lFilter = ctx.createBiquadFilter();

        lGain.gain.value = 0;
        lOsc.type = 'sawtooth';
        lOsc.frequency.setValueAtTime(lFreq, time);

        lFilter.type = 'lowpass';
        lFilter.frequency.setValueAtTime(800, time);
        lFilter.frequency.linearRampToValueAtTime(1400, time + 0.2);
        lFilter.frequency.linearRampToValueAtTime(600, time + 0.45);

        lGain.gain.setValueAtTime(0.0001, time);
        lGain.gain.linearRampToValueAtTime(0.055, time + 0.04);
        lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.48);

        lOsc.connect(lFilter);
        lFilter.connect(lGain);
        lGain.connect(destination);

        lOsc.start(time);
        lOsc.stop(time + 0.5);
        this.trackActiveNode(lOsc, lGain);
      }
    }
  }

  /**
   * 테마 3: 🧗‍♂️ 클라이머 펄스 (Climber Pulse - 112 BPM)
   */
  private scheduleClimbStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const chordIndex = Math.floor(step / 16);

    const isKick = step % 4 === 0 || (step === 62 && chordIndex === 3);
    if (isKick) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(115, time);
      kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.05);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(0.14, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.06);
      this.trackActiveNode(kickOsc, kickGain);
    }

    const bassMap: Record<number, number[]> = {
      0: [55.0, 110.0, 55.0, 110.0, 82.41, 110.0, 55.0, 110.0],
      1: [43.65, 87.31, 43.65, 87.31, 65.41, 87.31, 43.65, 87.31],
      2: [65.41, 130.81, 65.41, 130.81, 98.0, 130.81, 65.41, 130.81],
      3: [49.0, 98.0, 49.0, 98.0, 73.42, 98.0, 49.0, 98.0],
    };
    const currentBassNotes = bassMap[chordIndex] || bassMap[0];
    const bassNote = currentBassNotes[Math.floor((step % 16) / 2)];

    if (step % 2 === 0 && bassNote) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassNote, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(320, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.12, time + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.18);
      this.trackActiveNode(bOsc, bGain);
    }

    const arpPatterns: Record<number, number[]> = {
      0: [
        220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63, 220, 261.63, 329.63, 440, 659.25,
        523.25, 440, 329.63,
      ],
      1: [
        174.61, 220, 261.63, 349.23, 440, 349.23, 261.63, 220, 174.61, 220, 261.63, 349.23, 523.25,
        440, 349.23, 261.63,
      ],
      2: [
        130.81, 196, 261.63, 329.63, 392, 329.63, 261.63, 196, 130.81, 196, 261.63, 329.63, 523.25,
        392, 329.63, 261.63,
      ],
      3: [
        196, 246.94, 293.66, 392, 493.88, 392, 293.66, 246.94, 196, 246.94, 293.66, 392, 587.33,
        493.88, 392, 293.66,
      ],
    };
    const currentArpPattern = arpPatterns[chordIndex] || arpPatterns[0];
    const arpFreq = currentArpPattern[step % 16];

    if (arpFreq) {
      const aOsc = ctx.createOscillator();
      const aGain = ctx.createGain();
      const aFilter = ctx.createBiquadFilter();

      aGain.gain.value = 0;
      aOsc.type = step % 4 === 0 ? 'triangle' : 'sine';
      aOsc.frequency.setValueAtTime(arpFreq, time);

      aFilter.type = 'lowpass';
      aFilter.frequency.setValueAtTime(1400, time);
      aFilter.frequency.linearRampToValueAtTime(500, time + 0.1);

      aGain.gain.setValueAtTime(0.0001, time);
      aGain.gain.linearRampToValueAtTime(0.065, time + 0.008);
      aGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

      aOsc.connect(aFilter);
      aFilter.connect(aGain);
      aGain.connect(destination);

      aOsc.start(time);
      aOsc.stop(time + 0.12);
      this.trackActiveNode(aOsc, aGain);
    }

    const isStab = step % 16 === 6 || step % 16 === 12;
    if (isStab) {
      const stabChords: Record<number, number[]> = {
        0: [261.63, 329.63, 440],
        1: [261.63, 349.23, 440],
        2: [261.63, 329.63, 392],
        3: [293.66, 392, 493.88],
      };
      const chordNotes = stabChords[chordIndex] || stabChords[0];

      chordNotes.forEach((cFreq) => {
        const sOsc = ctx.createOscillator();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();

        sGain.gain.value = 0;
        sOsc.type = 'triangle';
        sOsc.frequency.setValueAtTime(cFreq, time);

        sFilter.type = 'lowpass';
        sFilter.frequency.setValueAtTime(900, time);

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.05, time + 0.015);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

        sOsc.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(destination);

        sOsc.start(time);
        sOsc.stop(time + 0.18);
        this.trackActiveNode(sOsc, sGain);
      });
    }
  }

  /**
   * 테마 4: 🏪 산악 만물상 (Cozy Outfitter Shop - 100 BPM ⭐⭐⭐)
   * 아늑한 우쿨렐레 보사노바 리듬 + 아기자기한 실로폰 & 우드블록 쇼핑 테마
   */
  private scheduleShopStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const chordIndex = Math.floor(step / 16); // 0: Cmaj7, 1: A7(b9), 2: Dm7, 3: G7(13)

    // 1. 보사노바 베이스 (Bossa Nova Acoustic Bass)
    const bossaBass: Record<number, { step: number; freq: number }[]> = {
      0: [
        { step: 0, freq: 65.41 },
        { step: 6, freq: 98.0 },
        { step: 10, freq: 65.41 },
        { step: 14, freq: 98.0 },
      ], // C -> G -> C -> G
      1: [
        { step: 0, freq: 110.0 },
        { step: 6, freq: 164.81 },
        { step: 10, freq: 110.0 },
        { step: 14, freq: 155.56 },
      ], // A -> E -> A -> Eb
      2: [
        { step: 0, freq: 73.42 },
        { step: 6, freq: 110.0 },
        { step: 10, freq: 73.42 },
        { step: 14, freq: 110.0 },
      ], // D -> A -> D -> A
      3: [
        { step: 0, freq: 98.0 },
        { step: 6, freq: 146.83 },
        { step: 10, freq: 98.0 },
        { step: 14, freq: 123.47 },
      ], // G -> D -> G -> B
    };
    const currentBassEvents = bossaBass[chordIndex] || bossaBass[0];
    const bassEvent = currentBassEvents.find((e) => e.step === step % 16);

    if (bassEvent) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassEvent.freq, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(280, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.12, time + 0.015);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.3);
      this.trackActiveNode(bOsc, bGain);
    }

    // 2. 우쿨렐레/기타 보사노바 스트럼 컴핑 (Ukulele Strum)
    const isStrum = step % 16 === 0 || step % 16 === 6 || step % 16 === 10 || step % 16 === 14;
    if (isStrum) {
      const shopChords: Record<number, number[]> = {
        0: [261.63, 329.63, 392.0, 493.88], // Cmaj7 (C4, E4, G4, B4)
        1: [277.18, 329.63, 392.0, 466.16], // A7(b9) (C#4, E4, G4, Bb4)
        2: [293.66, 349.23, 440.0, 523.25], // Dm7 (D4, F4, A4, C5)
        3: [246.94, 329.63, 349.23, 440.0], // G7(13) (B3, E4, F4, A4)
      };
      const chordNotes = shopChords[chordIndex] || shopChords[0];

      chordNotes.forEach((cFreq, cIdx) => {
        const uOsc = ctx.createOscillator();
        const uGain = ctx.createGain();
        const uFilter = ctx.createBiquadFilter();

        uGain.gain.value = 0;
        uOsc.type = 'triangle';
        uOsc.frequency.setValueAtTime(cFreq, time);

        uFilter.type = 'lowpass';
        uFilter.frequency.setValueAtTime(1100, time);

        const uVol = cIdx === 0 ? 0.045 : 0.032;
        uGain.gain.setValueAtTime(0.0001, time);
        uGain.gain.linearRampToValueAtTime(uVol, time + 0.01);
        uGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

        uOsc.connect(uFilter);
        uFilter.connect(uGain);
        uGain.connect(destination);

        uOsc.start(time);
        uOsc.stop(time + 0.24);
        this.trackActiveNode(uOsc, uGain);
      });
    }

    // 3. 귀여운 실로폰 & 휘파람 멜로디 (Playful Xylophone Lead)
    const melodyMap: Record<number, number[]> = {
      0: [659.25, 0, 783.99, 0, 880.0, 0, 987.77, 0, 783.99, 0, 659.25, 0, 587.33, 0, 523.25, 0], // E5 -> G5 -> A5 -> B5 -> G5 -> E5 -> D5 -> C5
      1: [554.37, 0, 659.25, 0, 783.99, 0, 932.33, 0, 783.99, 0, 659.25, 0, 698.46, 0, 0, 0], // C#5 -> E5 -> G5 -> Bb5 -> G5 -> E5 -> F5
      2: [698.46, 0, 880.0, 0, 1046.5, 0, 880.0, 0, 698.46, 0, 587.33, 0, 659.25, 0, 0, 0], // F5 -> A5 -> C6 -> A5 -> F5 -> D5 -> E5
      3: [587.33, 0, 783.99, 0, 987.77, 0, 1174.66, 0, 987.77, 0, 783.99, 0, 523.25, 0, 0, 0], // D5 -> G5 -> B5 -> D6 -> B5 -> G5 -> C5 (해결)
    };
    const currentMelody = melodyMap[chordIndex] || melodyMap[0];
    const mFreq = currentMelody[step % 16];

    if (mFreq && mFreq > 0) {
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      const mFilter = ctx.createBiquadFilter();

      mGain.gain.value = 0;
      mOsc.type = 'sine';
      mOsc.frequency.setValueAtTime(mFreq, time);

      mFilter.type = 'lowpass';
      mFilter.frequency.setValueAtTime(1600, time);

      mGain.gain.setValueAtTime(0.0001, time);
      mGain.gain.linearRampToValueAtTime(0.07, time + 0.008);
      mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      mOsc.connect(mFilter);
      mFilter.connect(mGain);
      mGain.connect(destination);

      mOsc.start(time);
      mOsc.stop(time + 0.24);
      this.trackActiveNode(mOsc, mGain);
    }

    // 4. 가벼운 우드블록 탭 (Woodblock Tap - 2, 4박)
    if (step % 8 === 4) {
      const wOsc = ctx.createOscillator();
      const wGain = ctx.createGain();
      const wFilter = ctx.createBiquadFilter();

      wGain.gain.value = 0;
      wOsc.type = 'triangle';
      wOsc.frequency.setValueAtTime(1400, time);

      wFilter.type = 'bandpass';
      wFilter.frequency.setValueAtTime(1400, time);

      wGain.gain.setValueAtTime(0.0001, time);
      wGain.gain.linearRampToValueAtTime(0.04, time + 0.004);
      wGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      wOsc.connect(wFilter);
      wFilter.connect(wGain);
      wGain.connect(destination);

      wOsc.start(time);
      wOsc.stop(time + 0.04);
      this.trackActiveNode(wOsc, wGain);
    }
  }

  /**
   * 테마 5: 🏆 정상 정복 & 결과 화면 (Summit Victory - 100 BPM ⭐⭐⭐)
   */
  private scheduleVictoryStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const chordIndex = Math.floor(step / 16);

    if (step % 16 === 0) {
      const victoryChords: Record<number, number[]> = {
        0: [174.61, 220.0, 261.63, 329.63, 440.0],
        1: [196.0, 246.94, 293.66, 349.23, 392.0],
        2: [164.81, 196.0, 246.94, 329.63, 392.0],
        3: [130.81, 196.0, 261.63, 329.63, 523.25],
      };
      const chord = victoryChords[chordIndex] || victoryChords[0];

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        gain.gain.value = 0;
        osc.type = i === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time);
        filter.frequency.linearRampToValueAtTime(1400, time + 0.5);
        filter.frequency.linearRampToValueAtTime(600, time + 2.1);

        const vol = i === 0 ? 0.11 : 0.045;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(time);
        osc.stop(time + 2.4);
        this.trackActiveNode(osc, gain);
      });
    }

    const arpSeq = [
      523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 880.0, 1174.66, 659.25, 783.99, 987.77,
      1318.51, 783.99, 1046.5, 1318.51, 1567.98,
    ];
    const harpFreq = arpSeq[step % 16];
    if (harpFreq) {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      hGain.gain.value = 0;
      hOsc.type = 'sine';
      hOsc.frequency.setValueAtTime(harpFreq, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.045, time + 0.01);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

      hOsc.connect(hGain);
      hGain.connect(destination);

      hOsc.start(time);
      hOsc.stop(time + 0.38);
      this.trackActiveNode(hOsc, hGain);
    }
  }

  /**
   * 테마 6: 💓 스태미나 위기 / 라스트 찬스 (Crisis Heartbeat - 126 BPM ⭐⭐)
   */
  private scheduleCrisisStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    // 1. 심장박동 더블 쿵-쿵 (Lub-Dub Heartbeat)
    const isFirstBeat = step % 8 === 0;
    const isSecondBeat = step % 8 === 2;

    if (isFirstBeat || isSecondBeat) {
      // Body Osc (묵직한 펀치감)
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();

      hGain.gain.value = 0;
      hOsc.type = 'triangle';
      const startFreq = isFirstBeat ? 160 : 130;
      const endFreq = isFirstBeat ? 55 : 45;
      hOsc.frequency.setValueAtTime(startFreq, time);
      hOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.12);

      hFilter.type = 'lowpass';
      hFilter.frequency.setValueAtTime(450, time);

      const hVol = isFirstBeat ? 0.32 : 0.22;
      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(hVol, time + 0.01);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      hOsc.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(destination);

      hOsc.start(time);
      hOsc.stop(time + 0.16);
      this.trackActiveNode(hOsc, hGain);

      // Sub Sine (서브 저음 둥-)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subGain.gain.value = 0;
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(isFirstBeat ? 80 : 65, time);
      subOsc.frequency.exponentialRampToValueAtTime(38, time + 0.15);

      subGain.gain.setValueAtTime(0.0001, time);
      subGain.gain.linearRampToValueAtTime(isFirstBeat ? 0.25 : 0.16, time + 0.015);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      subOsc.connect(subGain);
      subGain.connect(destination);

      subOsc.start(time);
      subOsc.stop(time + 0.2);
      this.trackActiveNode(subOsc, subGain);
    }

    // 2. 어둡고 긴박한 텐션 신스 패드 (Dark Tension Chords)
    if (step % 16 === 0) {
      const tensionChord =
        step < 16
          ? [110.0, 164.81, 220.0, 261.63, 311.13] // Am(dim)
          : [82.41, 123.47, 164.81, 207.65, 246.94]; // E(dim)

      tensionChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        gain.gain.value = 0;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);
        filter.frequency.linearRampToValueAtTime(350, time + 1.8);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.1 : 0.055, time + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(time);
        osc.stop(time + 1.85);
        this.trackActiveNode(osc, gain);
      });
    }

    // 3. 째깍거리는 시한폭탄 펄스 (Clock Ticking Hi-hat)
    if (step % 2 === 0) {
      const tOsc = ctx.createOscillator();
      const tGain = ctx.createGain();
      const tFilter = ctx.createBiquadFilter();

      tGain.gain.value = 0;
      tOsc.type = 'triangle';
      tOsc.frequency.setValueAtTime(2800, time);

      tFilter.type = 'highpass';
      tFilter.frequency.setValueAtTime(2500, time);

      tGain.gain.setValueAtTime(0.0001, time);
      tGain.gain.linearRampToValueAtTime(0.05, time + 0.003);
      tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

      tOsc.connect(tFilter);
      tFilter.connect(tGain);
      tGain.connect(destination);

      tOsc.start(time);
      tOsc.stop(time + 0.035);
      this.trackActiveNode(tOsc, tGain);
    }
  }

  /**
   * 테마 7: 🏔️ 산악 앰비언트 (Mountain Chill Ambient - 8단계 발전형)
   */
  private scheduleChillStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    chordIndex: number
  ): void {
    const chords = [
      [130.81, 196.0, 246.94, 329.63],
      [110.0, 164.81, 196.0, 261.63],
      [87.31, 130.81, 174.61, 220.0],
      [98.0, 146.83, 196.0, 293.66],
      [82.41, 123.47, 196.0, 246.94],
      [87.31, 130.81, 220.0, 329.63],
      [73.42, 110.0, 174.61, 261.63],
      [98.0, 146.83, 246.94, 349.23],
    ];

    const chord = chords[chordIndex] || chords[0];
    const duration = 2.4;
    const attack = 0.6;

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.linearRampToValueAtTime(620, time + attack);
      filter.frequency.linearRampToValueAtTime(420, time + duration);

      const noteVol = i === 0 ? 0.12 : 0.07;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(noteVol, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + duration + 0.05);

      this.trackActiveNode(osc, gain);
    });

    if (chordIndex >= 4) {
      const melodyNotes = [
        [329.63, 392.0],
        [440.0, 523.25],
        [392.0, 349.23],
        [293.66, 261.63],
      ];
      const melodyPair = melodyNotes[chordIndex - 4] || [329.63, 392.0];

      melodyPair.forEach((mFreq, mIdx) => {
        const mTime = time + 0.3 + mIdx * 0.9;
        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        const mFilter = ctx.createBiquadFilter();

        mGain.gain.value = 0;
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(mFreq, mTime);

        mFilter.type = 'lowpass';
        mFilter.frequency.setValueAtTime(800, mTime);

        mGain.gain.setValueAtTime(0.0001, mTime);
        mGain.gain.linearRampToValueAtTime(0.065, mTime + 0.25);
        mGain.gain.exponentialRampToValueAtTime(0.0001, mTime + 0.85);

        mOsc.connect(mFilter);
        mFilter.connect(mGain);
        mGain.connect(destination);

        mOsc.start(mTime);
        mOsc.stop(mTime + 0.9);
        this.trackActiveNode(mOsc, mGain);
      });
    }

    const sparkles = [659.25, 523.25, 783.99, 587.33, 659.25, 880.0, 783.99, 1046.5];
    const sparkleFreq = sparkles[chordIndex] || 659.25;
    const sparkleTime = time + 0.8;

    const spOsc = ctx.createOscillator();
    const spGain = ctx.createGain();
    spGain.gain.value = 0;
    spOsc.type = 'sine';
    spOsc.frequency.setValueAtTime(sparkleFreq, sparkleTime);

    spGain.gain.setValueAtTime(0.0001, sparkleTime);
    spGain.gain.linearRampToValueAtTime(0.035, sparkleTime + 0.3);
    spGain.gain.exponentialRampToValueAtTime(0.0001, sparkleTime + 1.2);

    spOsc.connect(spGain);
    spGain.connect(destination);

    spOsc.start(sparkleTime);
    spOsc.stop(sparkleTime + 1.25);

    this.trackActiveNode(spOsc, spGain);
  }

  /**
   * 테마 8: 👾 레트로 아케이드 (Retro Arcade - 110 BPM)
   */
  private scheduleArcadeStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const bassPattern = [
      130.81, 0, 130.81, 0, 196.0, 0, 164.81, 0, 110.0, 0, 110.0, 0, 164.81, 0, 130.81, 0, 87.31, 0,
      87.31, 0, 130.81, 0, 110.0, 0, 98.0, 0, 146.83, 0, 196.0, 0, 246.94, 0,
    ];

    const bassFreq = bassPattern[step];
    if (bassFreq && bassFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassFreq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.13, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 0.24);
      this.trackActiveNode(osc, gain);
    }

    const leadNotes = [
      523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0, 880.0, 0, 783.99, 0, 659.25, 0, 523.25, 0, 440.0,
      0, 523.25, 0, 659.25, 0, 523.25, 0, 587.33, 0, 659.25, 0, 783.99, 0, 987.77, 0,
    ];

    const leadFreq = leadNotes[step];
    if (leadFreq && leadFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(leadFreq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.065, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 0.2);
      this.trackActiveNode(osc, gain);
    }
  }

  /**
   * 테마 9: 🧩 퀴즈 & 브레인 포커스 (Quiz Brain Focus - 92 BPM)
   */
  private schedulePuzzleStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    if (step % 8 === 0) {
      const jazzChords = [
        [174.61, 220.0, 261.63, 329.63],
        [164.81, 196.0, 246.94, 293.66],
        [146.83, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 246.94],
      ];
      const chord = jazzChords[Math.floor(step / 8)] || jazzChords[0];

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        gain.gain.value = 0;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.09 : 0.05, time + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(time);
        osc.stop(time + 1.3);
        this.trackActiveNode(osc, gain);
      });
    }

    const marimbaPattern = [
      523.25, 0, 659.25, 0, 0, 783.99, 0, 659.25, 493.88, 0, 587.33, 0, 0, 659.25, 0, 493.88, 440.0,
      0, 523.25, 0, 0, 659.25, 0, 523.25, 392.0, 0, 493.88, 0, 523.25, 0, 659.25, 0,
    ];

    const mFreq = marimbaPattern[step];
    if (mFreq && mFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(mFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.linearRampToValueAtTime(400, time + 0.25);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.09, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 0.3);
      this.trackActiveNode(osc, gain);
    }
  }

  private trackActiveNode(osc: OscillatorNode, gain: GainNode): void {
    this.activeNodes.push({ osc, gain });
    if (this.activeNodes.length > 60) {
      this.activeNodes.shift();
    }
  }

  dispose(): void {
    this.stop(0);
  }
}

export const bgm = new BgmEngine();
