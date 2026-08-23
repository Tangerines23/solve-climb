import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleCelesteStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 128); // 0: Intro, 1: Ascent, 2: Peak Climax, 3: Summit Vista
  const localStep = step % 128;
  const bar = Math.floor(localStep / 16); // 0~7 마디
  const chordIndex = bar % 4;

  // -------------------------------------------------------------
  // 1. 산의 고동: 킥 & 크리스피 노이즈 스네어 (Drums)
  // -------------------------------------------------------------
  // (1) 4-on-the-floor 딥 마운틴 킥 (Part 1, 2)
  if (part >= 1 && step % 4 === 0) {
    const isClimax = part === 2;
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(isClimax ? 125 : 110, time);
    kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.055);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(isClimax ? 0.16 : 0.12, time + 0.004);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.07);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) 노이즈 버퍼 기반 크리스피 스네어 (Part 2 클라이맥스 2, 4박)
  if (part === 2 && step % 8 === 4) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const snSource = ctx.createBufferSource();
      const snGain = ctx.createGain();
      const snFilter = ctx.createBiquadFilter();

      snSource.buffer = noiseBuf;
      snFilter.type = 'bandpass';
      snFilter.frequency.setValueAtTime(2800, time);
      snFilter.Q.value = 1.4;

      snGain.gain.setValueAtTime(0.0001, time);
      snGain.gain.linearRampToValueAtTime(0.05, time + 0.005);
      snGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

      snSource.connect(snFilter);
      snFilter.connect(snGain);
      snGain.connect(destination);
      snGain.connect(reverbSend);

      snSource.start(time);
      snSource.stop(time + 0.075);
      trackActiveNode(undefined, snSource, snGain);
    }
  }

  // (3) 16비트 질주하는 하이햇 (Part 2 클라이맥스 전용, 우측 +22% 패닝)
  if (part === 2 && step % 2 === 0) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const hSource = ctx.createBufferSource();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();
      const hPanner = createPanner(ctx, 0.22);

      hSource.buffer = noiseBuf;
      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(7500, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.028, time + 0.002);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

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
      hSource.stop(time + 0.04);
      trackActiveNode(undefined, hSource, hGain);
    }
  }

  // -------------------------------------------------------------
  // 2. 영롱한 스테레오 피아노 아르페지오 (Stereo Panned Piano with Reverb)
  // -------------------------------------------------------------
  const pianoPatternsPart12: Record<number, number[]> = {
    0: [
      261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63, 261.63, 329.63, 392.0, 493.88,
      523.25, 659.25, 523.25, 392.0,
    ], // Cmaj7
    1: [
      246.94, 329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 329.63, 246.94, 329.63, 392.0, 493.88,
      587.33, 783.99, 587.33, 493.88,
    ], // Em7
    2: [
      220.0, 261.63, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0,
      523.25, 659.25, 523.25, 329.63,
    ], // Am7
    3: [
      174.61, 220.0, 261.63, 349.23, 440.0, 349.23, 261.63, 220.0, 174.61, 220.0, 261.63, 349.23,
      523.25, 659.25, 523.25, 440.0,
    ], // Fmaj7
  };

  const pianoPatternsPart3: Record<number, number[]> = {
    0: [
      293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23, 293.66, 349.23, 440.0, 523.25,
      587.33, 698.46, 587.33, 440.0,
    ], // Dm7
    1: [
      246.94, 329.63, 392.0, 440.0, 587.33, 493.88, 392.0, 329.63, 246.94, 329.63, 392.0, 493.88,
      587.33, 783.99, 587.33, 493.88,
    ], // G13
    2: [
      220.0, 261.63, 329.63, 440.0, 523.25, 440.0, 329.63, 261.63, 220.0, 261.63, 329.63, 440.0,
      523.25, 659.25, 523.25, 329.63,
    ], // Am7
    3: [
      174.61, 261.63, 329.63, 392.0, 523.25, 440.0, 349.23, 261.63, 174.61, 220.0, 261.63, 349.23,
      523.25, 659.25, 783.99, 1046.5,
    ], // Fmaj9
  };

  const targetPattern = part === 2 ? pianoPatternsPart3 : pianoPatternsPart12;
  const currentPianoArp = safeGet(targetPattern, chordIndex, targetPattern[0]);
  const pianoFreq = safeGet(currentPianoArp, localStep % 16, 0);

  if (pianoFreq) {
    const pOsc = ctx.createOscillator();
    const pGain = ctx.createGain();
    const pFilter = ctx.createBiquadFilter();
    // 스텝마다 좌/우로 부드럽게 퍼지는 스테레오 아르페지오 (-0.28 / +0.28)
    const panVal = localStep % 2 === 0 ? -0.28 : 0.28;
    const panner = createPanner(ctx, panVal);

    pGain.gain.value = 0;
    pOsc.type = 'sine';
    pOsc.frequency.setValueAtTime(pianoFreq, time);

    pFilter.type = 'lowpass';
    pFilter.frequency.setValueAtTime(part >= 2 ? 1600 : 1050, time);

    const pVol = part === 0 ? 0.08 : part === 2 ? 0.055 : 0.07;
    pGain.gain.setValueAtTime(0.0001, time);
    pGain.gain.linearRampToValueAtTime(pVol, time + 0.008);
    pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

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
    pOsc.stop(time + 0.24);
    trackActiveNode(pOsc, undefined, pGain);
  }

  // -------------------------------------------------------------
  // 3. 아날로그 신스 베이스 (Analog Synth Bass with Sub)
  // -------------------------------------------------------------
  if (part >= 1 && step % 2 === 0) {
    const synthBassMap: Record<number, number> = {
      0: 65.41, // C2
      1: 82.41, // E2
      2: 55.0, // A1
      3: 43.65, // F1
    };
    const sbFreq = safeGet(synthBassMap, chordIndex, 65.41);

    const sOsc = ctx.createOscillator();
    const sGain = ctx.createGain();
    const sFilter = ctx.createBiquadFilter();

    sGain.gain.value = 0;
    sOsc.type = 'triangle';
    sOsc.frequency.setValueAtTime(sbFreq, time);

    sFilter.type = 'lowpass';
    sFilter.frequency.setValueAtTime(part === 2 ? 550 : 380, time);

    sGain.gain.setValueAtTime(0.0001, time);
    sGain.gain.linearRampToValueAtTime(0.13, time + 0.012);
    sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    sOsc.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(destination);

    sOsc.start(time);
    sOsc.stop(time + 0.18);
    trackActiveNode(sOsc, undefined, sGain);
  }

  // -------------------------------------------------------------
  // 4. 따뜻한 산림 신스 패드 (Warm Atmospheric Mountain Pad with Reverb)
  // -------------------------------------------------------------
  if (part >= 1 && localStep % 16 === 0) {
    const padChords: Record<number, number[]> = {
      0: [130.81, 164.81, 196.0, 246.94], // Cmaj7 pad
      1: [123.47, 164.81, 196.0, 246.94], // Em7 pad
      2: [110.0, 130.81, 164.81, 196.0], // Am7 pad
      3: [87.31, 130.81, 174.61, 220.0], // Fmaj7 pad
    };
    const padNotes = safeGet(padChords, chordIndex, padChords[0]);

    padNotes.forEach((pFreq) => {
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      const padFilter = ctx.createBiquadFilter();

      padGain.gain.value = 0;
      padOsc.type = 'sawtooth';
      padOsc.frequency.setValueAtTime(pFreq, time);

      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(450, time);
      padFilter.frequency.linearRampToValueAtTime(700, time + 0.8);
      padFilter.frequency.linearRampToValueAtTime(350, time + 1.8);

      padGain.gain.setValueAtTime(0.0001, time);
      padGain.gain.linearRampToValueAtTime(0.032, time + 0.3);
      padGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(destination);
      padGain.connect(reverbSend);

      padOsc.start(time);
      padOsc.stop(time + 2.0);
      trackActiveNode(padOsc, undefined, padGain);
    });
  }

  // -------------------------------------------------------------
  // 5. 고음 신스 리드 솔로 선율 (High-Octave Celeste Soaring Lead)
  // -------------------------------------------------------------
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
      const lPanner = createPanner(ctx, 0.18); // 우측 18% 정위

      lGain.gain.value = 0;
      lOsc.type = 'sawtooth';
      lOsc.frequency.setValueAtTime(lFreq, time);

      lFilter.type = 'lowpass';
      lFilter.frequency.setValueAtTime(900, time);
      lFilter.frequency.linearRampToValueAtTime(1800, time + 0.18);
      lFilter.frequency.linearRampToValueAtTime(650, time + 0.42);

      lGain.gain.setValueAtTime(0.0001, time);
      lGain.gain.linearRampToValueAtTime(0.058, time + 0.035);
      lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

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
      lOsc.stop(time + 0.48);
      trackActiveNode(lOsc, undefined, lGain);
    }
  }
};

