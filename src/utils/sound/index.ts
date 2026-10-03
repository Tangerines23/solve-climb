/**
 * @domain Web Audio 사운드 엔진 (Audio Synthesis)
 * @summary Web Audio API 기반 절차적 SFX 합성, 상황별 다이나믹 BGM 트랙 및 주파수 시각화
 */

import { setupAudioLifecycle } from './audioLifecycle';

export { sound, SoundEngine } from './soundEngine';
export {
  bgm,
  BgmEngine,
  type BgmTheme,
  type BgmVersion,
  type BgmPartInfo,
  type BgmTrackArrangement,
  BGM_ARRANGEMENTS_V1,
  BGM_ARRANGEMENTS_V2,
} from './bgmEngine';
export { audioContextManager } from './audioContext';
export { setupGlobalTapListener } from './globalTapListener';
export {
  setupAudioLifecycle,
  teardownAudioLifecycle,
  pauseAllAudio,
  resumeAllAudio,
  terminateAllAudio,
} from './audioLifecycle';
export { isInstrumentPlaying } from './tracks/helpers';
export * from './synthesizers';
export * from './types';

// 브라우저 및 모바일 네이티브 런타임에서 오디오 생명주기 자동 등록 (단위 테스트 환경 제외)
if (typeof window !== 'undefined' && !import.meta.env.VITEST) {
  setupAudioLifecycle();
}
