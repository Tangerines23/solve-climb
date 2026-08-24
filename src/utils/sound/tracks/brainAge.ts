import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleBrainAgeStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 96); // 0: Intro Lounge, 1: Vibraphone Motif, 2: Bebop Solo, 3: Turnaround
  const localStep = step % 96;
  const bar = Math.floor(localStep / 16); // 0~5 마디

  // -------------------------------------------------------------
  // 1. 어쿠스틱 워킹 콘트라베이스 (Dual-Oscillator Warm Double Bass)
  // -------------------------------------------------------------
  const walkingBassLines: Record<number, number[][]> = {
    // Part 1: Cmaj9 -> A7(b13) -> Dm9 -> G13 -> C6 -> G7alt
    0: [
      [65.41, 82.41, 98.0, 116.54], // C -> E -> G -> Bb
      [110.0, 138.59, 164.81, 155.56], // A -> C# -> E -> Eb
      [73.42, 87.31, 110.0, 103.83], // D -> F -> A -> Ab
      [98.0, 123.47, 146.83, 138.59], // G -> B -> D -> Db
      [65.41, 82.41, 98.0, 116.54], // C -> E -> G -> Bb
      [98.0, 123.47, 146.83, 164.81], // G -> B -> D -> E
    ],
    // Part 2: Fmaj9 -> F#dim7 -> C/G -> A7(#9) -> Dm9 -> G13(b9)
    1: [
      [87.31, 110.0, 130.81, 146.83], // F -> A -> C -> D
      [92.5, 116.54, 138.59, 155.56], // F# -> A -> C -> Eb
      [65.41, 98.0, 130.81, 110.0], // C/G -> G -> C -> A
      [110.0, 138.59, 164.81, 146.83], // A7
      [73.42, 110.0, 146.83, 138.59], // Dm7 -> G7
      [65.41, 98.0, 130.81, 123.47], // Cmaj7
    ],
    // Part 3: Bebop Fast Walking with Chromatic Passing Notes
    2: [
      [65.41, 82.41, 98.0, 123.47], // C -> E -> G -> B
      [110.0, 130.81, 146.83, 155.56], // A -> C -> D -> Eb
      [73.42, 87.31, 98.0, 103.83], // D -> F -> G -> Ab
      [98.0, 123.47, 138.59, 146.83], // G -> B -> Db -> D
      [65.41, 98.0, 123.47, 130.81], // C -> G -> B -> C
      [98.0, 116.54, 138.59, 155.56], // G -> Bb -> Db -> Eb (G7alt)
    ],
    // Part 4: Tritone Substitution & Chromatic Turnaround
    3: [
      [73.42, 87.31, 110.0, 130.81], // Dm9
      [69.3, 87.31, 103.83, 123.47], // Db9 (Tritone sub of G7)
      [65.41, 82.41, 98.0, 123.47], // Cmaj9
      [61.74, 77.78, 92.5, 116.54], // B7alt
      [58.27, 73.42, 87.31, 110.0], // Bbmaj7 -> A7alt
      [65.41, 98.0, 130.81, 196.0], // Cmaj9 Final Resolution
    ],
  };
  const currentPartBass = safeGet(walkingBassLines, part, walkingBassLines[0]);
  const currentBarBass = safeGet(currentPartBass, bar, currentPartBass[0]);
  const beatIndex = Math.floor((localStep % 16) / 4);

  if (step % 4 === 0 && currentBarBass) {
    const bFreq = safeGet(currentBarBass, beatIndex, 0);
    if (bFreq) {
      // Main Body Osc (Triangle)
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, time);

      // Woody lowpass filter envelope with acoustic pluck transient
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(460, time);
      bFilter.frequency.exponentialRampToValueAtTime(160, time + 0.32);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.14, time + 0.012);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.36);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.38);
      trackActiveNode(bOsc, undefined, bGain);

      // Sub Sub-bass fundamental (Sine)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subGain.gain.value = 0;
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(bFreq, time);

      subGain.gain.setValueAtTime(0.0001, time);
      subGain.gain.linearRampToValueAtTime(0.1, time + 0.015);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

      subOsc.connect(subGain);
      subGain.connect(destination);

      subOsc.start(time);
      subOsc.stop(time + 0.35);
      trackActiveNode(subOsc, undefined, subGain);
    }
  }

  // -------------------------------------------------------------
  // 2. 웜 일렉트릭 로즈 피아노 콤핑 (Warm Stereo Rhodes Piano with Room Reverb)
  // -------------------------------------------------------------
  const isPianoComp = localStep % 16 === 0 || localStep % 16 === 6 || localStep % 16 === 10;
  if (isPianoComp) {
    const jazzChords: Record<number, number[]> = {
      0: [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9 (C, E, G, B, D)
      1: [220.0, 277.18, 329.63, 415.3, 523.25], // A7(b13) (A, C#, E, G#, C)
      2: [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9 (D, F, A, C, E)
      3: [246.94, 329.63, 392.0, 440.0, 587.33], // G13 (B, E, G, A, D)
      4: [261.63, 329.63, 392.0, 493.88, 659.25], // Cmaj7(9) (C, E, G, B, E)
      5: [246.94, 293.66, 392.0, 440.0, 587.33], // G7sus4 (B, D, G, A, D)
    };
    const chordNotes = safeGet(jazzChords, bar, jazzChords[0]);
    const panner = createPanner(ctx, -0.25); // 좌측 25% 스테레오 정위

    chordNotes.forEach((cFreq, cIdx) => {
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pFilter = ctx.createBiquadFilter();

      pGain.gain.value = 0;
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(cFreq, time);

      // Rhodes warmth filter
      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(1100, time);
      pFilter.frequency.linearRampToValueAtTime(750, time + 0.25);

      const pVol = cIdx === 0 ? 0.055 : 0.038;
      pGain.gain.setValueAtTime(0.0001, time);
      pGain.gain.linearRampToValueAtTime(pVol, time + 0.015);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

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
      pOsc.stop(time + 0.32);
      trackActiveNode(pOsc, undefined, pGain);
    });
  }

  // -------------------------------------------------------------
  // 3. 재즈 스윙 브러쉬 드럼 & 라이드 심벌 (Real Brushed Jazz Drum Kit)
  // -------------------------------------------------------------
  // (1) 부드러운 펠트 재즈 킥 (Feather Kick on 1 & 3)
  if (step % 8 === 0) {
    const kOsc = ctx.createOscillator();
    const kGain = ctx.createGain();
    kGain.gain.value = 0;
    kOsc.type = 'sine';
    kOsc.frequency.setValueAtTime(95, time);
    kOsc.frequency.exponentialRampToValueAtTime(45, time + 0.06);

    kGain.gain.setValueAtTime(0.0001, time);
    kGain.gain.linearRampToValueAtTime(0.12, time + 0.005);
    kGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

    kOsc.connect(kGain);
    kGain.connect(destination);

    kOsc.start(time);
    kOsc.stop(time + 0.075);
    trackActiveNode(kOsc, undefined, kGain);
  }

  // (2) 노이즈 버퍼 기반 재즈 브러쉬 스네어 탭 (Brush Snare on 2 & 4)
  if (step % 8 === 4) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const nSource = ctx.createBufferSource();
      const nGain = ctx.createGain();
      const nFilter = ctx.createBiquadFilter();

      nSource.buffer = noiseBuf;
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(2400, time);
      nFilter.Q.value = 1.2;

      nGain.gain.setValueAtTime(0.0001, time);
      nGain.gain.linearRampToValueAtTime(0.045, time + 0.008);
      nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

      nSource.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(destination);
      nGain.connect(reverbSend);

      nSource.start(time);
      nSource.stop(time + 0.09);
      trackActiveNode(undefined, nSource, nGain);
    }
  }

  // (3) 스윙 라이드 심벌 (Swing Ride Cymbal on 2 & 4 upbeat, 우측 패닝)
  if (step % 4 === 0 || step % 4 === 3) {
    const isAccent = step % 8 === 4;
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const rSource = ctx.createBufferSource();
      const rGain = ctx.createGain();
      const rFilter = ctx.createBiquadFilter();
      const rPanner = createPanner(ctx, 0.35); // 우측 35% 정위

      rSource.buffer = noiseBuf;
      rFilter.type = 'highpass';
      rFilter.frequency.setValueAtTime(6500, time);

      const rVol = isAccent ? 0.035 : 0.02;
      rGain.gain.setValueAtTime(0.0001, time);
      rGain.gain.linearRampToValueAtTime(rVol, time + 0.003);
      rGain.gain.exponentialRampToValueAtTime(0.0001, time + (isAccent ? 0.12 : 0.05));

      rSource.connect(rFilter);
      rFilter.connect(rGain);

      if (rPanner) {
        rGain.connect(rPanner);
        rPanner.connect(destination);
        rPanner.connect(reverbSend);
      } else {
        rGain.connect(destination);
        rGain.connect(reverbSend);
      }

      rSource.start(time);
      rSource.stop(time + 0.13);
      trackActiveNode(undefined, rSource, rGain);
    }
  }

  // -------------------------------------------------------------
  // 4. 비브라폰 & 솔로 멜로디 (Part 2 & Part 3 공간계 솔로 선율)
  // -------------------------------------------------------------
  if (part === 1 || part === 2) {
    const melodyMap: Record<number, number> = {
      0: 659.25,
      4: 783.99,
      8: 880.0,
      12: 987.77,
      16: 1046.5,
      20: 880.0,
      24: 783.99,
      28: 659.25,
      32: 587.33,
      36: 659.25,
      40: 783.99,
      44: 880.0,
      48: 987.77,
      52: 1174.66,
      56: 1046.5,
      60: 987.77,
      64: 880.0,
      68: 783.99,
      72: 659.25,
      76: 587.33,
      80: 523.25,
      84: 659.25,
      88: 783.99,
      92: 1046.5,
    };
    const mFreq = melodyMap[localStep];
    if (mFreq) {
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      const mFilter = ctx.createBiquadFilter();
      const mPanner = createPanner(ctx, 0.15); // 약간 우측 솔로 정위

      mGain.gain.value = 0;
      mOsc.type = 'triangle';
      mOsc.frequency.setValueAtTime(mFreq, time);

      // Vibraphone warm bell filter
      mFilter.type = 'lowpass';
      mFilter.frequency.setValueAtTime(1600, time);
      mFilter.frequency.exponentialRampToValueAtTime(800, time + 0.35);

      mGain.gain.setValueAtTime(0.0001, time);
      mGain.gain.linearRampToValueAtTime(0.065, time + 0.012);
      mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);

      mOsc.connect(mFilter);
      mFilter.connect(mGain);

      if (mPanner) {
        mGain.connect(mPanner);
        mPanner.connect(destination);
        mPanner.connect(reverbSend);
      } else {
        mGain.connect(destination);
        mGain.connect(reverbSend);
      }

      mOsc.start(time);
      mOsc.stop(time + 0.4);
      trackActiveNode(mOsc, undefined, mGain);
    }
  }
};

