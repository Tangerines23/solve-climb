// Web Audio API 프로시저럴 DSP 신디사이저 프리미티브

import { ToneOptions, SweepOptions, ChordOptions, FilteredToneOptions, PulseBeat } from './types';

/**
 * 스케줄링 안전 마진 (초) - 메인 스레드 지연 시 1.0 볼륨 팝/클리핑 방지
 */
const SCHEDULE_LOOKAHEAD = 0.005;

/**
 * 1. 단일 주파수 톤(Tone) 재생
 */
export function playTone(ctx: AudioContext, destination: AudioNode, options: ToneOptions): void {
  const now = ctx.currentTime + SCHEDULE_LOOKAHEAD + (options.startTimeOffset ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // 기본 게인을 0으로 초기화하여 스케줄링 이전 볼륨 1.0 방출 방지
  gain.gain.value = 0;

  const type = options.type ?? 'sine';
  const duration = options.duration ?? 0.1;
  const attack = options.attack ?? 0.005;
  const volume = options.volume ?? 0.2;

  osc.type = type;
  osc.frequency.setValueAtTime(options.freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * 2. 주파수 스윕(Sweep / Pitch Bend) 재생
 */
export function playSweep(ctx: AudioContext, destination: AudioNode, options: SweepOptions): void {
  const now = ctx.currentTime + SCHEDULE_LOOKAHEAD + (options.startTimeOffset ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // 기본 게인을 0으로 초기화하여 스케줄링 이전 볼륨 1.0 방출 방지
  gain.gain.value = 0;

  const type = options.type ?? 'sine';
  const duration = options.duration;
  const attack = options.attack ?? 0.005;
  const volume = options.volume ?? 0.2;
  const exponential = options.exponential ?? true;

  osc.type = type;
  osc.frequency.setValueAtTime(options.startFreq, now);

  if (exponential) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFreq), now + duration);
  } else {
    osc.frequency.linearRampToValueAtTime(options.endFreq, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * 3. 화음 및 아르페지오(Chord / Arpeggio) 재생
 */
export function playChord(ctx: AudioContext, destination: AudioNode, options: ChordOptions): void {
  const now = ctx.currentTime + SCHEDULE_LOOKAHEAD;
  const type = options.type ?? 'triangle';
  const defaultDuration = options.defaultDuration ?? 0.35;
  const defaultVolume = options.defaultVolume ?? 0.2;
  const interval = options.interval ?? 0;

  options.notes.forEach((note, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;

    const noteOffset = note.time ?? i * interval;
    const startTime = now + noteOffset;
    const duration = note.dur ?? defaultDuration;
    const volume = note.vol ?? defaultVolume;

    osc.type = type;
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  });
}

/**
 * 4. 바이쿼드 필터 적용 톤(Filtered Tone - 버저/징글 등) 재생
 */
export function playFilteredTone(
  ctx: AudioContext,
  destination: AudioNode,
  options: FilteredToneOptions
): void {
  const now = ctx.currentTime + SCHEDULE_LOOKAHEAD + (options.startTimeOffset ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const filter = ctx.createBiquadFilter();

  const type = options.type ?? 'sawtooth';
  const duration = options.duration ?? 0.22;
  const volume = options.volume ?? 0.2;

  filter.type = options.filter.type;
  filter.frequency.setValueAtTime(options.filter.frequency, now);
  if (options.filter.Q !== undefined) {
    filter.Q.setValueAtTime(options.filter.Q, now);
  }

  osc.type = type;
  osc.frequency.setValueAtTime(options.freq, now);
  if (options.endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(options.endFreq, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * 5. 듀얼 레이어 펄스(MultiPulse - 스태미나 위기 심장박동 등) 재생
 */
export function playMultiPulse(
  ctx: AudioContext,
  destination: AudioNode,
  beats: PulseBeat[]
): void {
  const now = ctx.currentTime + SCHEDULE_LOOKAHEAD;

  beats.forEach(({ offset, startFreq, endFreq, punchFreq, dur, vol }) => {
    const startTime = now + offset;

    // 1. 바디 베이스 톤 (풍부한 저음/중음 하모닉스)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0;

    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(startFreq, startTime);
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, startTime + dur);

    bodyGain.gain.setValueAtTime(0.0001, startTime);
    bodyGain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(destination);

    bodyOsc.start(startTime);
    bodyOsc.stop(startTime + dur + 0.01);

    // 2. 펀치 트랜지언트 (소형 스피커 가청성 강화용 어택 펄스)
    if (punchFreq) {
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      punchGain.gain.value = 0;

      punchOsc.type = 'sine';
      punchOsc.frequency.setValueAtTime(punchFreq, startTime);
      punchOsc.frequency.exponentialRampToValueAtTime(startFreq, startTime + 0.025);

      punchGain.gain.setValueAtTime(0.0001, startTime);
      punchGain.gain.linearRampToValueAtTime(vol * 0.45, startTime + 0.004);
      punchGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

      punchOsc.connect(punchGain);
      punchGain.connect(destination);

      punchOsc.start(startTime);
      punchOsc.stop(startTime + 0.035);
    }
  });
}
