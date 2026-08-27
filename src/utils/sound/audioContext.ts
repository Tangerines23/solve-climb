// AudioContext 싱글톤 및 마스터 오디오 그래프 관리

import { useSettingsStore } from '@/stores/useSettingsStore';

class AudioContextManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupUnlockListeners();
    this.setupVisibilityListener();
  }

  /**
   * 모바일/웹 브라우저 백그라운드 전환 시 AudioContext 일시정지 및 복귀 시 자동 재개
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } else {
        if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
          this.ctx.resume().catch(() => {});
        }
      }
    });
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

        // 🛡️ 최종 출력단 마스터 브릭월 리미터 (True-Peak Limiter)
        // BGM + 효과음 다중 중첩 및 고속 연타 시에도 0dBFS 초과를 원천 방어하여 스피커 찢어짐(Clipping) 방지
        if (typeof this.ctx.createDynamicsCompressor === 'function') {
          try {
            this.masterLimiter = this.ctx.createDynamicsCompressor();
            this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime); // -1.0 dBFS 천장 설정
            this.masterLimiter.knee.setValueAtTime(0, this.ctx.currentTime); // Hard Knee
            this.masterLimiter.ratio.setValueAtTime(20, this.ctx.currentTime); // 20:1 Peak Limiting
            this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime); // 1ms 초고속 반응
            this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime); // 100ms 빠른 회복

            this.masterGain.connect(this.masterLimiter);
            this.masterLimiter.connect(this.ctx.destination);
          } catch {
            this.masterGain.connect(this.ctx.destination);
          }
        } else {
          this.masterGain.connect(this.ctx.destination);
        }
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
   * 전역 BGM 활성화 여부 확인
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
   * 테스트 및 초기화용 리셋
   */
  reset(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.masterLimiter = null;
    this.isUnlocked = false;
  }
}

export const audioContextManager = new AudioContextManager();