export const schedulePrototypeBrainAge = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const chordIndex = Math.floor(step / 16);

  const walkingBass: Record<number, number[]> = {
    0: [65.41, 82.41, 98.0, 116.54],
    1: [110.0, 138.59, 164.81, 155.56],
    2: [73.42, 87.31, 110.0, 103.83],
    3: [98.0, 123.47, 146.83, 138.59],
  };
  const currentBass = safeGet(walkingBass, chordIndex, walkingBass[0]);
  const beatIndex = Math.floor((step % 16) / 4);

  if (step % 4 === 0 && currentBass) {
    const bFreq = safeGet(currentBass, beatIndex, 0);
    if (bFreq) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(380, time);

      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(0.13, time + 0.015);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(time);
      bOsc.stop(time + 0.38);
      trackActiveNode(bOsc, undefined, bGain);
    }
  }

  const isPianoComp = step % 16 === 0 || step % 16 === 6 || step % 16 === 10;
  if (isPianoComp) {
    const jazzChords: Record<number, number[]> = {
      0: [261.63, 329.63, 392.0, 493.88, 587.33],
      1: [220.0, 277.18, 329.63, 415.3, 523.25],
      2: [293.66, 349.23, 440.0, 523.25, 659.25],
      3: [246.94, 329.63, 392.0, 440.0, 587.33],
    };
    const chordNotes = safeGet(jazzChords, chordIndex, jazzChords[0]);

    chordNotes.forEach((cFreq, cIdx) => {
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pFilter = ctx.createBiquadFilter();

      pGain.gain.value = 0;
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(cFreq, time);

      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(950, time);

      const pVol = cIdx === 0 ? 0.05 : 0.038;
      pGain.gain.setValueAtTime(0.0001, time);
      pGain.gain.linearRampToValueAtTime(pVol, time + 0.012);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);

      pOsc.connect(pFilter);
      pFilter.connect(pGain);
      pGain.connect(destination);

      pOsc.start(time);
      pOsc.stop(time + 0.28);
      trackActiveNode(pOsc, undefined, pGain);
    });
  }

  if (step % 8 === 4) {
    const hOsc = ctx.createOscillator();
    const hGain = ctx.createGain();
    const hFilter = ctx.createBiquadFilter();

    hGain.gain.value = 0;
    hOsc.type = 'triangle';
    hOsc.frequency.setValueAtTime(1600, time);

    hFilter.type = 'highpass';
    hFilter.frequency.setValueAtTime(2200, time);

    hGain.gain.setValueAtTime(0.0001, time);
    hGain.gain.linearRampToValueAtTime(0.035, time + 0.005);
    hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    hOsc.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(destination);

    hOsc.start(time);
    hOsc.stop(time + 0.045);
    trackActiveNode(hOsc, undefined, hGain);
  }
};

export const brainAgeTrack: TrackModule = {
  theme: 'brain_age',
  scheduleStep: scheduleBrainAgeStep,
  schedulePrototypeStep: schedulePrototypeBrainAge,
};