export const schedulePrototypeCeleste = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const isPartTwo = step >= 64;
  const localStep = step % 64;
  const chordIndex = Math.floor(localStep / 16);

  if (isPartTwo && step % 4 === 0) {
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(120, time);
    kickOsc.frequency.exponentialRampToValueAtTime(45, time + 0.05);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(0.14, time + 0.004);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.065);
    trackActiveNode(kickOsc, undefined, kickGain);
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
    pFilter.frequency.setValueAtTime(isPartTwo ? 1400 : 900, time);

    const pVol = isPartTwo ? 0.055 : 0.075;
    pGain.gain.setValueAtTime(0.0001, time);
    pGain.gain.linearRampToValueAtTime(pVol, time + 0.008);
    pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    pOsc.connect(pFilter);
    pFilter.connect(pGain);
    pGain.connect(destination);

    pOsc.start(time);
    pOsc.stop(time + 0.2);
    trackActiveNode(pOsc, undefined, pGain);
  }

  if (isPartTwo && step % 2 === 0) {
    const synthBassMap: Record<number, number> = {
      0: 65.41,
      1: 87.31,
      2: 55.0,
      3: 49.0,
    };
    const sbFreq = safeGet(synthBassMap, chordIndex, 65.41);

    const sOsc = ctx.createOscillator();
    const sGain = ctx.createGain();
    const sFilter = ctx.createBiquadFilter();

    sGain.gain.value = 0;
    sOsc.type = 'triangle';
    sOsc.frequency.setValueAtTime(sbFreq, time);

    sFilter.type = 'lowpass';
    sFilter.frequency.setValueAtTime(450, time);

    sGain.gain.setValueAtTime(0.0001, time);
    sGain.gain.linearRampToValueAtTime(0.12, time + 0.012);
    sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    sOsc.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(destination);

    sOsc.start(time);
    sOsc.stop(time + 0.18);
    trackActiveNode(sOsc, undefined, sGain);
  }

  if (isPartTwo) {
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
      lFilter.frequency.linearRampToValueAtTime(1400, time + 0.2);
      lFilter.frequency.linearRampToValueAtTime(600, time + 0.45);

      lGain.gain.setValueAtTime(0.0001, time);
      lGain.gain.linearRampToValueAtTime(0.055, time + 0.04);
      lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.48);

      lOsc.connect(lFilter);
      lFilter.connect(lGain);
      lGain.connect(destination);

      lOsc.start(time);
      lOsc.stop(time + 0.5);
      trackActiveNode(lOsc, undefined, lGain);
    }
  }
};

export const celesteTrack: TrackModule = {
  theme: 'celeste',
  scheduleStep: scheduleCelesteStep,
  schedulePrototypeStep: schedulePrototypeCeleste,
};
