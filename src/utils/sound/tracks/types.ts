import type { BgmTheme } from '../types';

export type BgmVersion = 'v1' | 'v2';

export interface BgmPartInfo {
  partNum: number;
  name: string;
  startStep: number;
  endStep: number;
  instruments: string[];
  description: string;
}

export interface BgmTrackArrangement {
  totalSteps: number;
  bpm: number;
  stepDuration: number;
  parts: BgmPartInfo[];
}

export interface TrackContext {
  ctx: AudioContext;
  destination: AudioNode;
  reverbSend: AudioNode;
  time: number;
  step: number;
  trackActiveNode: (osc?: OscillatorNode, source?: AudioBufferSourceNode, gain?: GainNode) => void;
  createPanner: (ctx: AudioContext, pan: number) => StereoPannerNode | null;
  getNoiseBuffer: (ctx: AudioContext) => AudioBuffer | null;
}

export interface PrototypeTrackContext {
  ctx: AudioContext;
  destination: AudioNode;
  time: number;
  step: number;
  trackActiveNode: (osc?: OscillatorNode, source?: AudioBufferSourceNode, gain?: GainNode) => void;
}

export interface TrackModule {
  theme: BgmTheme;
  scheduleStep: (context: TrackContext) => void;
  schedulePrototypeStep?: (context: PrototypeTrackContext) => void;
}
