// Web Audio API 사운드 엔진 타입 정의

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export type BgmTheme =
  'brain_age' | 'celeste' | 'climb' | 'shop' | 'victory' | 'crisis' | 'puzzle' | 'chill' | 'arcade';

export interface EnvelopeOptions {
  attack?: number; // 초 단위 (기본값: 0.01)
  decay?: number; // 초 단위 (기본값: 0.05)
  sustain?: number; // 게인 레벨 0~1 (기본값: 0)
  release?: number; // 초 단위 (기본값: 0.1)
  volume?: number; // 최대 게인 0~1 (기본값: 0.2)
}

export interface ToneOptions extends EnvelopeOptions {
  freq: number;
  type?: WaveformType;
  duration?: number;
  startTimeOffset?: number;
}

export interface SweepOptions extends EnvelopeOptions {
  startFreq: number;
  endFreq: number;
  duration: number;
  type?: WaveformType;
  exponential?: boolean;
  startTimeOffset?: number;
}

export interface ChordNote {
  freq: number;
  time?: number; // 시작 오프셋 (초)
  dur?: number; // 지속 시간 (초)
  vol?: number; // 개별 볼륨
}

export interface ChordOptions {
  notes: ChordNote[];
  type?: WaveformType;
  defaultDuration?: number;
  defaultVolume?: number;
  interval?: number; // 각 음 사이의 간격 (아르페지오)
}

export interface FilterOptions {
  type: BiquadFilterType;
  frequency: number;
  Q?: number;
}

export interface FilteredToneOptions extends ToneOptions {
  filter: FilterOptions;
  endFreq?: number;
}

export interface PulseBeat {
  offset: number;
  startFreq: number;
  endFreq: number;
  punchFreq: number;
  dur: number;
  vol: number;
}
