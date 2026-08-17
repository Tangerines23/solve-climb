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
        this.scheduleCelesteStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.1271; // 118 BPM
        this.currentStep = (this.currentStep + 1) % 512; // 32마디 대형 4부작 서사 (~65.1초)
      } else if (this.currentTheme === 'climb') {
        this.scheduleClimbStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.1339; // 112 BPM
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 사이버펑크 질주 (~51.4초)
      } else if (this.currentTheme === 'shop') {
        this.scheduleShopStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.15; // 100 BPM
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 산악 만물상 보사노바 (~57.6초)
      } else if (this.currentTheme === 'victory') {
        this.scheduleVictoryStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.15; // 100 BPM
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 승리 피날레 (~57.6초)
      } else if (this.currentTheme === 'crisis') {
        this.scheduleCrisisStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.119; // 126 BPM
        this.currentStep = (this.currentStep + 1) % 448; // 28마디 심장박동 서스펜스 (~53.3초)
      } else if (this.currentTheme === 'chill') {
        this.scheduleChillStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 2.0;
        this.currentStep = (this.currentStep + 1) % 32; // 32주기 싱잉볼 힐링 (~64.0초)
      } else if (this.currentTheme === 'arcade') {
        this.scheduleArcadeStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.1136; // 132 BPM
        this.currentStep = (this.currentStep + 1) % 512; // 32마디 패미컴 칩튠 (~58.2초)
      } else if (this.currentTheme === 'puzzle') {
        this.schedulePuzzleStep(graph.ctx, graph.destination, this.nextStepTime, this.currentStep);
        this.nextStepTime += 0.163; // 92 BPM
        this.currentStep = (this.currentStep + 1) % 384; // 24마디 Lo-Fi Rhodes (~62.6초)
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
  // 테마 2: 🧗‍♀️ 셀레스트 등반 (Celeste 'First Steps' - 118 BPM 512 Steps)
  // =========================================================================
  private scheduleCelesteStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 128);
    const localStep = step % 128;
    const chordIndex = Math.floor(localStep / 16) % 4;

    if (part >= 1 && step % 4 === 0) {
      const isClimax = part === 2;
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(isClimax ? 130 : 115, time);
      kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.05);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(isClimax ? 0.16 : 0.13, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.07);
      this.trackActiveNode(kickOsc, undefined, kickGain);
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
    const currentPianoArp = safeGet(pianoPatterns, chordIndex, pianoPatterns[0]);
    const pianoFreq = safeGet(currentPianoArp, localStep % 16, 0);

    if (pianoFreq) {
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pFilter = ctx.createBiquadFilter();

      pGain.gain.value = 0;
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(pianoFreq, time);

      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(part >= 2 ? 1500 : 950, time);

      const pVol = part === 0 ? 0.08 : part === 2 ? 0.055 : 0.07;
      pGain.gain.setValueAtTime(0.0001, time);
      pGain.gain.linearRampToValueAtTime(pVol, time + 0.008);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.19);

      pOsc.connect(pFilter);
      pFilter.connect(pGain);
      pGain.connect(destination);

      pOsc.start(time);
      pOsc.stop(time + 0.21);
      this.trackActiveNode(pOsc, undefined, pGain);
    }

    if (part >= 1 && step % 2 === 0) {
      const synthBassMap: Record<number, number> = {
        0: 65.41,
        1: 82.41,
        2: 55.0,
        3: 43.65,
      };
      const sbFreq = safeGet(synthBassMap, chordIndex, 65.41);

      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sGain.gain.value = 0;
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(sbFreq, time);

      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(420, time);

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.12, time + 0.012);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      sOsc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);

      sOsc.start(time);
      sOsc.stop(time + 0.18);
      this.trackActiveNode(sOsc, undefined, sGain);
    }

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

        lGain.gain.value = 0;
        lOsc.type = 'sawtooth';
        lOsc.frequency.setValueAtTime(lFreq, time);

        lFilter.type = 'lowpass';
        lFilter.frequency.setValueAtTime(800, time);
        lFilter.frequency.linearRampToValueAtTime(1500, time + 0.2);
        lFilter.frequency.linearRampToValueAtTime(600, time + 0.45);

        lGain.gain.setValueAtTime(0.0001, time);
        lGain.gain.linearRampToValueAtTime(0.055, time + 0.04);
        lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.48);

        lOsc.connect(lFilter);
        lFilter.connect(lGain);
        lGain.connect(destination);

        lOsc.start(time);
        lOsc.stop(time + 0.5);
        this.trackActiveNode(lOsc, undefined, lGain);
      }
    }

    if (part === 2 && step % 2 === 0) {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();

      hGain.gain.value = 0;
      hOsc.type = 'triangle';
      hOsc.frequency.setValueAtTime(3200, time);

      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(2800, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.035, time + 0.004);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      hOsc.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(destination);

      hOsc.start(time);
      hOsc.stop(time + 0.04);
      this.trackActiveNode(hOsc, undefined, hGain);
    }
  }

  // =========================================================================
  // 테마 3: 🧗‍♂️ 클라이머 펄스 (Climber Pulse - 112 BPM 384 Steps)
  // =========================================================================
  private scheduleClimbStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const part = Math.floor(step / 96);
    const localStep = step % 96;
    const chordIndex = Math.floor(localStep / 16) % 4;

    const isKick = step % 4 === 0 || (part >= 2 && step % 2 === 0 && localStep > 80);
    if (isKick) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickGain.gain.value = 0;
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(125, time);
      kickOsc.frequency.exponentialRampToValueAtTime(40, time + 0.05);

      kickGain.gain.setValueAtTime(0.0001, time);
      kickGain.gain.linearRampToValueAtTime(0.15, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.start(time);
      kickOsc.stop(time + 0.06);
      this.trackActiveNode(kickOsc, undefined, kickGain);
    }

    const bassMap: Record<number, number[]> = {
      0: [55.0, 110.0, 55.0, 110.0, 82.41, 110.0, 55.0, 110.0],
      1: [43.65, 87.31, 43.65, 87.31, 65.41, 87.31, 43.65, 87.31],
      2: [65.41, 130.81, 65.41, 130.81, 98.0, 130.81, 65.41, 130.81],
      3: [49.0, 98.0, 49.0, 98.0, 73.42, 98.0, 49.0, 98.0],
    };
    const currentBassNotes = safeGet(bassMap, chordIndex, bassMap[0]);
    const bassNote = safeGet(currentBassNotes, Math.floor((localStep % 16) / 2), 0);

    if (step % 2 === 0 && bassNote) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassNote, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(part >= 2 ? 480 : 320, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.12, time + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.18);
      this.trackActiveNode(bOsc, undefined, bGain);
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
    const currentArpPattern = safeGet(arpPatterns, chordIndex, arpPatterns[0]);
    const arpFreq = safeGet(currentArpPattern, localStep % 16, 0);

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
      this.trackActiveNode(aOsc, undefined, aGain);
    }
  }

  // =========================================================================
  // 테마 4: 🏪 산악 만물상 (Cozy Outfitter Shop - 100 BPM 보사노바 384 Steps)
  // =========================================================================
  private scheduleShopStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const localStep = step % 96;
    const chordIndex = Math.floor(localStep / 16) % 4;

    const bossaBass: Record<number, { step: number; freq: number }[]> = {
      0: [
        { step: 0, freq: 65.41 },
        { step: 6, freq: 98.0 },
        { step: 10, freq: 65.41 },
        { step: 14, freq: 98.0 },
      ],
      1: [
        { step: 0, freq: 110.0 },
        { step: 6, freq: 164.81 },
        { step: 10, freq: 110.0 },
        { step: 14, freq: 155.56 },
      ],
      2: [
        { step: 0, freq: 73.42 },
        { step: 6, freq: 110.0 },
        { step: 10, freq: 73.42 },
        { step: 14, freq: 110.0 },
      ],
      3: [
        { step: 0, freq: 98.0 },
        { step: 6, freq: 146.83 },
        { step: 10, freq: 98.0 },
        { step: 14, freq: 123.47 },
      ],
    };
    const currentBassEvents = bossaBass[chordIndex] || bossaBass[0];
    const bassEvent = currentBassEvents.find((e) => e.step === localStep % 16);

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
      this.trackActiveNode(bOsc, undefined, bGain);
    }

    const isStrum =
      localStep % 16 === 0 ||
      localStep % 16 === 6 ||
      localStep % 16 === 10 ||
      localStep % 16 === 14;
    if (isStrum) {
      const shopChords: Record<number, number[]> = {
        0: [261.63, 329.63, 392.0, 493.88],
        1: [277.18, 329.63, 392.0, 466.16],
        2: [293.66, 349.23, 440.0, 523.25],
        3: [246.94, 329.63, 349.23, 440.0],
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
        this.trackActiveNode(uOsc, undefined, uGain);
      });
    }

    const melodyMap: Record<number, number[]> = {
      0: [659.25, 0, 783.99, 0, 880.0, 0, 987.77, 0, 783.99, 0, 659.25, 0, 587.33, 0, 523.25, 0],
      1: [554.37, 0, 659.25, 0, 783.99, 0, 932.33, 0, 783.99, 0, 659.25, 0, 698.46, 0, 0, 0],
      2: [698.46, 0, 880.0, 0, 1046.5, 0, 880.0, 0, 698.46, 0, 587.33, 0, 659.25, 0, 0, 0],
      3: [587.33, 0, 783.99, 0, 987.77, 0, 1174.66, 0, 987.77, 0, 783.99, 0, 523.25, 0, 0, 0],
    };
    const currentMelody = melodyMap[chordIndex] || melodyMap[0];
    const mFreq = currentMelody[localStep % 16];

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
      this.trackActiveNode(mOsc, undefined, mGain);
    }
  }

  // =========================================================================
  // 테마 5: 🏆 정상 정복 & 승리 찬가 (Summit Victory - 100 BPM 384 Steps)
  // =========================================================================
  private scheduleVictoryStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const localStep = step % 96;
    const chordIndex = Math.floor(localStep / 16) % 4;

    if (localStep % 16 === 0) {
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
        this.trackActiveNode(osc, undefined, gain);
      });
    }

    const arpSeq = [
      523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 880.0, 1174.66, 659.25, 783.99, 987.77,
      1318.51, 783.99, 1046.5, 1318.51, 1567.98,
    ];
    const harpFreq = arpSeq[localStep % 16];
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
      this.trackActiveNode(hOsc, undefined, hGain);
    }
  }

  // =========================================================================
  // 테마 6: 💓 스태미나 위기 / 라스트 찬스 (Crisis Heartbeat - 126 BPM 448 Steps)
  // =========================================================================
  private scheduleCrisisStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const isFirstBeat = step % 8 === 0;
    const isSecondBeat = step % 8 === 2;

    if (isFirstBeat || isSecondBeat) {
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
      this.trackActiveNode(hOsc, undefined, hGain);

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
      this.trackActiveNode(subOsc, undefined, subGain);
    }

    if (step % 16 === 0) {
      const tensionChord =
        step % 32 < 16
          ? [110.0, 164.81, 220.0, 261.63, 311.13]
          : [82.41, 123.47, 164.81, 207.65, 246.94];

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
        this.trackActiveNode(osc, undefined, gain);
      });
    }

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
      this.trackActiveNode(tOsc, undefined, tGain);
    }
  }

  // =========================================================================
  // 테마 7: 🏔️ 산악 앰비언트 (Mountain Chill - 64초 32주기 힐링 싱잉볼 앰비언트)
  // =========================================================================
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

    const currentChordIndex = chordIndex % 8;
    const chord = chords[currentChordIndex] || chords[0];
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

      this.trackActiveNode(osc, undefined, gain);
    });

    if (chordIndex >= 4) {
      const melodyNotes = [
        [329.63, 392.0],
        [440.0, 523.25],
        [392.0, 349.23],
        [293.66, 261.63],
      ];
      const melodyPair = melodyNotes[chordIndex % 4] || [329.63, 392.0];

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
        this.trackActiveNode(mOsc, undefined, mGain);
      });
    }

    const sparkles = [659.25, 523.25, 783.99, 587.33, 659.25, 880.0, 783.99, 1046.5];
    const sparkleFreq = sparkles[chordIndex % 8] || 659.25;
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

    this.trackActiveNode(spOsc, undefined, spGain);
  }

  // =========================================================================
  // 테마 8: 👾 레트로 아케이드 (8-Bit Chiptune Adventure - 132 BPM 512 Steps)
  // =========================================================================
  private scheduleArcadeStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const localStep = step % 64;
    const bassPattern = [
      130.81, 0, 130.81, 0, 196.0, 0, 164.81, 0, 110.0, 0, 110.0, 0, 164.81, 0, 130.81, 0, 87.31, 0,
      87.31, 0, 130.81, 0, 110.0, 0, 98.0, 0, 146.83, 0, 196.0, 0, 246.94, 0,
    ];

    const bassFreq = bassPattern[localStep % 32];
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
      this.trackActiveNode(osc, undefined, gain);
    }

    const leadNotes = [
      523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0, 880.0, 0, 783.99, 0, 659.25, 0, 523.25, 0, 440.0,
      0, 523.25, 0, 659.25, 0, 523.25, 0, 587.33, 0, 659.25, 0, 783.99, 0, 987.77, 0,
    ];

    const leadFreq = leadNotes[localStep % 32];
    if (leadFreq && leadFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.type = 'square';
      osc.frequency.setValueAtTime(leadFreq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.065, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 0.2);
      this.trackActiveNode(osc, undefined, gain);
    }
  }

  // =========================================================================
  // 테마 9: 🧩 퀴즈 & 브레인 포커스 (Quiz Lo-Fi Focus - 92 BPM 384 Steps)
  // =========================================================================
  private schedulePuzzleStep(
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    step: number
  ): void {
    const localStep = step % 96;

    if (localStep % 8 === 0) {
      const jazzChords = [
        [174.61, 220.0, 261.63, 329.63],
        [164.81, 196.0, 246.94, 293.66],
        [146.83, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 246.94],
      ];
      const chord = jazzChords[Math.floor(localStep / 8) % 4] || jazzChords[0];

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
        this.trackActiveNode(osc, undefined, gain);
      });
    }

    const marimbaPattern = [
      523.25, 0, 659.25, 0, 0, 783.99, 0, 659.25, 493.88, 0, 587.33, 0, 0, 659.25, 0, 493.88, 440.0,
      0, 523.25, 0, 0, 659.25, 0, 523.25, 392.0, 0, 493.88, 0, 523.25, 0, 659.25, 0,
    ];

    const mFreq = marimbaPattern[localStep % 32];
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
      this.trackActiveNode(osc, undefined, gain);
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
