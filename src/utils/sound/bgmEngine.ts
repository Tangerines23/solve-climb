// Web Audio API 기반 0Byte 프로시저럴 배경음악(BGM) 엔진 (고품질 사운드 디자인 & 공간계 리마스터링)

import { audioContextManager } from './audioContext';

export type BgmTheme =
  'brain_age' | 'celeste' | 'climb' | 'shop' | 'victory' | 'crisis' | 'puzzle' | 'chill' | 'arcade';

function safeGet<T>(obj: Record<number | string, T> | T[], key: number | string, fallback: T): T {
  if (Array.isArray(obj)) {
    const idx = typeof key === 'number' ? key : parseInt(String(key), 10);
    return !isNaN(idx) && idx >= 0 && idx < obj.length && obj[idx] !== undefined
      ? obj[idx]!
      : fallback;
  }
  if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
    const val = (obj as Record<number | string, T>)[key];
    return val !== undefined ? val : fallback;
  }
  return fallback;
}

export class BgmEngine {
  private currentTheme: BgmTheme | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuffled: boolean = false;
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private volume: number = 0.35;
  private activeNodes: { osc?: OscillatorNode; source?: AudioBufferSourceNode; gain: GainNode }[] =
    [];

  /**
   * BGM 전용 게인, 마스터 로우패스 필터, 알고리즈믹 룸 리버브 노드 초기화
   */
  private getGraph(): { ctx: AudioContext; destination: AudioNode; reverbSend: AudioNode } | null {
    if (!audioContextManager.isEnabled()) return null;
    const ctx = audioContextManager.getContext();
    if (!ctx) return null;

    if (!this.masterGain || !this.masterFilter) {
      this.masterFilter = ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = this.isMuffled ? 500 : 20000;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // 1. 알고리즈믹 룸/홀 리버브 합성 버퍼 생성
      this.reverbNode = this.createSyntheticReverb(ctx);
      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.28; // 어쿠스틱 잔향 게인

      if (this.reverbNode) {
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
      }

      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    return {
      ctx,
      destination: this.masterFilter,
      reverbSend: this.reverbNode ? this.reverbNode : this.masterFilter,
    };
  }

  /**
   * 0Byte 합성 임펄스 리스폰스 (1.6초 룸/클럽 어쿠스틱 잔향)
   */
  private createSyntheticReverb(ctx: AudioContext): ConvolverNode | null {
    try {
      const sampleRate = ctx.sampleRate || 44100;
      const length = Math.floor(sampleRate * 1.6);
      const impulse = ctx.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (sampleRate * 0.38));
        left[i] = (Math.random() * 2 - 1) * decay;
        right[i] = (Math.random() * 2 - 1) * decay;
      }

      const convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      return convolver;
    } catch {
      return null;
    }
  }

  /**
   * 고품질 드럼/퍼커션용 노이즈 버퍼 (1초 캐시)
   */
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (typeof ctx.createBuffer !== 'function') return null;
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      try {
        const sampleRate = ctx.sampleRate || 44100;
        const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
      } catch {
        return null;
      }
    }
    return this.noiseBuffer;
  }

  /**
   * 스테레오 패닝 헬퍼 (악기별 좌/우 입체 정위)
   */
  private createPanner(ctx: AudioContext, pan: number): StereoPannerNode | null {
    try {
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        return panner;
      }
    } catch {
      // fallback if not supported
    }
    return null;
  }

  /**
   * BGM 재생 시작 (또는 테마 전환)
   */
  play(theme: BgmTheme, muffled: boolean = false): void {
    this.isMuffled = muffled;
    const graph = this.getGraph();
    if (!graph) return;

    if (this.currentTheme === theme && this.isRunning) {
      this.setMuffled(muffled, 0.35);
      return;
    }

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

    setTimeout(
      () => {
        this.activeNodes.forEach(({ osc, source, gain }) => {
          try {
            if (osc) {
              osc.stop();
              osc.disconnect();
            }
            if (source) {
              source.stop();
              source.disconnect();
            }
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
   * BGM 저음 필터링 (먹먹한 로우패스 효과 - 모달 / 일시정지 연출)
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
  // 스케줄러 & 음악 생성 루프
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
        // [1번 트랙 심층 고도화] 106 BPM 재즈 스윙 그루브 (60/40 Shuffle)
        const isSwingSecond16th = this.currentStep % 2 === 1;
        const swingOffset = isSwingSecond16th ? 0.022 : 0;

        this.scheduleBrainAgeStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime + swingOffset,
          this.currentStep
        );
        this.nextStepTime += 0.1415; // 106 BPM
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 완성형 라운지 재즈 (~54.3초)
      } else if (this.currentTheme === 'celeste') {
        this.scheduleCelesteStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1271; // 118 BPM
        this.currentStep = (this.currentStep + 1) % 512; // 32마디 대형 4부작 서사 (~65.1초)
      } else if (this.currentTheme === 'climb') {
        this.scheduleClimbStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.121; // 124 BPM (사이버펑크 가속 질주)
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 사이버펑크 질주 루프 (~46.5초)
      } else if (this.currentTheme === 'shop') {
        this.scheduleShopStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.147; // 102 BPM (어쿠스틱 보사노바 그루브)
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 산악 만물상 보사노바 (~56.4초)
      } else if (this.currentTheme === 'victory') {
        this.scheduleVictoryStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1389; // 108 BPM (웅장한 승리 팡파르 행진)
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 승리 피날레 찬가 (~53.3초)
      } else if (this.currentTheme === 'crisis') {
        this.scheduleCrisisStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1136; // 132 BPM (긴박한 심장박동 서스펜스)
        this.currentStep = (this.currentStep + 1) % 448; // 28마디 심장박동 서스펜스 (~50.9초)
      } else if (this.currentTheme === 'chill') {
        this.scheduleChillStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 2.0; // 2.0초 주기 (총 64.0초 대형 싱잉볼 앰비언트)
        this.currentStep = (this.currentStep + 1) % 32; // 32주기 산림욕 힐링 (~64.0초)
      } else if (this.currentTheme === 'arcade') {
        this.scheduleArcadeStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1103; // 136 BPM (정통 8비트 패미컴 칩튠 앤섬)
        this.currentStep = (this.currentStep + 1) % 512; // 32마디 패미컴 칩튠 앤섬 (~56.5초)
      } else if (this.currentTheme === 'puzzle') {
        this.schedulePuzzleStep(
          graph.ctx,
          graph.destination,
          graph.reverbSend,
          this.nextStepTime,
          this.currentStep
        );
        this.nextStepTime += 0.1785; // 84 BPM (정통 Lo-Fi Study Beats 그루브)
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 Lo-Fi Rhodes 스터디 비트 (~68.5초)
      } else {
        break;
      }
    }
  }

  // =========================================================================
  // ⭐ [트랙 1번 심층 마스터] 🧠 두뇌 트레이닝 (Brain Age / Shibuya Lounge Jazz)
  // 장르: 시부야계 라운지 재즈 (워킹 콘트라베이스, 리얼 스윙 브러쉬 드럼, 웜 로즈 피아노, 비브라폰)
  // =========================================================================
  private scheduleBrainAgeStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96); // 0: Intro Lounge, 1: Vibraphone Motif, 2: Bebop Solo, 3: Turnaround
    const localStep = step % 96;
    const bar = Math.floor(localStep / 16); // 0~5 마디

    // -------------------------------------------------------------
    // 1. 어쿠스틱 워킹 콘트라베이스 (Dual-Oscillator Warm Double Bass)
    // -------------------------------------------------------------
    const walkingBassLines: Record<number, number[][]> = {
      // Part 1: Cmaj9 -> A7(b13) -> Dm9 -> G13 -> C6 -> G7alt
      0: [
        [65.41, 82.41, 98.0, 116.54], // C -> E -> G -> Bb
        [110.0, 138.59, 164.81, 155.56], // A -> C# -> E -> Eb
        [73.42, 87.31, 110.0, 103.83], // D -> F -> A -> Ab
        [98.0, 123.47, 146.83, 138.59], // G -> B -> D -> Db
        [65.41, 82.41, 98.0, 116.54], // C -> E -> G -> Bb
        [98.0, 123.47, 146.83, 164.81], // G -> B -> D -> E
      ],
      // Part 2: Fmaj9 -> F#dim7 -> C/G -> A7(#9) -> Dm9 -> G13(b9)
      1: [
        [87.31, 110.0, 130.81, 146.83], // F -> A -> C -> D
        [92.5, 116.54, 138.59, 155.56], // F# -> A -> C -> Eb
        [65.41, 98.0, 130.81, 110.0], // C/G -> G -> C -> A
        [110.0, 138.59, 164.81, 146.83], // A7
        [73.42, 110.0, 146.83, 138.59], // Dm7 -> G7
        [65.41, 98.0, 130.81, 123.47], // Cmaj7
      ],
      // Part 3: Bebop Fast Walking with Chromatic Passing Notes
      2: [
        [65.41, 82.41, 98.0, 123.47], // C -> E -> G -> B
        [110.0, 130.81, 146.83, 155.56], // A -> C -> D -> Eb
        [73.42, 87.31, 98.0, 103.83], // D -> F -> G -> Ab
        [98.0, 123.47, 138.59, 146.83], // G -> B -> Db -> D
        [65.41, 98.0, 123.47, 130.81], // C -> G -> B -> C
        [98.0, 116.54, 138.59, 155.56], // G -> Bb -> Db -> Eb (G7alt)
      ],
      // Part 4: Tritone Substitution & Chromatic Turnaround
      3: [
        [73.42, 87.31, 110.0, 130.81], // Dm9
        [69.3, 87.31, 103.83, 123.47], // Db9 (Tritone sub of G7)
        [65.41, 82.41, 98.0, 123.47], // Cmaj9
        [61.74, 77.78, 92.5, 116.54], // B7alt
        [58.27, 73.42, 87.31, 110.0], // Bbmaj7 -> A7alt
        [65.41, 98.0, 130.81, 196.0], // Cmaj9 Final Resolution
      ],
    };
    const currentPartBass = safeGet(walkingBassLines, part, walkingBassLines[0]);
    const currentBarBass = safeGet(currentPartBass, bar, currentPartBass[0]);
    const beatIndex = Math.floor((localStep % 16) / 4);

    if (step % 4 === 0 && currentBarBass) {
      const bFreq = safeGet(currentBarBass, beatIndex, 0);
      if (bFreq) {
        // Main Body Osc (Triangle)
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        const bFilter = ctx.createBiquadFilter();

        bGain.gain.value = 0;
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bFreq, time);

        // Woody lowpass filter envelope with acoustic pluck transient
        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(460, time);
        bFilter.frequency.exponentialRampToValueAtTime(160, time + 0.32);

        bGain.gain.setValueAtTime(0.0001, time);
        bGain.gain.linearRampToValueAtTime(0.14, time + 0.012);
        bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.36);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(destination);

        bOsc.start(time);
        bOsc.stop(time + 0.38);
        this.trackActiveNode(bOsc, undefined, bGain);

        // Sub Sub-bass fundamental (Sine)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subGain.gain.value = 0;
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(bFreq, time);

        subGain.gain.setValueAtTime(0.0001, time);
        subGain.gain.linearRampToValueAtTime(0.1, time + 0.015);
        subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

        subOsc.connect(subGain);
        subGain.connect(destination);

        subOsc.start(time);
        subOsc.stop(time + 0.35);
        this.trackActiveNode(subOsc, undefined, subGain);
      }
    }

    // -------------------------------------------------------------
    // 2. 웜 일렉트릭 로즈 피아노 콤핑 (Warm Stereo Rhodes Piano with Room Reverb)
    // -------------------------------------------------------------
    const isPianoComp = localStep % 16 === 0 || localStep % 16 === 6 || localStep % 16 === 10;
    if (isPianoComp) {
      const jazzChords: Record<number, number[]> = {
        0: [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9 (C, E, G, B, D)
        1: [220.0, 277.18, 329.63, 415.3, 523.25], // A7(b13) (A, C#, E, G#, C)
        2: [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9 (D, F, A, C, E)
        3: [246.94, 329.63, 392.0, 440.0, 587.33], // G13 (B, E, G, A, D)
        4: [261.63, 329.63, 392.0, 493.88, 659.25], // Cmaj7(9) (C, E, G, B, E)
        5: [246.94, 293.66, 392.0, 440.0, 587.33], // G7sus4 (B, D, G, A, D)
      };
      const chordNotes = safeGet(jazzChords, bar, jazzChords[0]);
      const panner = this.createPanner(ctx, -0.25); // 좌측 25% 스테레오 정위

      chordNotes.forEach((cFreq, cIdx) => {
        const pOsc = ctx.createOscillator();
        const pGain = ctx.createGain();
        const pFilter = ctx.createBiquadFilter();

        pGain.gain.value = 0;
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(cFreq, time);

        // Rhodes warmth filter
        pFilter.type = 'lowpass';
        pFilter.frequency.setValueAtTime(1100, time);
        pFilter.frequency.linearRampToValueAtTime(750, time + 0.25);

        const pVol = cIdx === 0 ? 0.055 : 0.038;
        pGain.gain.setValueAtTime(0.0001, time);
        pGain.gain.linearRampToValueAtTime(pVol, time + 0.015);
        pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

        pOsc.connect(pFilter);
        pFilter.connect(pGain);

        if (panner) {
          pGain.connect(panner);
          panner.connect(destination);
          panner.connect(reverbSend);
        } else {
          pGain.connect(destination);
          pGain.connect(reverbSend);
        }

        pOsc.start(time);
        pOsc.stop(time + 0.32);
        this.trackActiveNode(pOsc, undefined, pGain);
      });
    }

    // -------------------------------------------------------------
    // 3. 재즈 스윙 브러쉬 드럼 & 라이드 심벌 (Real Brushed Jazz Drum Kit)
    // -------------------------------------------------------------
    // (1) 부드러운 펠트 재즈 킥 (Feather Kick on 1 & 3)
    if (step % 8 === 0) {
      const kOsc = ctx.createOscillator();
      const kGain = ctx.createGain();
      kGain.gain.value = 0;
      kOsc.type = 'sine';
      kOsc.frequency.setValueAtTime(95, time);
      kOsc.frequency.exponentialRampToValueAtTime(45, time + 0.06);

      kGain.gain.setValueAtTime(0.0001, time);
      kGain.gain.linearRampToValueAtTime(0.12, time + 0.005);
      kGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

      kOsc.connect(kGain);
      kGain.connect(destination);

      kOsc.start(time);
      kOsc.stop(time + 0.075);
      this.trackActiveNode(kOsc, undefined, kGain);
    }

    // (2) 노이즈 버퍼 기반 재즈 브러쉬 스네어 탭 (Brush Snare on 2 & 4)
    if (step % 8 === 4) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const nSource = ctx.createBufferSource();
        const nGain = ctx.createGain();
        const nFilter = ctx.createBiquadFilter();

        nSource.buffer = noiseBuf;
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(2400, time);
        nFilter.Q.value = 1.2;

        nGain.gain.setValueAtTime(0.0001, time);
        nGain.gain.linearRampToValueAtTime(0.045, time + 0.008);
        nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

        nSource.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(destination);
        nGain.connect(reverbSend);

        nSource.start(time);
        nSource.stop(time + 0.09);
        this.trackActiveNode(undefined, nSource, nGain);
      }
    }

    // (3) 스윙 라이드 심벌 (Swing Ride Cymbal on 2 & 4 upbeat, 우측 패닝)
    if (step % 4 === 0 || step % 4 === 3) {
      const isAccent = step % 8 === 4;
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const rSource = ctx.createBufferSource();
        const rGain = ctx.createGain();
        const rFilter = ctx.createBiquadFilter();
        const rPanner = this.createPanner(ctx, 0.35); // 우측 35% 정위

        rSource.buffer = noiseBuf;
        rFilter.type = 'highpass';
        rFilter.frequency.setValueAtTime(6500, time);

        const rVol = isAccent ? 0.035 : 0.02;
        rGain.gain.setValueAtTime(0.0001, time);
        rGain.gain.linearRampToValueAtTime(rVol, time + 0.003);
        rGain.gain.exponentialRampToValueAtTime(0.0001, time + (isAccent ? 0.12 : 0.05));

        rSource.connect(rFilter);
        rFilter.connect(rGain);

        if (rPanner) {
          rGain.connect(rPanner);
          rPanner.connect(destination);
          rPanner.connect(reverbSend);
        } else {
          rGain.connect(destination);
          rGain.connect(reverbSend);
        }

        rSource.start(time);
        rSource.stop(time + 0.13);
        this.trackActiveNode(undefined, rSource, rGain);
      }
    }

    // -------------------------------------------------------------
    // 4. 비브라폰 & 솔로 멜로디 (Part 2 & Part 3 공간계 솔로 선율)
    // -------------------------------------------------------------
    if (part === 1 || part === 2) {
      const melodyMap: Record<number, number> = {
        0: 659.25,
        4: 783.99,
        8: 880.0,
        12: 987.77,
        16: 1046.5,
        20: 880.0,
        24: 783.99,
        28: 659.25,
        32: 587.33,
        36: 659.25,
        40: 783.99,
        44: 880.0,
        48: 987.77,
        52: 1174.66,
        56: 1046.5,
        60: 987.77,
        64: 880.0,
        68: 783.99,
        72: 659.25,
        76: 587.33,
        80: 523.25,
        84: 659.25,
        88: 783.99,
        92: 1046.5,
      };
      const mFreq = melodyMap[localStep];
      if (mFreq) {
        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        const mFilter = ctx.createBiquadFilter();
        const mPanner = this.createPanner(ctx, 0.15); // 약간 우측 솔로 정위

        mGain.gain.value = 0;
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(mFreq, time);

        // Vibraphone warm bell filter
        mFilter.type = 'lowpass';
        mFilter.frequency.setValueAtTime(1600, time);
        mFilter.frequency.exponentialRampToValueAtTime(800, time + 0.35);

        mGain.gain.setValueAtTime(0.0001, time);
        mGain.gain.linearRampToValueAtTime(0.065, time + 0.012);
        mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);

        mOsc.connect(mFilter);
        mFilter.connect(mGain);

        if (mPanner) {
          mGain.connect(mPanner);
          mPanner.connect(destination);
          mPanner.connect(reverbSend);
        } else {
          mGain.connect(destination);
          mGain.connect(reverbSend);
        }

        mOsc.start(time);
        mOsc.stop(time + 0.4);
        this.trackActiveNode(mOsc, undefined, mGain);
      }
    }
  }

  // =========================================================================
  // ⭐ [트랙 2번 심층 마스터] 🧗‍♀️ 셀레스트 등반 (Celeste 'First Steps' - 118 BPM 512 Steps / ~65.1초)
  // 장르: 레나 레인 스타일 감성 피아노 + 아날로그 신스 + 벅차오르는 등반 클라이맥스
  // =========================================================================
  private scheduleCelesteStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 128); // 0: Intro, 1: Ascent, 2: Peak Climax, 3: Summit Vista
    const localStep = step % 128;
    const bar = Math.floor(localStep / 16); // 0~7 마디
    const chordIndex = bar % 4;

    // -------------------------------------------------------------
    // 1. 산의 고동: 킥 & 크리스피 노이즈 스네어 (Drums)
    // -------------------------------------------------------------
    // (1) 4-on-the-floor 딥 마운틴 킥 (Part 1, 2)
    if (part >= 1 && step % 4 === 0) {
      const isClimax = part === 2;
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(isClimax ? 125 : 110, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.055);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(isClimax ? 0.16 : 0.12, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.07);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) 노이즈 버퍼 기반 크리스피 스네어 (Part 2 클라이맥스 2, 4박)
    if (part === 2 && step % 8 === 4) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const snSource = ctx.createBufferSource();
        const snGain = ctx.createGain();
        const snFilter = ctx.createBiquadFilter();

        snSource.buffer = noiseBuf;
        snFilter.type = 'bandpass';
        snFilter.frequency.setValueAtTime(2800, time);
        snFilter.Q.value = 1.4;

        snGain.gain.setValueAtTime(0.0001, time);
        snGain.gain.linearRampToValueAtTime(0.05, time + 0.005);
        snGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

        snSource.connect(snFilter);
        snFilter.connect(snGain);
        snGain.connect(destination);
        snGain.connect(reverbSend);

        snSource.start(time);
        snSource.stop(time + 0.075);
        this.trackActiveNode(undefined, snSource, snGain);
      }
    }

    // (3) 16비트 질주하는 하이햇 (Part 2 클라이맥스 전용, 우측 +22% 패닝)
    if (part === 2 && step % 2 === 0) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const hSource = ctx.createBufferSource();
        const hGain = ctx.createGain();
        const hFilter = ctx.createBiquadFilter();
        const hPanner = this.createPanner(ctx, 0.22);

        hSource.buffer = noiseBuf;
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7500, time);

        hGain.gain.setValueAtTime(0.0001, time);
        hGain.gain.linearRampToValueAtTime(0.028, time + 0.002);
        hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

        hSource.connect(hFilter);
        hFilter.connect(hGain);

        if (hPanner) {
          hGain.connect(hPanner);
          hPanner.connect(destination);
          hPanner.connect(reverbSend);
        } else {
          hGain.connect(destination);
          hGain.connect(reverbSend);
        }

        hSource.start(time);
        hSource.stop(time + 0.04);
        this.trackActiveNode(undefined, hSource, hGain);
      }
    }

    // -------------------------------------------------------------
    // 2. 영롱한 스테레오 피아노 아르페지오 (Stereo Panned Piano with Reverb)
    // -------------------------------------------------------------
    const pianoPatternsPart12: Record<number, number[]> = {
      0: [
        261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63, 261.63, 329.63, 392.0, 493.88,
        523.25, 659.25, 523.25, 392.0,
      ], // Cmaj7
      1: [
        246.94, 329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63, 246.94, 329.63, 392.0, 493.88,
        587.33, 783.99, 587.33, 493.88,
      ], // Em7
      2: [
        220.0, 261.63, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0,
        523.25, 659.25, 523.25, 329.63,
      ], // Am7
      3: [
        174.61, 220.0, 261.63, 349.23, 440.0, 349.23, 261.63, 220.0, 174.61, 220.0, 261.63, 349.23,
        523.25, 659.25, 523.25, 440.0,
      ], // Fmaj7
    };

    const pianoPatternsPart3: Record<number, number[]> = {
      0: [
        293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23, 293.66, 349.23, 440.0, 523.25,
        587.33, 698.46, 587.33, 440.0,
      ], // Dm7
      1: [
        246.94, 329.63, 392.0, 440.0, 587.33, 493.88, 392.0, 329.63, 246.94, 329.63, 392.0, 493.88,
        587.33, 783.99, 587.33, 493.88,
      ], // G13
      2: [
        220.0, 261.63, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0,
        523.25, 659.25, 523.25, 329.63,
      ], // Am7
      3: [
        174.61, 261.63, 329.63, 392.0, 523.25, 440.0, 349.23, 261.63, 174.61, 220.0, 261.63, 349.23,
        523.25, 659.25, 783.99, 1046.5,
      ], // Fmaj9
    };

    const targetPattern = part === 2 ? pianoPatternsPart3 : pianoPatternsPart12;
    const currentPianoArp = safeGet(targetPattern, chordIndex, targetPattern[0]);
    const pianoFreq = safeGet(currentPianoArp, localStep % 16, 0);

    if (pianoFreq) {
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pFilter = ctx.createBiquadFilter();
      // 스텝마다 좌/우로 부드럽게 퍼지는 스테레오 아르페지오 (-0.28 / +0.28)
      const panVal = localStep % 2 === 0 ? -0.28 : 0.28;
      const panner = this.createPanner(ctx, panVal);

      pGain.gain.value = 0;
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(pianoFreq, time);

      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(part >= 2 ? 1600 : 1050, time);

      const pVol = part === 0 ? 0.08 : part === 2 ? 0.055 : 0.07;
      pGain.gain.setValueAtTime(0.0001, time);
      pGain.gain.linearRampToValueAtTime(pVol, time + 0.008);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      pOsc.connect(pFilter);
      pFilter.connect(pGain);

      if (panner) {
        pGain.connect(panner);
        panner.connect(destination);
        panner.connect(reverbSend);
      } else {
        pGain.connect(destination);
        pGain.connect(reverbSend);
      }

      pOsc.start(time);
      pOsc.stop(time + 0.24);
      this.trackActiveNode(pOsc, undefined, pGain);
    }

    // -------------------------------------------------------------
    // 3. 아날로그 신스 베이스 (Analog Synth Bass with Sub)
    // -------------------------------------------------------------
    if (part >= 1 && step % 2 === 0) {
      const synthBassMap: Record<number, number> = {
        0: 65.41, // C2
        1: 82.41, // E2
        2: 55.0, // A1
        3: 43.65, // F1
      };
      const sbFreq = safeGet(synthBassMap, chordIndex, 65.41);

      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sGain.gain.value = 0;
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(sbFreq, time);

      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(part === 2 ? 550 : 380, time);

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.13, time + 0.012);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      sOsc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);

      sOsc.start(time);
      sOsc.stop(time + 0.18);
      this.trackActiveNode(sOsc, undefined, sGain);
    }

    // -------------------------------------------------------------
    // 4. 따뜻한 산림 신스 패드 (Warm Atmospheric Mountain Pad with Reverb)
    // -------------------------------------------------------------
    if (part >= 1 && localStep % 16 === 0) {
      const padChords: Record<number, number[]> = {
        0: [130.81, 164.81, 196.0, 246.94], // Cmaj7 pad
        1: [123.47, 164.81, 196.0, 246.94], // Em7 pad
        2: [110.0, 130.81, 164.81, 196.0], // Am7 pad
        3: [87.31, 130.81, 174.61, 220.0], // Fmaj7 pad
      };
      const padNotes = safeGet(padChords, chordIndex, padChords[0]);

      padNotes.forEach((pFreq) => {
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();

        padGain.gain.value = 0;
        padOsc.type = 'sawtooth';
        padOsc.frequency.setValueAtTime(pFreq, time);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(450, time);
        padFilter.frequency.linearRampToValueAtTime(700, time + 0.8);
        padFilter.frequency.linearRampToValueAtTime(350, time + 1.8);

        padGain.gain.setValueAtTime(0.0001, time);
        padGain.gain.linearRampToValueAtTime(0.032, time + 0.3);
        padGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(destination);
        padGain.connect(reverbSend);

        padOsc.start(time);
        padOsc.stop(time + 2.0);
        this.trackActiveNode(padOsc, undefined, padGain);
      });
    }

    // -------------------------------------------------------------
    // 5. 고음 신스 리드 솔로 선율 (High-Octave Celeste Soaring Lead)
    // -------------------------------------------------------------
    if (part === 1 || part === 2) {
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
        64: 783.99,
        68: 880.0,
        72: 1046.5,
        76: 1174.66,
        80: 1318.51,
        84: 1174.66,
        88: 1046.5,
        92: 880.0,
        96: 987.77,
        100: 880.0,
        104: 783.99,
        108: 659.25,
        112: 523.25,
        116: 659.25,
        120: 783.99,
        124: 1046.5,
      };
      const lFreq = safeGet(leadMelody, localStep, 0);
      if (lFreq) {
        const lOsc = ctx.createOscillator();
        const lGain = ctx.createGain();
        const lFilter = ctx.createBiquadFilter();
        const lPanner = this.createPanner(ctx, 0.18); // 우측 18% 정위

        lGain.gain.value = 0;
        lOsc.type = 'sawtooth';
        lOsc.frequency.setValueAtTime(lFreq, time);

        lFilter.type = 'lowpass';
        lFilter.frequency.setValueAtTime(900, time);
        lFilter.frequency.linearRampToValueAtTime(1800, time + 0.18);
        lFilter.frequency.linearRampToValueAtTime(650, time + 0.42);

        lGain.gain.setValueAtTime(0.0001, time);
        lGain.gain.linearRampToValueAtTime(0.058, time + 0.035);
        lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

        lOsc.connect(lFilter);
        lFilter.connect(lGain);

        if (lPanner) {
          lGain.connect(lPanner);
          lPanner.connect(destination);
          lPanner.connect(reverbSend);
        } else {
          lGain.connect(destination);
          lGain.connect(reverbSend);
        }

        lOsc.start(time);
        lOsc.stop(time + 0.48);
        this.trackActiveNode(lOsc, undefined, lGain);
      }
    }
  }

  // =========================================================================
  // ⭐ [트랙 3번 심층 마스터] 🧗‍♂️ 클라이머 펄스 (Climber Pulse / 라스트 스퍼트 - 124 BPM 384 Steps / ~46.5초)
  // 장르: 사이버펑크 퓨처 신스웨이브 (16비트 모듈러 베이스, 슈퍼쏘우 스탭, 오버드라이브 리드 솔로)
  // =========================================================================
  private scheduleClimbStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96); // 0: Ignition, 1: Acceleration, 2: Overdrive Climax, 3: Breakdown Drop
    const localStep = step % 96;
    const bar = Math.floor(localStep / 16); // 0~5 마디
    const chordIndex = bar % 4; // 0: Am, 1: F, 2: C, 3: G

    // -------------------------------------------------------------
    // 1. 일렉트로닉 파워 드럼 키트 (Electronic Power Drums)
    // -------------------------------------------------------------
    // (1) 4-on-the-Floor 파워 킥 (Part 3 빌드업 시 8비트 가속)
    const isFastBuild = part === 3 && localStep >= 64;
    const isKick = isFastBuild ? step % 2 === 0 : step % 4 === 0;

    if (isKick) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, time);
      kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.05);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(part === 2 ? 0.17 : 0.14, time + 0.003);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.058);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.065);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) 파워풀 노이즈 스네어 (Part 1, 2, 3의 2, 4박)
    if (part >= 1 && step % 8 === 4) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const sSource = ctx.createBufferSource();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();

        sSource.buffer = noiseBuf;
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(3200, time);
        sFilter.Q.value = 1.5;

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.06, time + 0.004);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);

        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(destination);
        sGain.connect(reverbSend);

        sSource.start(time);
        sSource.stop(time + 0.08);
        this.trackActiveNode(undefined, sSource, sGain);
      }
    }

    // (3) 16비트 사이버 하이햇 롤 (Part 1, 2, 3 전용)
    if (part >= 1 && step % 2 === 0) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const hSource = ctx.createBufferSource();
        const hGain = ctx.createGain();
        const hFilter = ctx.createBiquadFilter();
        const hPanner = this.createPanner(ctx, -0.2);

        hSource.buffer = noiseBuf;
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(8000, time);

        hGain.gain.setValueAtTime(0.0001, time);
        hGain.gain.linearRampToValueAtTime(0.03, time + 0.002);
        hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

        hSource.connect(hFilter);
        hFilter.connect(hGain);

        if (hPanner) {
          hGain.connect(hPanner);
          hPanner.connect(destination);
          hPanner.connect(reverbSend);
        } else {
          hGain.connect(destination);
          hGain.connect(reverbSend);
        }

        hSource.start(time);
        hSource.stop(time + 0.035);
        this.trackActiveNode(undefined, hSource, hGain);
      }
    }

    // -------------------------------------------------------------
    // 2. 16비트 롤링 모듈러 신스 베이스 (Rolling Modular Synth Bass)
    // -------------------------------------------------------------
    const bassMap: Record<number, number[]> = {
      0: [55.0, 110.0, 55.0, 110.0, 82.41, 110.0, 55.0, 110.0], // Am (A1-A2)
      1: [43.65, 87.31, 43.65, 87.31, 65.41, 87.31, 43.65, 87.31], // F (F1-F2)
      2: [65.41, 130.81, 65.41, 130.81, 98.0, 130.81, 65.41, 130.81], // C (C2-C3)
      3: [49.0, 98.0, 49.0, 98.0, 73.42, 98.0, 49.0, 98.0], // G (G1-G2)
    };
    const currentBassNotes = safeGet(bassMap, chordIndex, bassMap[0]);
    const bassNote = safeGet(currentBassNotes, Math.floor((localStep % 16) / 2), 0);

    if (step % 2 === 0 && bassNote) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bassNote, time);

      bFilter.type = 'lowpass';
      // Part 3 브레이크다운 시 필터가 닫힘
      const filterFreq =
        part === 3 ? Math.max(250, 600 - (localStep / 96) * 350) : part === 2 ? 650 : 420;
      bFilter.frequency.setValueAtTime(filterFreq, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.13, time + 0.008);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.16);
      this.trackActiveNode(bOsc, undefined, bGain);
    }

    // -------------------------------------------------------------
    // 3. 슈퍼쏘우 브라스 스탭 (Supersaw Brass Stabs with Reverb)
    // -------------------------------------------------------------
    const isStab = step % 16 === 6 || step % 16 === 12;
    if (isStab && part >= 1) {
      const stabChords: Record<number, number[]> = {
        0: [220.0, 261.63, 329.63, 440.0], // Am
        1: [174.61, 220.0, 261.63, 349.23], // F
        2: [261.63, 329.63, 392.0, 523.25], // C
        3: [196.0, 246.94, 293.66, 392.0], // G
      };
      const chordNotes = safeGet(stabChords, chordIndex, stabChords[0]);

      chordNotes.forEach((cFreq) => {
        const sOsc = ctx.createOscillator();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();
        const sPanner = this.createPanner(ctx, -0.25);

        sGain.gain.value = 0;
        sOsc.type = 'sawtooth';
        sOsc.frequency.setValueAtTime(cFreq, time);

        sFilter.type = 'lowpass';
        sFilter.frequency.setValueAtTime(1400, time);
        sFilter.frequency.exponentialRampToValueAtTime(500, time + 0.18);

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.048, time + 0.012);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.19);

        sOsc.connect(sFilter);
        sFilter.connect(sGain);

        if (sPanner) {
          sGain.connect(sPanner);
          sPanner.connect(destination);
          sPanner.connect(reverbSend);
        } else {
          sGain.connect(destination);
          sGain.connect(reverbSend);
        }

        sOsc.start(time);
        sOsc.stop(time + 0.2);
        this.trackActiveNode(sOsc, undefined, sGain);
      });
    }

    // -------------------------------------------------------------
    // 4. 질주하는 16비트 아르페지오 & 오버드라이브 리드 솔로
    // -------------------------------------------------------------
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
    const currentArpPattern = safeGet(arpPatterns, chordIndex, arpPatterns[0]);
    const arpFreq = safeGet(currentArpPattern, localStep % 16, 0);

    if (arpFreq) {
      const aOsc = ctx.createOscillator();
      const aGain = ctx.createGain();
      const aFilter = ctx.createBiquadFilter();
      const aPanner = this.createPanner(ctx, 0.2);

      aGain.gain.value = 0;
      aOsc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
      aOsc.frequency.setValueAtTime(arpFreq, time);

      aFilter.type = 'lowpass';
      aFilter.frequency.setValueAtTime(1500, time);
      aFilter.frequency.linearRampToValueAtTime(600, time + 0.1);

      aGain.gain.setValueAtTime(0.0001, time);
      aGain.gain.linearRampToValueAtTime(part === 2 ? 0.07 : 0.055, time + 0.006);
      aGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

      aOsc.connect(aFilter);
      aFilter.connect(aGain);

      if (aPanner) {
        aGain.connect(aPanner);
        aPanner.connect(destination);
        aPanner.connect(reverbSend);
      } else {
        aGain.connect(destination);
        aGain.connect(reverbSend);
      }

      aOsc.start(time);
      aOsc.stop(time + 0.12);
      this.trackActiveNode(aOsc, undefined, aGain);
    }
  }

  // =========================================================================
  // ⭐ [트랙 4번 심층 마스터] 🏪 산악 만물상 (Cozy Outfitter Shop - 102 BPM 384 Steps / ~56.4초)
  // 장르: 어쿠스틱 나일론 기타 보사노바 + 멜로디카 + 찰랑거리는 셰이커 & 우드블록 퍼커션
  // =========================================================================
  private scheduleShopStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96); // 0: Cozy Welcome, 1: Browsing, 2: Melodica Solo, 3: Warm Resolution
    const localStep = step % 96;
    const bar = Math.floor(localStep / 16); // 0~5 마디
    const chordIndex = bar % 4;

    // -------------------------------------------------------------
    // 1. 보사노바 어쿠스틱 퍼커션 (Soft Kick, Shaker, Woodblock Clave)
    // -------------------------------------------------------------
    // (1) 부드러운 펠트 킥 (1박 & 3박 당김음)
    if (localStep % 16 === 0 || localStep % 16 === 10) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(85, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.06);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(0.09, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.075);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) 노이즈 버퍼 기반 찰랑거리는 16비트 보사노바 셰이커 (Shaker Tap)
    const noiseBuf = this.getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const shSource = ctx.createBufferSource();
      const shGain = ctx.createGain();
      const shFilter = ctx.createBiquadFilter();
      const shPanner = this.createPanner(ctx, 0.25); // 우측 25% 셰이커 정위

      shSource.buffer = noiseBuf;
      shFilter.type = 'bandpass';
      shFilter.frequency.setValueAtTime(6200, time);
      shFilter.Q.value = 2.0;

      // 16비트 스텝별 미세 강약 (Accents on upbeat)
      const isAccent = localStep % 4 === 2;
      const shVol = isAccent ? 0.026 : 0.015;

      shGain.gain.setValueAtTime(0.0001, time);
      shGain.gain.linearRampToValueAtTime(shVol, time + 0.002);
      shGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

      shSource.connect(shFilter);
      shFilter.connect(shGain);

      if (shPanner) {
        shGain.connect(shPanner);
        shPanner.connect(destination);
        shPanner.connect(reverbSend);
      } else {
        shGain.connect(destination);
        shGain.connect(reverbSend);
      }

      shSource.start(time);
      shSource.stop(time + 0.03);
      this.trackActiveNode(undefined, shSource, shGain);
    }

    // (3) 우드블록 / 클라베 림샷 (Woodblock Rimshot on 4, 10, 14 steps)
    const isWoodblock = localStep % 16 === 4 || localStep % 16 === 10 || localStep % 16 === 14;
    if (isWoodblock) {
      const wbOsc = ctx.createOscillator();
      const wbGain = ctx.createGain();
      const wbFilter = ctx.createBiquadFilter();
      const wbPanner = this.createPanner(ctx, -0.2);

      wbGain.gain.value = 0;
      wbOsc.type = 'triangle';
      wbOsc.frequency.setValueAtTime(localStep % 16 === 4 ? 850 : 1020, time);

      wbFilter.type = 'bandpass';
      wbFilter.frequency.setValueAtTime(2400, time);
      wbFilter.Q.value = 3.5;

      wbGain.gain.setValueAtTime(0.0001, time);
      wbGain.gain.linearRampToValueAtTime(0.045, time + 0.003);
      wbGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      wbOsc.connect(wbFilter);
      wbFilter.connect(wbGain);

      if (wbPanner) {
        wbGain.connect(wbPanner);
        wbPanner.connect(destination);
        wbPanner.connect(reverbSend);
      } else {
        wbGain.connect(destination);
        wbGain.connect(reverbSend);
      }

      wbOsc.start(time);
      wbOsc.stop(time + 0.04);
      this.trackActiveNode(wbOsc, undefined, wbGain);
    }

    // (4) 맑은 샵 카운터 벨 (Shop Counter Bell on bar 0)
    if (localStep === 0 && (part === 0 || part === 2)) {
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      const bellFilter = ctx.createBiquadFilter();

      bellGain.gain.value = 0;
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(2093.0, time); // C7

      bellFilter.type = 'highpass';
      bellFilter.frequency.setValueAtTime(1800, time);

      bellGain.gain.setValueAtTime(0.0001, time);
      bellGain.gain.linearRampToValueAtTime(0.035, time + 0.004);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

      bellOsc.connect(bellFilter);
      bellFilter.connect(bellGain);
      bellGain.connect(destination);
      bellGain.connect(reverbSend);

      bellOsc.start(time);
      bellOsc.stop(time + 0.45);
      this.trackActiveNode(bellOsc, undefined, bellGain);
    }

    // -------------------------------------------------------------
    // 2. 어쿠스틱 콘트라베이스 (Upright Bossa Bass)
    // -------------------------------------------------------------
    const bossaBassPatterns: Record<number, number[]> = {
      0: [87.31, 0, 0, 0, 0, 0, 130.81, 0, 0, 0, 87.31, 0, 0, 0, 130.81, 0], // Fmaj7 (F1, C2)
      1: [73.42, 0, 0, 0, 0, 0, 110.0, 0, 0, 0, 73.42, 0, 0, 0, 110.0, 0], // Dm9 (D1, A1)
      2: [98.0, 0, 0, 0, 0, 0, 146.83, 0, 0, 0, 98.0, 0, 0, 0, 146.83, 0], // Gm7 (G1, D2)
      3: [65.41, 0, 0, 0, 0, 0, 98.0, 0, 0, 0, 65.41, 0, 0, 0, 123.47, 0], // C13(b9) (C1, G1, B1)
    };
    const currentBassPattern = safeGet(bossaBassPatterns, chordIndex, bossaBassPatterns[0]);
    const bFreq = safeGet(currentBassPattern, localStep % 16, 0);

    if (bFreq) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(260, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.12, time + 0.015);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.3);
      this.trackActiveNode(bOsc, undefined, bGain);
    }

    // -------------------------------------------------------------
    // 3. 어쿠스틱 나일론 기타 (Nylon Acoustic Fingerstyle Guitar with Reverb)
    // -------------------------------------------------------------
    const isStrum =
      localStep % 16 === 0 ||
      localStep % 16 === 3 ||
      localStep % 16 === 6 ||
      localStep % 16 === 10 ||
      localStep % 16 === 12;

    if (isStrum) {
      const shopChords: Record<number, number[]> = {
        0: [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        1: [146.83, 220.0, 261.63, 329.63], // Dm9 (D3, A3, C4, E4)
        2: [196.0, 220.0, 261.63, 349.23], // Gm7 (G3, Bb3, D4, F4)
        3: [164.81, 220.0, 261.63, 329.63], // C13 (E3, A3, C4, E4)
      };
      const chordNotes = safeGet(shopChords, chordIndex, shopChords[0]);

      chordNotes.forEach((cFreq, cIdx) => {
        const gOsc = ctx.createOscillator();
        const gGain = ctx.createGain();
        const gFilter = ctx.createBiquadFilter();
        const gPanner = this.createPanner(ctx, -0.25); // 좌측 25% 나일론 기타 정위

        gGain.gain.value = 0;
        gOsc.type = 'triangle';
        gOsc.frequency.setValueAtTime(cFreq, time);

        gFilter.type = 'lowpass';
        gFilter.frequency.setValueAtTime(1250, time);
        gFilter.frequency.exponentialRampToValueAtTime(600, time + 0.18);

        const gVol = cIdx === 0 ? 0.048 : 0.035;
        gGain.gain.setValueAtTime(0.0001, time);
        gGain.gain.linearRampToValueAtTime(gVol, time + 0.008);
        gGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

        gOsc.connect(gFilter);
        gFilter.connect(gGain);

        if (gPanner) {
          gGain.connect(gPanner);
          gPanner.connect(destination);
          gPanner.connect(reverbSend);
        } else {
          gGain.connect(destination);
          gGain.connect(reverbSend);
        }

        gOsc.start(time);
        gOsc.stop(time + 0.22);
        this.trackActiveNode(gOsc, undefined, gGain);
      });
    }

    // -------------------------------------------------------------
    // 4. 감미로운 멜로디카 & 아코디언 솔로 선율 (Melodica Lead with Reverb)
    // -------------------------------------------------------------
    if (part >= 1) {
      const melodicaLead: Record<number, number> = {
        0: 659.25,
        4: 698.46,
        8: 783.99,
        12: 880.0,
        16: 1046.5,
        20: 880.0,
        24: 783.99,
        28: 698.46,
        32: 659.25,
        36: 587.33,
        40: 523.25,
        44: 587.33,
        48: 659.25,
        52: 783.99,
        56: 880.0,
        60: 1046.5,
        64: 987.77,
        68: 880.0,
        72: 783.99,
        76: 698.46,
        80: 659.25,
        84: 587.33,
        88: 523.25,
        92: 440.0,
      };
      const mFreq = safeGet(melodicaLead, localStep, 0);

      if (mFreq) {
        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        const mFilter = ctx.createBiquadFilter();
        const mPanner = this.createPanner(ctx, 0.22); // 우측 22% 멜로디카 정위

        mGain.gain.value = 0;
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(mFreq, time);

        mFilter.type = 'lowpass';
        mFilter.frequency.setValueAtTime(1400, time);
        mFilter.frequency.exponentialRampToValueAtTime(750, time + 0.3);

        mGain.gain.setValueAtTime(0.0001, time);
        mGain.gain.linearRampToValueAtTime(0.065, time + 0.015);
        mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

        mOsc.connect(mFilter);
        mFilter.connect(mGain);

        if (mPanner) {
          mGain.connect(mPanner);
          mPanner.connect(destination);
          mPanner.connect(reverbSend);
        } else {
          mGain.connect(destination);
          mGain.connect(reverbSend);
        }

        mOsc.start(time);
        mOsc.stop(time + 0.35);
        this.trackActiveNode(mOsc, undefined, mGain);
      }
    }
  }

  // =========================================================================
  // 테마 5: 🏆 정상 정복 & 승리 찬가 (Summit Victory - 100 BPM 384 Steps)
  // =========================================================================
  // =========================================================================
  // ⭐ [트랙 5번 심층 마스터] 🏆 정상 정복 & 승리 찬가 (Summit Victory - 108 BPM 384 Steps / ~53.3초)
  // 장르: 웅장한 오케스트라 브라스 신스 팡파르 + 천상의 하프 글리산도 + 마칭 스네어
  // =========================================================================
  private scheduleVictoryStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96); // 0: Grand Fanfare, 1: Trumpet Lead, 2: Summit Climax, 3: Vista Glory
    const localStep = step % 96;
    const bar = Math.floor(localStep / 16); // 0~5 마디
    const chordIndex = bar % 4;

    // -------------------------------------------------------------
    // 1. 오케스트라 마칭 퍼커션 (Timpani Kick, Marching Snare, Cymbal)
    // -------------------------------------------------------------
    // (1) 웅장한 팀파니 킥 (1박 & 3박)
    if (localStep % 8 === 0) {
      const isDownbeat = localStep % 16 === 0;
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(isDownbeat ? 105 : 90, time);
      kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(isDownbeat ? 0.16 : 0.11, time + 0.005);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.1);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) 노이즈 버퍼 기반 군악대 마칭 스네어 (Marching Snare Roll)
    const isSnare =
      localStep % 4 === 2 || localStep % 8 === 4 || (part === 2 && localStep % 2 === 1);
    if (isSnare) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const sSource = ctx.createBufferSource();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();

        sSource.buffer = noiseBuf;
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(3000, time);
        sFilter.Q.value = 1.3;

        const sVol = localStep % 8 === 4 ? 0.055 : 0.035;
        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(sVol, time + 0.003);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(destination);
        sGain.connect(reverbSend);

        sSource.start(time);
        sSource.stop(time + 0.065);
        this.trackActiveNode(undefined, sSource, sGain);
      }
    }

    // (3) 승리의 심벌 크래쉬 (Crash Cymbal on bar 0)
    if (localStep === 0) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const cSource = ctx.createBufferSource();
        const cGain = ctx.createGain();
        const cFilter = ctx.createBiquadFilter();
        const cPanner = this.createPanner(ctx, 0.3);

        cSource.buffer = noiseBuf;
        cFilter.type = 'highpass';
        cFilter.frequency.setValueAtTime(5500, time);

        cGain.gain.setValueAtTime(0.0001, time);
        cGain.gain.linearRampToValueAtTime(0.06, time + 0.005);
        cGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

        cSource.connect(cFilter);
        cFilter.connect(cGain);

        if (cPanner) {
          cGain.connect(cPanner);
          cPanner.connect(destination);
          cPanner.connect(reverbSend);
        } else {
          cGain.connect(destination);
          cGain.connect(reverbSend);
        }

        cSource.start(time);
        cSource.stop(time + 0.45);
        this.trackActiveNode(undefined, cSource, cGain);
      }
    }

    // -------------------------------------------------------------
    // 2. 웅장한 브라스 신스 팡파르 화음 (Majestic Brass Fanfare)
    // -------------------------------------------------------------
    if (localStep % 16 === 0 || (part === 2 && localStep % 16 === 8)) {
      const victoryChords: Record<number, number[]> = {
        0: [174.61, 220.0, 261.63, 329.63, 440.0], // Fmaj7 (F, A, C, E, A)
        1: [196.0, 246.94, 293.66, 349.23, 392.0], // G7 (G, B, D, F, G)
        2: [164.81, 196.0, 246.94, 329.63, 392.0], // Em7 (E, G, B, E, G)
        3: [130.81, 196.0, 261.63, 329.63, 523.25], // Cmaj7 (C, G, C, E, C)
      };
      const chord = safeGet(victoryChords, chordIndex, victoryChords[0]);

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const panner = this.createPanner(ctx, i % 2 === 0 ? -0.2 : 0.2);

        gain.gain.value = 0;
        osc.type = i === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, time);
        filter.frequency.linearRampToValueAtTime(1600, time + 0.4);
        filter.frequency.linearRampToValueAtTime(650, time + 1.8);

        const vol = i === 0 ? 0.1 : 0.042;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

        osc.connect(filter);
        filter.connect(gain);

        if (panner) {
          gain.connect(panner);
          panner.connect(destination);
          panner.connect(reverbSend);
        } else {
          gain.connect(destination);
          gain.connect(reverbSend);
        }

        osc.start(time);
        osc.stop(time + 2.0);
        this.trackActiveNode(osc, undefined, gain);
      });
    }

    // -------------------------------------------------------------
    // 3. 천상의 하프 글리산도 & 벨 차임 (Heavenly Harp Glissando)
    // -------------------------------------------------------------
    const arpSeq = [
      523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 880.0, 1174.66, 659.25, 783.99, 987.77,
      1318.51, 783.99, 1046.5, 1318.51, 1567.98,
    ];
    const harpFreq = safeGet(arpSeq, localStep % 16, 0);

    if (harpFreq) {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();
      // 하프 현이 좌우로 번갈아 튕겨나가는 입체 패닝
      const panVal = localStep % 2 === 0 ? -0.32 : 0.32;
      const hPanner = this.createPanner(ctx, panVal);

      hGain.gain.value = 0;
      hOsc.type = 'sine';
      hOsc.frequency.setValueAtTime(harpFreq, time);

      hFilter.type = 'lowpass';
      hFilter.frequency.setValueAtTime(2200, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.048, time + 0.008);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

      hOsc.connect(hFilter);
      hFilter.connect(hGain);

      if (hPanner) {
        hGain.connect(hPanner);
        hPanner.connect(destination);
        hPanner.connect(reverbSend);
      } else {
        hGain.connect(destination);
        hGain.connect(reverbSend);
      }

      hOsc.start(time);
      hOsc.stop(time + 0.35);
      this.trackActiveNode(hOsc, undefined, hGain);
    }

    // -------------------------------------------------------------
    // 4. 승리의 트럼펫 리드 솔로 선율 (Triumphant Trumpet Lead with Reverb)
    // -------------------------------------------------------------
    if (part === 1 || part === 2) {
      const trumpetLead: Record<number, number> = {
        0: 523.25,
        4: 659.25,
        8: 783.99,
        12: 1046.5,
        16: 987.77,
        20: 880.0,
        24: 783.99,
        28: 659.25,
        32: 587.33,
        36: 783.99,
        40: 880.0,
        44: 1174.66,
        48: 1046.5,
        52: 987.77,
        56: 880.0,
        60: 783.99,
        64: 659.25,
        68: 783.99,
        72: 880.0,
        76: 1046.5,
        80: 1318.51,
        84: 1174.66,
        88: 1046.5,
        92: 1318.51,
      };
      const tFreq = safeGet(trumpetLead, localStep, 0);

      if (tFreq) {
        const tOsc = ctx.createOscillator();
        const tGain = ctx.createGain();
        const tFilter = ctx.createBiquadFilter();
        const tPanner = this.createPanner(ctx, 0.15); // 중앙 우측 트럼펫 정위

        tGain.gain.value = 0;
        tOsc.type = 'sawtooth';
        tOsc.frequency.setValueAtTime(tFreq, time);

        tFilter.type = 'lowpass';
        tFilter.frequency.setValueAtTime(1100, time);
        tFilter.frequency.linearRampToValueAtTime(2200, time + 0.15);
        tFilter.frequency.linearRampToValueAtTime(850, time + 0.4);

        tGain.gain.setValueAtTime(0.0001, time);
        tGain.gain.linearRampToValueAtTime(0.065, time + 0.02);
        tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

        tOsc.connect(tFilter);
        tFilter.connect(tGain);

        if (tPanner) {
          tGain.connect(tPanner);
          tPanner.connect(destination);
          tPanner.connect(reverbSend);
        } else {
          tGain.connect(destination);
          tGain.connect(reverbSend);
        }

        tOsc.start(time);
        tOsc.stop(time + 0.45);
        this.trackActiveNode(tOsc, undefined, tGain);
      }
    }
  }

  // =========================================================================
  // ⭐ [트랙 6번 심층 마스터] 💓 스태미나 위기 / 라스트 찬스 (Crisis Heartbeat - 132 BPM 448 Steps / ~50.9초)
  // 장르: 심장박동 서브 펄스 + 16비트 시계추 째깍거림 + 크로매틱 긴장 드론 + 비상 경보 사이렌
  // =========================================================================
  private scheduleCrisisStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 112); // 0: Ticking Heartbeat, 1: Chromatic Pulse, 2: Emergency Siren, 3: Final Countdown
    const localStep = step % 112;
    const bar = Math.floor(localStep / 16); // 0~6 마디

    // -------------------------------------------------------------
    // 1. 쿵-쾅 더블 심장박동 서브 펄스 (LUB-DUB Heartbeat Pulse)
    // -------------------------------------------------------------
    // Part 3 카운트다운 시 4스텝마다 가속, 평상시 8스텝마다 LUB-DUB
    const isDoubleFast = part === 3 && localStep >= 64;
    const isFirstBeat = isDoubleFast ? step % 4 === 0 : step % 8 === 0;
    const isSecondBeat = isDoubleFast ? step % 4 === 1 : step % 8 === 2;

    if (isFirstBeat || isSecondBeat) {
      // (1) 메인 심장박동 트라이앵글 펀치
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();

      hGain.gain.value = 0;
      hOsc.type = 'triangle';
      const startFreq = isFirstBeat ? 160 : 130;
      const endFreq = isFirstBeat ? 52 : 44;
      hOsc.frequency.setValueAtTime(startFreq, time);
      hOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.11);

      hFilter.type = 'lowpass';
      hFilter.frequency.setValueAtTime(420, time);

      const hVol = isFirstBeat ? 0.3 : 0.2;
      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(hVol, time + 0.008);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);

      hOsc.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(destination);

      hOsc.start(time);
      hOsc.stop(time + 0.15);
      this.trackActiveNode(hOsc, undefined, hGain);

      // (2) 가슴을 울리는 40Hz 서브 베이스 펄스
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subGain.gain.value = 0;
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(isFirstBeat ? 80 : 65, time);
      subOsc.frequency.exponentialRampToValueAtTime(36, time + 0.14);

      subGain.gain.setValueAtTime(0.0001, time);
      subGain.gain.linearRampToValueAtTime(isFirstBeat ? 0.24 : 0.15, time + 0.012);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);

      subOsc.connect(subGain);
      subGain.connect(destination);

      subOsc.start(time);
      subOsc.stop(time + 0.19);
      this.trackActiveNode(subOsc, undefined, subGain);
    }

    // -------------------------------------------------------------
    // 2. 16비트 초침 째깍거림 (Ticking Clock Percussion)
    // -------------------------------------------------------------
    const noiseBuf = this.getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const tSource = ctx.createBufferSource();
      const tGain = ctx.createGain();
      const tFilter = ctx.createBiquadFilter();
      // 초침이 좌우로 번갈아 째깍거리는 긴장감 연출
      const panVal = step % 2 === 0 ? -0.22 : 0.22;
      const tPanner = this.createPanner(ctx, panVal);

      tSource.buffer = noiseBuf;
      tFilter.type = 'bandpass';
      tFilter.frequency.setValueAtTime(4500, time);
      tFilter.Q.value = 3.5;

      const tVol = step % 4 === 0 ? 0.045 : 0.028;
      tGain.gain.setValueAtTime(0.0001, time);
      tGain.gain.linearRampToValueAtTime(tVol, time + 0.002);
      tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

      tSource.connect(tFilter);
      tFilter.connect(tGain);

      if (tPanner) {
        tGain.connect(tPanner);
        tPanner.connect(destination);
        tPanner.connect(reverbSend);
      } else {
        tGain.connect(destination);
        tGain.connect(reverbSend);
      }

      tSource.start(time);
      tSource.stop(time + 0.03);
      this.trackActiveNode(undefined, tSource, tGain);
    }

    // -------------------------------------------------------------
    // 3. 크로매틱 반음 하강 텐션 드론 패드 (Chromatic Tension Drone)
    // -------------------------------------------------------------
    if (step % 16 === 0) {
      const tensionChords: Record<number, number[]> = {
        0: [146.83, 174.61, 220.0, 293.66], // Dm (D, F, A, D)
        1: [138.59, 174.61, 207.65, 277.18], // C#dim (C#, F, G#, C#)
        2: [130.81, 164.81, 196.0, 261.63], // C (C, E, G, C)
        3: [123.47, 155.56, 185.0, 246.94], // Bdim (B, Eb, F#, B)
      };
      const currentChord = safeGet(tensionChords, bar % 4, tensionChords[0]);

      currentChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        gain.gain.value = 0;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        // Part 3 카운트다운 시 필터가 점점 닫힘
        const fCutoff = part === 3 ? 320 : 550;
        filter.frequency.setValueAtTime(fCutoff, time);
        filter.frequency.linearRampToValueAtTime(fCutoff * 0.7, time + 1.6);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.08 : 0.045, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        gain.connect(reverbSend);

        osc.start(time);
        osc.stop(time + 1.75);
        this.trackActiveNode(osc, undefined, gain);
      });
    }

    // -------------------------------------------------------------
    // 4. 비상 경보 사이렌 신스 솔로 (Emergency Alarm Synth)
    // -------------------------------------------------------------
    if (part === 1 || part === 2) {
      const isSirenStep = localStep % 8 === 0 || localStep % 8 === 4;
      if (isSirenStep) {
        const sOsc = ctx.createOscillator();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();
        const sPanner = this.createPanner(ctx, -0.28); // 좌측 28% 경보 사이렌 정위

        sGain.gain.value = 0;
        sOsc.type = 'sawtooth';
        const sirenFreq = localStep % 8 === 0 ? 880.0 : 1174.66; // A5 / D6
        sOsc.frequency.setValueAtTime(sirenFreq, time);
        sOsc.frequency.linearRampToValueAtTime(sirenFreq * 1.05, time + 0.15);

        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(1800, time);
        sFilter.Q.value = 2.0;

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.052, time + 0.015);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

        sOsc.connect(sFilter);
        sFilter.connect(sGain);

        if (sPanner) {
          sGain.connect(sPanner);
          sPanner.connect(destination);
          sPanner.connect(reverbSend);
        } else {
          sGain.connect(destination);
          sGain.connect(reverbSend);
        }

        sOsc.start(time);
        sOsc.stop(time + 0.3);
        this.trackActiveNode(sOsc, undefined, sGain);
      }
    }
  }

  // =========================================================================
  // ⭐ [트랙 8번 심층 마스터] 🏔️ 산악 앰비언트 (Mountain Chill - 64초 32주기 힐링 싱잉볼 앰비언트)
  // 장르: 티베탄 싱잉볼 공명 + 산림욕 산들바람 + 크리스탈 윈드차임 + 오가닉 드론
  // =========================================================================
  private scheduleChillStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    chordIndex: number
  ): void {
    const chords = [
      [130.81, 196.0, 246.94, 329.63], // Cmaj7(#11)
      [110.0, 164.81, 196.0, 261.63], // Em9
      [87.31, 130.81, 174.61, 220.0], // Fmaj7
      [98.0, 146.83, 196.0, 293.66], // Gsus4
      [82.41, 123.47, 196.0, 246.94], // Em7
      [87.31, 130.81, 220.0, 329.63], // Am9
      [73.42, 110.0, 174.61, 261.63], // Dm9
      [98.0, 146.83, 246.94, 349.23], // G13sus4 -> Cmaj9
    ];

    const currentChordIndex = chordIndex % 8;
    const chord = safeGet(chords, currentChordIndex, chords[0]);
    const duration = 2.8;
    const attack = 0.7;

    // -------------------------------------------------------------
    // 1. 산림욕 산들바람 노이즈 텍스처 (Gentle Forest Breeze)
    // -------------------------------------------------------------
    const noiseBuf = this.getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const wSource = ctx.createBufferSource();
      const wGain = ctx.createGain();
      const wFilter = ctx.createBiquadFilter();

      wSource.buffer = noiseBuf;
      wFilter.type = 'bandpass';
      wFilter.frequency.setValueAtTime(220, time);
      wFilter.frequency.linearRampToValueAtTime(320, time + 1.2);
      wFilter.frequency.linearRampToValueAtTime(180, time + duration);
      wFilter.Q.value = 0.8;

      wGain.gain.setValueAtTime(0.0001, time);
      wGain.gain.linearRampToValueAtTime(0.022, time + attack);
      wGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      wSource.connect(wFilter);
      wFilter.connect(wGain);
      wGain.connect(destination);
      wGain.connect(reverbSend);

      wSource.start(time);
      wSource.stop(time + duration + 0.05);
      this.trackActiveNode(undefined, wSource, wGain);
    }

    // -------------------------------------------------------------
    // 2. 오가닉 웜 앰비언트 화음 패드 (Warm Healing Pad with Reverb)
    // -------------------------------------------------------------
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = this.createPanner(ctx, i % 2 === 0 ? -0.25 : 0.25);

      gain.gain.value = 0;
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, time);
      filter.frequency.linearRampToValueAtTime(580, time + attack);
      filter.frequency.linearRampToValueAtTime(360, time + duration);

      const noteVol = i === 0 ? 0.11 : 0.065;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(noteVol, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);

      if (panner) {
        gain.connect(panner);
        panner.connect(destination);
        panner.connect(reverbSend);
      } else {
        gain.connect(destination);
        gain.connect(reverbSend);
      }

      osc.start(time);
      osc.stop(time + duration + 0.05);
      this.trackActiveNode(osc, undefined, gain);
    });

    // -------------------------------------------------------------
    // 3. 티베탄 싱잉볼 공명 (Tibetan Singing Bowl Resonance with Harmonics)
    // -------------------------------------------------------------
    // 4스텝(8초)마다 맑은 싱잉볼 타격 발생
    if (chordIndex % 4 === 0) {
      const baseFreq = chord[0] * 2; // 옥타브 업 싱잉볼
      // 실제 싱잉볼 배음 구조: 근음(f0), 1차 배음(2.76*f0), 2차 배음(5.4*f0)
      const harmonics = [baseFreq, baseFreq * 2.76, baseFreq * 5.4];

      harmonics.forEach((hFreq, hIdx) => {
        const bowlOsc = ctx.createOscillator();
        const bowlGain = ctx.createGain();
        const bowlFilter = ctx.createBiquadFilter();
        // 배음별 좌/우 바이노럴 패닝
        const panVal = hIdx === 0 ? 0 : hIdx === 1 ? -0.32 : 0.32;
        const bPanner = this.createPanner(ctx, panVal);

        bowlGain.gain.value = 0;
        bowlOsc.type = 'sine';
        bowlOsc.frequency.setValueAtTime(hFreq, time);

        bowlFilter.type = 'lowpass';
        bowlFilter.frequency.setValueAtTime(1800, time);

        const bVol = hIdx === 0 ? 0.075 : hIdx === 1 ? 0.035 : 0.018;
        bowlGain.gain.setValueAtTime(0.0001, time);
        bowlGain.gain.linearRampToValueAtTime(bVol, time + 0.08);
        bowlGain.gain.exponentialRampToValueAtTime(0.0001, time + 3.6);

        bowlOsc.connect(bowlFilter);
        bowlFilter.connect(bowlGain);

        if (bPanner) {
          bowlGain.connect(bPanner);
          bPanner.connect(destination);
          bPanner.connect(reverbSend);
        } else {
          bowlGain.connect(destination);
          bowlGain.connect(reverbSend);
        }

        bowlOsc.start(time);
        bowlOsc.stop(time + 3.8);
        this.trackActiveNode(bowlOsc, undefined, bowlGain);
      });
    }

    // -------------------------------------------------------------
    // 4. 서정적인 명상 멜로디 (Serene Meditation Bell Chimes)
    // -------------------------------------------------------------
    if (chordIndex >= 4) {
      const melodyNotes = [
        [329.63, 392.0],
        [440.0, 523.25],
        [392.0, 349.23],
        [293.66, 261.63],
      ];
      const melodyPair = safeGet(melodyNotes, chordIndex % 4, [329.63, 392.0]);

      melodyPair.forEach((mFreq, mIdx) => {
        const mTime = time + 0.3 + mIdx * 0.9;
        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        const mFilter = ctx.createBiquadFilter();
        const mPanner = this.createPanner(ctx, 0.18);

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

        if (mPanner) {
          mGain.connect(mPanner);
          mPanner.connect(destination);
          mPanner.connect(reverbSend);
        } else {
          mGain.connect(destination);
          mGain.connect(reverbSend);
        }

        mOsc.start(mTime);
        mOsc.stop(mTime + 0.9);
        this.trackActiveNode(mOsc, undefined, mGain);
      });
    }

    // -------------------------------------------------------------
    // 5. 크리스탈 윈드차임 스파클 (Crystal Wind Chimes)
    // -------------------------------------------------------------
    const sparkles = [659.25, 523.25, 783.99, 587.33, 659.25, 880.0, 783.99, 1046.5];
    const sparkleFreq = safeGet(sparkles, chordIndex % 8, 659.25);
    const sparkleTime = time + 0.8;

    const spOsc = ctx.createOscillator();
    const spGain = ctx.createGain();
    const spPanner = this.createPanner(ctx, -0.22);
    spGain.gain.value = 0;
    spOsc.type = 'sine';
    spOsc.frequency.setValueAtTime(sparkleFreq, sparkleTime);

    spGain.gain.setValueAtTime(0.0001, sparkleTime);
    spGain.gain.linearRampToValueAtTime(0.038, sparkleTime + 0.3);
    spGain.gain.exponentialRampToValueAtTime(0.0001, sparkleTime + 1.2);

    if (spPanner) {
      spOsc.connect(spGain);
      spGain.connect(spPanner);
      spPanner.connect(destination);
      spPanner.connect(reverbSend);
    } else {
      spOsc.connect(spGain);
      spGain.connect(destination);
      spGain.connect(reverbSend);
    }

    spOsc.start(sparkleTime);
    spOsc.stop(sparkleTime + 1.25);
    this.trackActiveNode(spOsc, undefined, spGain);
  }

  // =========================================================================
  // ⭐ [트랙 9번 심층 마스터] 👾 레트로 아케이드 (8-Bit Chiptune Adventure - 136 BPM 512 Steps / ~56.5초)
  // 장르: 정통 8비트 패미컴 칩튠 앤섬 (Pulse 1&2 듀얼 리드 + NES 트라이앵글 롤링 베이스 + 노이즈 드럼)
  // =========================================================================
  private scheduleArcadeStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 128); // 0: 8-Bit Ignition, 1: Dual Pulse Adventure, 2: Rapid Arp Climax, 3: Transposition Drop
    const localStep = step % 128;
    const bar = Math.floor(localStep / 16); // 0~7 마디
    const chordIndex = bar % 4;

    // -------------------------------------------------------------
    // 1. 8-Bit NES 노이즈 & DPCM 드럼 (Chiptune Drums)
    // -------------------------------------------------------------
    // (1) 8비트 펀치 킥 (DPCM Kick on 1 & 3 beats)
    const isClimax = part === 2;
    const isKick = isClimax ? step % 4 === 0 : localStep % 16 === 0 || localStep % 16 === 8;

    if (isKick) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'triangle';
      kickOsc.frequency.setValueAtTime(145, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.045);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(isClimax ? 0.16 : 0.13, time + 0.003);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.06);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) NES 노이즈 스네어 (Noise Snare on 4 & 12 steps)
    if (localStep % 16 === 4 || localStep % 16 === 12) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const sSource = ctx.createBufferSource();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();

        sSource.buffer = noiseBuf;
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(2600, time);
        sFilter.Q.value = 1.4;

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.055, time + 0.003);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(destination);
        sGain.connect(reverbSend);

        sSource.start(time);
        sSource.stop(time + 0.07);
        this.trackActiveNode(undefined, sSource, sGain);
      }
    }

    // (3) 16비트 칩튠 하이햇 틱 (Chiptune Hi-Hat Ticks on even steps)
    if (step % 2 === 0 && part >= 1) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const hSource = ctx.createBufferSource();
        const hGain = ctx.createGain();
        const hFilter = ctx.createBiquadFilter();
        const hPanner = this.createPanner(ctx, 0.25);

        hSource.buffer = noiseBuf;
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7500, time);

        hGain.gain.setValueAtTime(0.0001, time);
        hGain.gain.linearRampToValueAtTime(0.025, time + 0.002);
        hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

        hSource.connect(hFilter);
        hFilter.connect(hGain);

        if (hPanner) {
          hGain.connect(hPanner);
          hPanner.connect(destination);
          hPanner.connect(reverbSend);
        } else {
          hGain.connect(destination);
          hGain.connect(reverbSend);
        }

        hSource.start(time);
        hSource.stop(time + 0.03);
        this.trackActiveNode(undefined, hSource, hGain);
      }
    }

    // -------------------------------------------------------------
    // 2. NES 트라이앵글 16비트 롤링 베이스 (NES 4-Bit Triangle Bass)
    // -------------------------------------------------------------
    const bassPatterns: Record<number, number[]> = {
      0: [110.0, 220.0, 110.0, 220.0, 164.81, 220.0, 110.0, 220.0], // Am (A2-A3)
      1: [87.31, 174.61, 87.31, 174.61, 130.81, 174.61, 87.31, 174.61], // F (F2-F3)
      2: [98.0, 196.0, 98.0, 196.0, 146.83, 196.0, 98.0, 196.0], // G (G2-G3)
      3: [130.81, 261.63, 130.81, 261.63, 164.81, 261.63, 196.0, 261.63], // C / E7
    };
    const currentBassSeq = safeGet(bassPatterns, chordIndex, bassPatterns[0]);
    const bassNote = safeGet(currentBassSeq, Math.floor((localStep % 16) / 2), 0);

    if (step % 2 === 0 && bassNote) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassNote, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(part === 2 ? 800 : 450, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.14, time + 0.008);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.15);
      this.trackActiveNode(bOsc, undefined, bGain);
    }

    // -------------------------------------------------------------
    // 3. Pulse 1 Channel (8-Bit Hero Lead Melody)
    // -------------------------------------------------------------
    const leadNotes: Record<number, number> = {
      0: 523.25,
      4: 659.25,
      8: 783.99,
      12: 659.25,
      16: 880.0,
      20: 783.99,
      24: 659.25,
      28: 523.25,
      32: 698.46,
      36: 880.0,
      40: 1046.5,
      44: 880.0,
      48: 783.99,
      52: 987.77,
      56: 1174.66,
      60: 987.77,
      64: 880.0,
      68: 1046.5,
      72: 1318.51,
      76: 1046.5,
      80: 987.77,
      84: 1174.66,
      88: 1318.51,
      92: 1567.98,
      96: 1318.51,
      100: 1174.66,
      104: 1046.5,
      108: 880.0,
      112: 783.99,
      116: 880.0,
      120: 987.77,
      124: 1046.5,
    };
    const leadFreq = safeGet(leadNotes, localStep, 0);

    if (leadFreq && (part === 1 || part === 2 || part === 3)) {
      const lOsc = ctx.createOscillator();
      const lGain = ctx.createGain();
      const lFilter = ctx.createBiquadFilter();
      const lPanner = this.createPanner(ctx, -0.22); // 좌측 22% 펄스 리드 정위

      lGain.gain.value = 0;
      lOsc.type = 'square';
      lOsc.frequency.setValueAtTime(leadFreq, time);

      lFilter.type = 'bandpass';
      lFilter.frequency.setValueAtTime(2400, time);
      lFilter.Q.value = 0.9;

      lGain.gain.setValueAtTime(0.0001, time);
      lGain.gain.linearRampToValueAtTime(0.065, time + 0.008);
      lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      lOsc.connect(lFilter);
      lFilter.connect(lGain);

      if (lPanner) {
        lGain.connect(lPanner);
        lPanner.connect(destination);
        lPanner.connect(reverbSend);
      } else {
        lGain.connect(destination);
        lGain.connect(reverbSend);
      }

      lOsc.start(time);
      lOsc.stop(time + 0.24);
      this.trackActiveNode(lOsc, undefined, lGain);
    }

    // -------------------------------------------------------------
    // 4. Pulse 2 Channel (Fast 16th Arpeggios & Counter Harmony)
    // -------------------------------------------------------------
    const arpPatterns: Record<number, number[]> = {
      0: [
        440, 523.25, 659.25, 880, 1046.5, 880, 659.25, 523.25, 440, 523.25, 659.25, 880, 1046.5,
        1318.51, 1046.5, 880,
      ], // Am
      1: [
        349.23, 440, 523.25, 698.46, 880, 698.46, 523.25, 440, 349.23, 440, 523.25, 698.46, 880,
        1046.5, 880, 698.46,
      ], // F
      2: [
        392, 493.88, 587.33, 783.99, 987.77, 783.99, 587.33, 493.88, 392, 493.88, 587.33, 783.99,
        987.77, 1174.66, 987.77, 783.99,
      ], // G
      3: [
        523.25, 659.25, 783.99, 1046.5, 1318.51, 1046.5, 783.99, 659.25, 493.88, 659.25, 830.61,
        987.77, 1318.51, 1661.22, 1318.51, 987.77,
      ], // C/E7
    };
    const currentArp = safeGet(arpPatterns, chordIndex, arpPatterns[0]);
    const aFreq = safeGet(currentArp, localStep % 16, 0);

    if (aFreq) {
      const aOsc = ctx.createOscillator();
      const aGain = ctx.createGain();
      const aFilter = ctx.createBiquadFilter();
      const aPanner = this.createPanner(ctx, 0.22); // 우측 22% 펄스 아르페지오 정위

      aGain.gain.value = 0;
      aOsc.type = 'square';
      aOsc.frequency.setValueAtTime(aFreq, time);

      aFilter.type = 'lowpass';
      aFilter.frequency.setValueAtTime(2800, time);

      aGain.gain.setValueAtTime(0.0001, time);
      aGain.gain.linearRampToValueAtTime(part === 2 ? 0.055 : 0.038, time + 0.005);
      aGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.095);

      aOsc.connect(aFilter);
      aFilter.connect(aGain);

      if (aPanner) {
        aGain.connect(aPanner);
        aPanner.connect(destination);
        aPanner.connect(reverbSend);
      } else {
        aGain.connect(destination);
        aGain.connect(reverbSend);
      }

      aOsc.start(time);
      aOsc.stop(time + 0.1);
      this.trackActiveNode(aOsc, undefined, aGain);
    }
  }

  // =========================================================================
  // ⭐ [트랙 7번 심층 마스터] 🧩 복기 학습 & 퀴즈 로드맵 (Quiz Lo-Fi Focus - 84 BPM 384 Steps / ~68.5초)
  // 장르: Lo-Fi Study Beats (테이프 새츄레이션 로즈 피아노 + 빈티지 붐뱁 힙합 드럼 + 딥 서브 베이스)
  // =========================================================================
  private schedulePuzzleStep(
    ctx: AudioContext,
    destination: AudioNode,
    reverbSend: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96); // 0: Tape Rhodes Intro, 1: Study Flow, 2: Deep Focus Solo, 3: Rainy Room Outro
    const localStep = step % 96;
    const bar = Math.floor(localStep / 16); // 0~5 마디
    const chordIndex = bar % 4;

    // -------------------------------------------------------------
    // 1. 빈티지 붐뱁 힙합 드럼 (Dusty Boom-Bap Drums & Vinyl Shaker)
    // -------------------------------------------------------------
    // (1) 더스티 로파이 킥 (Dusty Kick on 0 & 10 steps)
    if (localStep % 16 === 0 || localStep % 16 === 10) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(95, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(0.14, time + 0.006);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.095);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    // (2) 빈티지 노이즈 스네어 / 림샷 탭 (Vintage Snare on 4 & 12 steps)
    if (localStep % 16 === 4 || localStep % 16 === 12) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const sSource = ctx.createBufferSource();
        const sGain = ctx.createGain();
        const sFilter = ctx.createBiquadFilter();

        sSource.buffer = noiseBuf;
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(1800, time);
        sFilter.Q.value = 1.1;

        sGain.gain.setValueAtTime(0.0001, time);
        sGain.gain.linearRampToValueAtTime(0.048, time + 0.004);
        sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(destination);
        sGain.connect(reverbSend);

        sSource.start(time);
        sSource.stop(time + 0.085);
        this.trackActiveNode(undefined, sSource, sGain);
      }
    }

    // (3) 레이지 스윙 하이햇 탭 (Lazy Swing Hi-Hats)
    if (step % 2 === 0) {
      const noiseBuf = this.getNoiseBuffer(ctx);
      if (noiseBuf && typeof ctx.createBufferSource === 'function') {
        const hSource = ctx.createBufferSource();
        const hGain = ctx.createGain();
        const hFilter = ctx.createBiquadFilter();
        const hPanner = this.createPanner(ctx, 0.2); // 우측 20% 하이햇 정위

        hSource.buffer = noiseBuf;
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(6800, time);

        const isUpbeat = localStep % 4 === 2;
        const hVol = isUpbeat ? 0.025 : 0.015;

        hGain.gain.setValueAtTime(0.0001, time);
        hGain.gain.linearRampToValueAtTime(hVol, time + 0.002);
        hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

        hSource.connect(hFilter);
        hFilter.connect(hGain);

        if (hPanner) {
          hGain.connect(hPanner);
          hPanner.connect(destination);
          hPanner.connect(reverbSend);
        } else {
          hGain.connect(destination);
          hGain.connect(reverbSend);
        }

        hSource.start(time);
        hSource.stop(time + 0.04);
        this.trackActiveNode(undefined, hSource, hGain);
      }
    }

    // -------------------------------------------------------------
    // 2. 딥 서브 베이스 (Round Lo-Fi Sub Bass)
    // -------------------------------------------------------------
    const subBassNotes: Record<number, number[]> = {
      0: [77.78, 0, 0, 0, 0, 0, 116.54, 0, 0, 0, 77.78, 0, 0, 0, 103.83, 0], // Ebmaj9 (Eb1, Bb1, G#1)
      1: [65.41, 0, 0, 0, 0, 0, 98.0, 0, 0, 0, 65.41, 0, 0, 0, 98.0, 0], // Cm9 (C1, G1)
      2: [87.31, 0, 0, 0, 0, 0, 130.81, 0, 0, 0, 87.31, 0, 0, 0, 130.81, 0], // Fm9 (F1, C2)
      3: [58.27, 0, 0, 0, 0, 0, 87.31, 0, 0, 0, 58.27, 0, 0, 0, 116.54, 0], // Bb13(b9) (Bb0, F1, Bb1)
    };
    const currentSubLine = safeGet(subBassNotes, chordIndex, subBassNotes[0]);
    const bFreq = safeGet(currentSubLine, localStep % 16, 0);

    if (bFreq) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(bFreq, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(220, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.38);
      this.trackActiveNode(bOsc, undefined, bGain);
    }

    // -------------------------------------------------------------
    // 3. 웜 테이프 로즈 피아노 (Tape Rhodes Piano with Reverb)
    // -------------------------------------------------------------
    const isRhodesStrum = localStep % 8 === 0 || localStep % 16 === 6;
    if (isRhodesStrum) {
      const rhodesChords: Record<number, number[]> = {
        0: [155.56, 196.0, 233.08, 293.66, 349.23], // Ebmaj9 (Eb, G, Bb, D, F)
        1: [130.81, 196.0, 233.08, 261.63, 311.13], // Cm9 (C, G, Bb, C, Eb)
        2: [174.61, 207.65, 261.63, 311.13, 349.23], // Fm9 (F, Ab, C, Eb, F)
        3: [146.83, 207.65, 233.08, 293.66, 329.63], // Bb13(b9) (D, Ab, Bb, D, E)
      };
      const chordNotes = safeGet(rhodesChords, chordIndex, rhodesChords[0]);

      chordNotes.forEach((cFreq, cIdx) => {
        const rOsc = ctx.createOscillator();
        const rGain = ctx.createGain();
        const rFilter = ctx.createBiquadFilter();
        const rPanner = this.createPanner(ctx, -0.25); // 좌측 25% 로즈 피아노 정위

        rGain.gain.value = 0;
        rOsc.type = 'triangle';
        rOsc.frequency.setValueAtTime(cFreq, time);

        // 테이프 새츄레이션 웜 로우패스 필터
        rFilter.type = 'lowpass';
        rFilter.frequency.setValueAtTime(950, time);
        rFilter.frequency.exponentialRampToValueAtTime(450, time + 0.45);

        const rVol = cIdx === 0 ? 0.055 : 0.038;
        rGain.gain.setValueAtTime(0.0001, time);
        rGain.gain.linearRampToValueAtTime(rVol, time + 0.015);
        rGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);

        rOsc.connect(rFilter);
        rFilter.connect(rGain);

        if (rPanner) {
          rGain.connect(rPanner);
          rPanner.connect(destination);
          rPanner.connect(reverbSend);
        } else {
          rGain.connect(destination);
          rGain.connect(reverbSend);
        }

        rOsc.start(time);
        rOsc.stop(time + 0.6);
        this.trackActiveNode(rOsc, undefined, rGain);
      });
    }

    // -------------------------------------------------------------
    // 4. 멜로우 비닐 비브라폰 & 플루트 솔로 선율 (Mellow Vinyl Lead)
    // -------------------------------------------------------------
    if (part >= 1) {
      const lofiLead: Record<number, number> = {
        0: 587.33,
        4: 659.25,
        8: 698.46,
        12: 783.99,
        16: 698.46,
        20: 659.25,
        24: 587.33,
        28: 523.25,
        32: 659.25,
        36: 698.46,
        40: 783.99,
        44: 880.0,
        48: 783.99,
        52: 698.46,
        56: 659.25,
        60: 587.33,
        64: 523.25,
        68: 587.33,
        72: 659.25,
        76: 587.33,
        80: 523.25,
        84: 440.0,
        88: 523.25,
        92: 587.33,
      };
      const lFreq = safeGet(lofiLead, localStep, 0);

      if (lFreq) {
        const lOsc = ctx.createOscillator();
        const lGain = ctx.createGain();
        const lFilter = ctx.createBiquadFilter();
        const lPanner = this.createPanner(ctx, 0.22); // 우측 22% 솔로 정위

        lGain.gain.value = 0;
        lOsc.type = 'sine';
        lOsc.frequency.setValueAtTime(lFreq, time);

        lFilter.type = 'lowpass';
        lFilter.frequency.setValueAtTime(1200, time);
        lFilter.frequency.exponentialRampToValueAtTime(650, time + 0.35);

        lGain.gain.setValueAtTime(0.0001, time);
        lGain.gain.linearRampToValueAtTime(0.065, time + 0.02);
        lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

        lOsc.connect(lFilter);
        lFilter.connect(lGain);

        if (lPanner) {
          lGain.connect(lPanner);
          lPanner.connect(destination);
          lPanner.connect(reverbSend);
        } else {
          lGain.connect(destination);
          lGain.connect(reverbSend);
        }

        lOsc.start(time);
        lOsc.stop(time + 0.45);
        this.trackActiveNode(lOsc, undefined, lGain);
      }
    }
  }

  private trackActiveNode(
    osc?: OscillatorNode,
    source?: AudioBufferSourceNode,
    gain?: GainNode
  ): void {
    if (!gain) return;
    this.activeNodes.push({ osc, source, gain });
    if (this.activeNodes.length > 80) {
      this.activeNodes.shift();
    }
  }

  dispose(): void {
    this.stop(0);
  }
}

export const bgm = new BgmEngine();
