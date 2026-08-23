// AudioContext 싱글톤 및 마스터 오디오 그래프 관리

import { useSettingsStore } from '@/stores/useSettingsStore';

class AudioContextManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupUnlockListeners();
  }

  /**
   * 모바일 브라우저(iOS/Android)의 오디오 자동재생 정책을 만족하기 위한 유저 제스처 언락
   */
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      const ctx = this.getContext();
      if (!this.isUnlocked && ctx && ctx.state === 'suspended') {
        ctx
          .resume()
          .then(() => {
            this.isUnlocked = true;
          })
          .catch(() => {});
      } else if (ctx && ctx.state === 'running') {
        this.isUnlocked = true;
      }
    };

    // 사용자의 모든 제스처(터치, 클릭, 키입력)에 대해 상시 안전 언락
    window.addEventListener('touchstart', unlock, { passive: true, capture: true });
    window.addEventListener('touchend', unlock, { passive: true, capture: true });
    window.addEventListener('click', unlock, { passive: true, capture: true });
    window.addEventListener('keydown', unlock, { passive: true, capture: true });
  }

  /**
   * AudioContext 및 MasterGainNode 인스턴스 반환
   */
  getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * AudioContext 실행 상태 보장
   */
  ensureRunning(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * 마스터 게인 노드 반환
   */
  getMasterGain(): GainNode | null {
    if (!this.masterGain) {
      this.getContext();
    }
    return this.masterGain;
  }

  /**
   * 전역 효과음(SFX) 활성화 여부 확인
   */
  isEnabled(): boolean {
    return this.isSoundEnabled();
  }

  isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return useSettingsStore.getState().soundEnabled ?? true;
    } catch {
      return true;
    }
  }

  /**
   * 전역 배경음악(BGM) 활성화 여부 확인
   */
  isBgmEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return useSettingsStore.getState().bgmEnabled ?? true;
    } catch {
      return true;
    }
  }

  /**
   * 브라우저 오디오 언락 여부 확인
   */
  isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }
}

export const audioContextManager = new AudioContextManager();
