import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleClimbStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 96); // 0: Ignition, 1: Acceleration, 2: Overdrive Climax, 3: Breakdown Drop
  const localStep = step % 96;
  const bar = Math.floor(localStep / 16); // 0~5 마디
  const chordIndex = bar % 4; // 0: Am, 1: F, 2: C, 3: G

  // -------------------------------------------------------------
  // 1. 일렉트로닉 파워 드럼 키트 (Electronic Power Drums)
  // -------------------------------------------------------------
  // (1) 4-on-the-Floor 파워 킥 (Part 3 빌드업 시 8비트 가속)
  const isFastBuild = part === 3 && localStep >= 64;
  const isKick = isFastBuild ? step % 2 === 0 : step % 4 === 0;

  if (isKick) {
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(140, time);
    kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.05);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(part === 2 ? 0.17 : 0.14, time + 0.003);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.058);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.065);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) 파워풀 노이즈 스네어 (Part 1, 2, 3의 2, 4박)
  if (part >= 1 && step % 8 === 4) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const sSource = ctx.createBufferSource();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sSource.buffer = noiseBuf;
      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(3200, time);
      sFilter.Q.value = 1.5;

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.06, time + 0.004);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);

      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);
      sGain.connect(reverbSend);

      sSource.start(time);
      sSource.stop(time + 0.08);
      trackActiveNode(undefined, sSource, sGain);
    }
  }

  // (3) 16비트 사이버 하이햇 롤 (Part 1, 2, 3 전용)
  if (part >= 1 && step % 2 === 0) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const hSource = ctx.createBufferSource();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();
      const hPanner = createPanner(ctx, -0.2);

      hSource.buffer = noiseBuf;
      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(8000, time);

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(0.03, time + 0.002);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

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
      hSource.stop(time + 0.035);
      trackActiveNode(undefined, hSource, hGain);
    }
  }

  // -------------------------------------------------------------
  // 2. 16비트 롤링 모듈러 신스 베이스 (Rolling Modular Synth Bass)
  // -------------------------------------------------------------
  const bassMap: Record<number, number[]> = {
    0: [55.0, 110.0, 55.0, 110.0, 82.41, 110.0, 55.0, 110.0], // Am (A1-A2)
    1: [43.65, 87.31, 43.65, 87.31, 65.41, 87.31, 43.65, 87.31], // F (F1-F2)
    2: [65.41, 130.81, 65.41, 130.81, 98.0, 130.81, 65.41, 130.81], // C (C2-C3)
    3: [49.0, 98.0, 49.0, 98.0, 73.42, 98.0, 49.0, 98.0], // G (G1-G2)
  };
  const currentBassNotes = safeGet(bassMap, chordIndex, bassMap[0]);
  const bassNote = safeGet(currentBassNotes, Math.floor((localStep % 16) / 2), 0);

  if (step % 2 === 0 && bassNote) {
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    const bFilter = ctx.createBiquadFilter();

    bGain.gain.value = 0;
    bOsc.type = 'sawtooth';
    bOsc.frequency.setValueAtTime(bassNote, time);

    bFilter.type = 'lowpass';
    // Part 3 브레이크다운 시 필터가 닫힘
    const filterFreq =
      part === 3 ? Math.max(250, 600 - (localStep / 96) * 350) : part === 2 ? 650 : 420;
    bFilter.frequency.setValueAtTime(filterFreq, time);

    bGain.gain.setValueAtTime(0.0001, time);
    bGain.gain.linearRampToValueAtTime(0.13, time + 0.008);
    bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

    bOsc.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(destination);

    bOsc.start(time);
    bOsc.stop(time + 0.16);
    trackActiveNode(bOsc, undefined, bGain);
  }

  // -------------------------------------------------------------
  // 3. 슈퍼쏘우 브라스 스탭 (Supersaw Brass Stabs with Reverb)
  // -------------------------------------------------------------
  const isStab = step % 16 === 6 || step % 16 === 12;
  if (isStab && part >= 1) {
    const stabChords: Record<number, number[]> = {
      0: [220.0, 261.63, 329.63, 440.0], // Am
      1: [174.61, 220.0, 261.63, 349.23], // F
      2: [261.63, 329.63, 392.0, 523.25], // C
      3: [196.0, 246.94, 293.66, 392.0], // G
    };
    const chordNotes = safeGet(stabChords, chordIndex, stabChords[0]);

    chordNotes.forEach((cFreq) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();
      const sPanner = createPanner(ctx, -0.25);

      sGain.gain.value = 0;
      sOsc.type = 'sawtooth';
      sOsc.frequency.setValueAtTime(cFreq, time);

      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(1400, time);
      sFilter.frequency.exponentialRampToValueAtTime(500, time + 0.18);

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.048, time + 0.012);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.19);

      sOsc.connect(sFilter);
      sFilter.connect(sGain);

      if (sPanner) {
        sGain.connect(sPanner);
        sPanner.connect(destination);
        sPanner.connect(reverbSend);
      } else {
        sGain.connect(destination);
        sGain.connect(reverbSend);
      }

      sOsc.start(time);
      sOsc.stop(time + 0.2);
      trackActiveNode(sOsc, undefined, sGain);
    });
  }

  // -------------------------------------------------------------
  // 4. 질주하는 16비트 아르페지오 & 오버드라이브 리드 솔로
  // -------------------------------------------------------------
  const arpPatterns: Record<number, number[]> = {
    0: [
      220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63, 220, 261.63, 329.63, 440, 659.25,
      523.25, 440, 329.63,
    ],
    1: [
      174.61, 220, 261.63, 349.23, 440, 349.23, 261.63, 220, 174.61, 220, 261.63, 349.23, 523.25,
      440, 349.23, 261.63,
    ],
    2: [
      130.81, 196, 261.63, 329.63, 392, 329.63, 261.63, 196, 130.81, 196, 261.63, 329.63, 523.25,
      392, 329.63, 261.63,
    ],
    3: [
      196, 246.94, 293.66, 392, 493.88, 392, 293.66, 246.94, 196, 246.94, 293.66, 392, 587.33,
      493.88, 392, 293.66,
    ],
  };
  const currentArpPattern = safeGet(arpPatterns, chordIndex, arpPatterns[0]);
  const arpFreq = safeGet(currentArpPattern, localStep % 16, 0);

  if (arpFreq) {
    const aOsc = ctx.createOscillator();
    const aGain = ctx.createGain();
    const aFilter = ctx.createBiquadFilter();
    const aPanner = createPanner(ctx, 0.2);

    aGain.gain.value = 0;
    aOsc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
    aOsc.frequency.setValueAtTime(arpFreq, time);

    aFilter.type = 'lowpass';
    aFilter.frequency.setValueAtTime(1500, time);
    aFilter.frequency.linearRampToValueAtTime(600, time + 0.1);

    aGain.gain.setValueAtTime(0.0001, time);
    aGain.gain.linearRampToValueAtTime(part === 2 ? 0.07 : 0.055, time + 0.006);
    aGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

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
    aOsc.stop(time + 0.12);
    trackActiveNode(aOsc, undefined, aGain);
  }
};

