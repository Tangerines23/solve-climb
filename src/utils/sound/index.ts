/**
 * @domain Web Audio 사운드 엔진 (Audio Synthesis)
 * @summary Web Audio API 기반 절차적 SFX 합성, 상황별 다이나믹 BGM 트랙 및 주파수 시각화
 */

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
export { isInstrumentPlaying } from './tracks/helpers';
export * from './synthesizers';
export * from './types';
