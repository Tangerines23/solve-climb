import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleArcadeStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
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
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) NES 노이즈 스네어 (Noise Snare on 4 & 12 steps)
  if (localStep % 16 === 4 || localStep % 16 === 12) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const sSource = ctx.createBufferSource();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(2600, time);
      sFilter.Q.value = 1.4;

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.055, time + 0.003);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

      sSource.buffer = noiseBuf;
      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);
      sGain.connect(reverbSend);

      sSource.start(time);
      sSource.stop(time + 0.07);
      trackActiveNode(undefined, sSource, sGain);
    }
  }

  // (3) 16비트 칩튠 하이햇 틱 (Chiptune Hi-Hat Ticks on even steps)
  if (step % 2 === 0 && part >= 1) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const hSource = ctx.createBufferSource();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();
      const hPanner = createPanner(ctx, 0.25);

      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(7500, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.025, time + 0.002);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

      hSource.buffer = noiseBuf;
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
      trackActiveNode(undefined, hSource, hGain);
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
    trackActiveNode(bOsc, undefined, bGain);
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
    const lPanner = createPanner(ctx, -0.22); // 좌측 22% 펄스 리드 정위

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
    trackActiveNode(lOsc, undefined, lGain);
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
    const aPanner = createPanner(ctx, 0.22); // 우측 22% 펄스 아르페지오 정위

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
    trackActiveNode(aOsc, undefined, aGain);
  }
};

export const schedulePrototypeArcade = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const bassPattern = [
    130.81, 0, 130.81, 0, 196.0, 0, 164.81, 0, 110.0, 0, 110.0, 0, 164.81, 0, 130.81, 0, 87.31, 0,
    87.31, 0, 130.81, 0, 110.0, 0, 98.0, 0, 146.83, 0, 196.0, 0, 246.94, 0,
  ];

  const bassFreq = safeGet(bassPattern, step, 0);
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
    trackActiveNode(osc, undefined, gain);
  }

  const leadNotes = [
    523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0, 880.0, 0, 783.99, 0, 659.25, 0, 523.25, 0, 440.0, 0,
    523.25, 0, 659.25, 0, 523.25, 0, 587.33, 0, 659.25, 0, 783.99, 0, 987.77, 0,
  ];

  const leadFreq = safeGet(leadNotes, step, 0);
  if (leadFreq && leadFreq > 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(leadFreq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.065, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.2);
    trackActiveNode(osc, undefined, gain);
  }
};

export const arcadeTrack: TrackModule = {
  theme: 'arcade',
  scheduleStep: scheduleArcadeStep,
  schedulePrototypeStep: schedulePrototypeArcade,
};