export const schedulePrototypeClimb = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const chordIndex = Math.floor(step / 16);

  const isKick = step % 4 === 0 || (step === 62 && chordIndex === 3);
  if (isKick) {
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(115, time);
    kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.05);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(0.14, time + 0.004);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.06);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  const bassMap: Record<number, number[]> = {
    0: [55.0, 110.0, 55.0, 110.0, 82.41, 110.0, 55.0, 110.0],
    1: [43.65, 87.31, 43.65, 87.31, 65.41, 87.31, 43.65, 87.31],
    2: [65.41, 130.81, 65.41, 130.81, 98.0, 130.81, 65.41, 130.81],
    3: [49.0, 98.0, 49.0, 98.0, 73.42, 98.0, 49.0, 98.0],
  };
  const currentBassNotes = safeGet(bassMap, chordIndex, bassMap[0]);
  const bassNote = safeGet(currentBassNotes, Math.floor((step % 16) / 2), 55.0);

  if (step % 2 === 0 && bassNote) {
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    const bFilter = ctx.createBiquadFilter();

    bGain.gain.value = 0;
    bOsc.type = 'triangle';
    bOsc.frequency.setValueAtTime(bassNote, time);

    bFilter.type = 'lowpass';
    bFilter.frequency.setValueAtTime(320, time);

    bGain.gain.setValueAtTime(0.0001, time);
    bGain.gain.linearRampToValueAtTime(0.12, time + 0.01);
    bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    bOsc.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(destination);

    bOsc.start(time);
    bOsc.stop(time + 0.18);
    trackActiveNode(bOsc, undefined, bGain);
  }

  const arpPatterns: Record<number, number[]> = {
    0: [
      220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63, 220, 261.63, 329.63, 440, 659.25,
      523.25, 440, 329.63,
    ],
    1: [
      174.61, 220, 261.63, 349.23, 440, 349.23, 261.63, 220, 174.61, 220, 261.63, 349.23, 523.25,
      440, 349.23, 261.63,
    ],
    2: [
      130.81, 196, 261.63, 329.63, 392, 329.63, 261.63, 196, 130.81, 196, 261.63, 329.63, 523.25,
      392, 329.63, 261.63,
    ],
    3: [
      196, 246.94, 293.66, 392, 493.88, 392, 293.66, 246.94, 196, 246.94, 293.66, 392, 587.33,
      493.88, 392, 293.66,
    ],
  };
  const currentArpPattern = safeGet(arpPatterns, chordIndex, arpPatterns[0]);
  const arpFreq = safeGet(currentArpPattern, step % 16, 0);

  if (arpFreq) {
    const aOsc = ctx.createOscillator();
    const aGain = ctx.createGain();
    const aFilter = ctx.createBiquadFilter();

    aGain.gain.value = 0;
    aOsc.type = step % 4 === 0 ? 'triangle' : 'sine';
    aOsc.frequency.setValueAtTime(arpFreq, time);

    aFilter.type = 'lowpass';
    aFilter.frequency.setValueAtTime(1400, time);
    aFilter.frequency.linearRampToValueAtTime(500, time + 0.1);

    aGain.gain.setValueAtTime(0.0001, time);
    aGain.gain.linearRampToValueAtTime(0.065, time + 0.008);
    aGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

    aOsc.connect(aFilter);
    aFilter.connect(aGain);
    aGain.connect(destination);

    aOsc.start(time);
    aOsc.stop(time + 0.12);
    trackActiveNode(aOsc, undefined, aGain);
  }

  const isStab = step % 16 === 6 || step % 16 === 12;
  if (isStab) {
    const stabChords: Record<number, number[]> = {
      0: [261.63, 329.63, 440],
      1: [261.63, 349.23, 440],
      2: [261.63, 329.63, 392],
      3: [293.66, 392, 493.88],
    };
    const chordNotes = safeGet(stabChords, chordIndex, stabChords[0]);

    chordNotes.forEach((cFreq) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sGain.gain.value = 0;
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(cFreq, time);

      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(900, time);

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.05, time + 0.015);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

      sOsc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);

      sOsc.start(time);
      sOsc.stop(time + 0.18);
      trackActiveNode(sOsc, undefined, sGain);
    });
  }
};

export const climbTrack: TrackModule = {
  theme: 'climb',
  scheduleStep: scheduleClimbStep,
  schedulePrototypeStep: schedulePrototypeClimb,
};
