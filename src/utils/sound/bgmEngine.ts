// Web Audio API Procedural Background Music (BGM) Engine
// 9곡의 모든 악보, 편곡 및 신디사이징 로직은 tracks/ 서브모듈에 분리되어 있습니다.

import { audioContextManager } from './audioContext';
import type { BgmTheme } from './types';
import {
  type BgmVersion,
  type BgmPartInfo,
  type BgmTrackArrangement,
  BGM_ARRANGEMENTS_V1,
  BGM_ARRANGEMENTS_V2,
  TRACK_REGISTRY,
} from './tracks';

export type { BgmTheme, BgmVersion, BgmPartInfo, BgmTrackArrangement };
export { BGM_ARRANGEMENTS_V1, BGM_ARRANGEMENTS_V2 };

export class BgmEngine {
  private soundVersion: BgmVersion = 'v2';
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
   * BGM 엔진 사운드 버전 설정 ('v1': 원형 기초 샘플, 'v2': 완성본 리마스터)
   */
  setVersion(version: BgmVersion): void {
    this.soundVersion = version;
    if (this.currentTheme && this.isRunning) {
      const theme = this.currentTheme;
      const muffled = this.isMuffled;
      this.play(theme, muffled);
    }
  }

  /**
   * 현재 BGM 사운드 버전 조회
   */
  getVersion(): BgmVersion {
    return this.soundVersion;
  }

  /**
   * 현재 진행 스텝 조회
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * 현재 재생 중인 곡의 전체 스텝 수 조회
   */
  getTotalSteps(): number {
    if (!this.currentTheme) return 384;
    const arrangementMap = this.soundVersion === 'v1' ? BGM_ARRANGEMENTS_V1 : BGM_ARRANGEMENTS_V2;
    const arr = arrangementMap[this.currentTheme];
    return arr ? arr.totalSteps : 384;
  }

  /**
   * 특정 스텝으로 즉시 이동 (Seek)
   */
  seekToStep(targetStep: number): void {
    if (!this.isRunning || !this.currentTheme) return;
    const graph = this.getGraph();
    if (!graph) return;

    const total = this.getTotalSteps();
    this.currentStep = Math.max(0, Math.min(targetStep, total - 1));
    this.nextStepTime = Math.max(graph.ctx.currentTime, 0) + 0.02;

    // 기존 재생 중인 노드 즉각 정리
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
  }

  /**
   * 1, 2, 3, 4 파트로 즉시 점프
   */
  jumpToPart(partNum: number): void {
    if (!this.currentTheme) return;
    const arrangementMap = this.soundVersion === 'v1' ? BGM_ARRANGEMENTS_V1 : BGM_ARRANGEMENTS_V2;
    const arrangement = arrangementMap[this.currentTheme];
    if (!arrangement) return;

    const target = arrangement.parts.find((p) => p.partNum === partNum);
    if (target) {
      this.seekToStep(target.startStep);
    }
  }

  /**
   * BGM 전용 게인, 마스터 로우패스 필터, 알고리즈믹 룸 리버브 노드 초기화
   */
  private getGraph(): { ctx: AudioContext; destination: AudioNode; reverbSend: AudioNode } | null {
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
    audioContextManager.ensureRunning();
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
    this.nextStepTime = Math.max(graph.ctx.currentTime, 0) + 0.05;

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
    if (!graph || !this.isRunning || !this.currentTheme) return;

    // AudioContext가 뒤늦게 resume되었거나 탭 비활성화 후 복귀 시 과거 시간 루프 폭주 방지
    if (this.nextStepTime < graph.ctx.currentTime) {
      this.nextStepTime = graph.ctx.currentTime + 0.05;
    }

    const scheduleAheadTime = 0.25;

    while (this.nextStepTime < graph.ctx.currentTime + scheduleAheadTime) {
      const track = TRACK_REGISTRY[this.currentTheme];
      if (!track) break;

      if (this.soundVersion === 'v1') {
        const arrangement = BGM_ARRANGEMENTS_V1[this.currentTheme];
        if (!arrangement || !track.schedulePrototypeStep) break;

        track.schedulePrototypeStep({
          ctx: graph.ctx,
          destination: graph.destination,
          time: this.nextStepTime,
          step: this.currentStep,
          trackActiveNode: (osc, source, gain) => this.trackActiveNode(osc, source, gain),
        });

        this.nextStepTime += arrangement.stepDuration;
        this.currentStep = (this.currentStep + 1) % arrangement.totalSteps;
        continue;
      }

      // v2 리마스터 스케줄링
      const arrangement = BGM_ARRANGEMENTS_V2[this.currentTheme];
      if (!arrangement) break;

      let swingOffset = 0;
      if (this.currentTheme === 'brain_age' && this.currentStep % 2 === 1) {
        swingOffset = 0.022; // 60/40 스윙 셔플 오프셋
      }

      track.scheduleStep({
        ctx: graph.ctx,
        destination: graph.destination,
        reverbSend: graph.reverbSend,
        time: this.nextStepTime + swingOffset,
        step: this.currentStep,
        trackActiveNode: (osc, source, gain) => this.trackActiveNode(osc, source, gain),
        createPanner: (ctx, pan) => this.createPanner(ctx, pan),
        getNoiseBuffer: (ctx) => this.getNoiseBuffer(ctx),
      });

      this.nextStepTime += arrangement.stepDuration;
      this.currentStep = (this.currentStep + 1) % arrangement.totalSteps;
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
