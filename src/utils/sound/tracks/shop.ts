import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleShopStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 96); // 0: Cozy Welcome, 1: Browsing, 2: Melodica Solo, 3: Warm Resolution
  const localStep = step % 96;
  const bar = Math.floor(localStep / 16); // 0~5 마디
  const chordIndex = bar % 4;

  // -------------------------------------------------------------
  // 1. 보사노바 어쿠스틱 퍼커션 (Soft Kick, Shaker, Woodblock Clave)
  // -------------------------------------------------------------
  // (1) 부드러운 펠트 킥 (1박 & 3박 당김음)
  if (localStep % 16 === 0 || localStep % 16 === 10) {
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(85, time);
    kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.06);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(0.09, time + 0.004);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.075);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) 노이즈 버퍼 기반 찰랑거리는 16비트 보사노바 셰이커 (Shaker Tap)
  const noiseBuf = getNoiseBuffer(ctx);
  if (noiseBuf && typeof ctx.createBufferSource === 'function') {
    const shSource = ctx.createBufferSource();
    const shGain = ctx.createGain();
    const shFilter = ctx.createBiquadFilter();
    const shPanner = createPanner(ctx, 0.25); // 우측 25% 셰이커 정위

    shFilter.type = 'bandpass';
    shFilter.frequency.setValueAtTime(6200, time);
    shFilter.Q.value = 2.0;

    // 16비트 스텝별 미세 강약 (Accents on upbeat)
    const isAccent = localStep % 4 === 2;
    const shVol = isAccent ? 0.026 : 0.015;

    shGain.gain.setValueAtTime(0.0001, time);
    shGain.gain.linearRampToValueAtTime(shVol, time + 0.002);
    shGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    shSource.buffer = noiseBuf;
    shSource.connect(shFilter);
    shFilter.connect(shGain);

    if (shPanner) {
      shGain.connect(shPanner);
      shPanner.connect(destination);
      shPanner.connect(reverbSend);
    } else {
      shGain.connect(destination);
      shGain.connect(reverbSend);
    }

    shSource.start(time);
    shSource.stop(time + 0.03);
    trackActiveNode(undefined, shSource, shGain);
  }

  // (3) 우드블록 / 클라베 림샷 (Woodblock Rimshot on 4, 10, 14 steps)
  const isWoodblock = localStep % 16 === 4 || localStep % 16 === 10 || localStep % 16 === 14;
  if (isWoodblock) {
    const wbOsc = ctx.createOscillator();
    const wbGain = ctx.createGain();
    const wbFilter = ctx.createBiquadFilter();
    const wbPanner = createPanner(ctx, -0.2);

    wbGain.gain.value = 0;
    wbOsc.type = 'triangle';
    wbOsc.frequency.setValueAtTime(localStep % 16 === 4 ? 850 : 1020, time);

    wbFilter.type = 'bandpass';
    wbFilter.frequency.setValueAtTime(2400, time);
    wbFilter.Q.value = 3.5;

    wbGain.gain.setValueAtTime(0.0001, time);
    wbGain.gain.linearRampToValueAtTime(0.045, time + 0.003);
    wbGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    wbOsc.connect(wbFilter);
    wbFilter.connect(wbGain);

    if (wbPanner) {
      wbGain.connect(wbPanner);
      wbPanner.connect(destination);
      wbPanner.connect(reverbSend);
    } else {
      wbGain.connect(destination);
      wbGain.connect(reverbSend);
    }

    wbOsc.start(time);
    wbOsc.stop(time + 0.04);
    trackActiveNode(wbOsc, undefined, wbGain);
  }

  // (4) 맑은 샵 카운터 벨 (Shop Counter Bell on bar 0)
  if (localStep === 0 && (part === 0 || part === 2)) {
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    const bellFilter = ctx.createBiquadFilter();

    bellGain.gain.value = 0;
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2093.0, time); // C7

    bellFilter.type = 'highpass';
    bellFilter.frequency.setValueAtTime(1800, time);

    bellGain.gain.setValueAtTime(0.0001, time);
    bellGain.gain.linearRampToValueAtTime(0.035, time + 0.004);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

    bellOsc.connect(bellFilter);
    bellFilter.connect(bellGain);
    bellGain.connect(destination);
    bellGain.connect(reverbSend);

    bellOsc.start(time);
    bellOsc.stop(time + 0.45);
    trackActiveNode(bellOsc, undefined, bellGain);
  }

  // -------------------------------------------------------------
  // 2. 어쿠스틱 콘트라베이스 (Upright Bossa Bass)
  // -------------------------------------------------------------
  const bossaBassPatterns: Record<number, number[]> = {
    0: [87.31, 0, 0, 0, 0, 0, 130.81, 0, 0, 0, 87.31, 0, 0, 0, 130.81, 0], // Fmaj7 (F1, C2)
    1: [73.42, 0, 0, 0, 0, 0, 110.0, 0, 0, 0, 73.42, 0, 0, 0, 110.0, 0], // Dm9 (D1, A1)
    2: [98.0, 0, 0, 0, 0, 0, 146.83, 0, 0, 0, 98.0, 0, 0, 0, 146.83, 0], // Gm7 (G1, D2)
    3: [65.41, 0, 0, 0, 0, 0, 98.0, 0, 0, 0, 65.41, 0, 0, 0, 123.47, 0], // C13(b9) (C1, G1, B1)
  };
  const currentBassPattern = safeGet(bossaBassPatterns, chordIndex, bossaBassPatterns[0]);
  const bFreq = safeGet(currentBassPattern, localStep % 16, 0);

  if (bFreq) {
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    const bFilter = ctx.createBiquadFilter();

    bGain.gain.value = 0;
    bOsc.type = 'triangle';
    bOsc.frequency.setValueAtTime(bFreq, time);

    bFilter.type = 'lowpass';
    bFilter.frequency.setValueAtTime(260, time);

    bGain.gain.setValueAtTime(0.0001, time);
    bGain.gain.linearRampToValueAtTime(0.12, time + 0.015);
    bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    bOsc.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(destination);

    bOsc.start(time);
    bOsc.stop(time + 0.3);
    trackActiveNode(bOsc, undefined, bGain);
  }

  // -------------------------------------------------------------
  // 3. 어쿠스틱 나일론 기타 (Nylon Acoustic Fingerstyle Guitar with Reverb)
  // -------------------------------------------------------------
  const isStrum =
    localStep % 16 === 0 ||
    localStep % 16 === 3 ||
    localStep % 16 === 6 ||
    localStep % 16 === 10 ||
    localStep % 16 === 12;

  if (isStrum) {
    const shopChords: Record<number, number[]> = {
      0: [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      1: [146.83, 220.0, 261.63, 329.63], // Dm9 (D3, A3, C4, E4)
      2: [196.0, 220.0, 261.63, 349.23], // Gm7 (G3, Bb3, D4, F4)
      3: [164.81, 220.0, 261.63, 329.63], // C13 (E3, A3, C4, E4)
    };
    const chordNotes = safeGet(shopChords, chordIndex, shopChords[0]);

    chordNotes.forEach((cFreq, cIdx) => {
      const gOsc = ctx.createOscillator();
      const gGain = ctx.createGain();
      const gFilter = ctx.createBiquadFilter();
      const gPanner = createPanner(ctx, -0.25); // 좌측 25% 나일론 기타 정위

      gGain.gain.value = 0;
      gOsc.type = 'triangle';
      gOsc.frequency.setValueAtTime(cFreq, time);

      gFilter.type = 'lowpass';
      gFilter.frequency.setValueAtTime(1250, time);
      gFilter.frequency.exponentialRampToValueAtTime(600, time + 0.18);

      const gVol = cIdx === 0 ? 0.048 : 0.035;
      gGain.gain.setValueAtTime(0.0001, time);
      gGain.gain.linearRampToValueAtTime(gVol, time + 0.008);
      gGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

      gOsc.connect(gFilter);
      gFilter.connect(gGain);

      if (gPanner) {
        gGain.connect(gPanner);
        gPanner.connect(destination);
        gPanner.connect(reverbSend);
      } else {
        gGain.connect(destination);
        gGain.connect(reverbSend);
      }

      gOsc.start(time);
      gOsc.stop(time + 0.22);
      trackActiveNode(gOsc, undefined, gGain);
    });
  }

  // -------------------------------------------------------------
  // 4. 감미로운 멜로디카 & 아코디언 솔로 선율 (Melodica Lead with Reverb)
  // -------------------------------------------------------------
  if (part >= 1) {
    const melodicaLead: Record<number, number> = {
      0: 659.25,
      4: 698.46,
      8: 783.99,
      12: 880.0,
      16: 1046.5,
      20: 880.0,
      24: 783.99,
      28: 698.46,
      32: 659.25,
      36: 587.33,
      40: 523.25,
      44: 587.33,
      48: 659.25,
      52: 783.99,
      56: 880.0,
      60: 1046.5,
      64: 987.77,
      68: 880.0,
      72: 783.99,
      76: 698.46,
      80: 659.25,
      84: 587.33,
      88: 523.25,
      92: 440.0,
    };
    const mFreq = safeGet(melodicaLead, localStep, 0);

    if (mFreq) {
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      const mFilter = ctx.createBiquadFilter();
      const mPanner = createPanner(ctx, 0.22); // 우측 22% 멜로디카 정위

      mGain.gain.value = 0;
      mOsc.type = 'triangle';
      mOsc.frequency.setValueAtTime(mFreq, time);

      mFilter.type = 'lowpass';
      mFilter.frequency.setValueAtTime(1400, time);
      mFilter.frequency.exponentialRampToValueAtTime(750, time + 0.3);

      mGain.gain.setValueAtTime(0.0001, time);
      mGain.gain.linearRampToValueAtTime(0.065, time + 0.015);
      mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

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
      mOsc.stop(time + 0.35);
      trackActiveNode(mOsc, undefined, mGain);
    }
  }
};

export const schedulePrototypeShop = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const chordIndex = Math.floor(step / 16);

  const bossaBass: Record<number, { step: number; freq: number }[]> = {
    0: [
      { step: 0, freq: 65.41 },
      { step: 6, freq: 98.0 },
      { step: 10, freq: 65.41 },
      { step: 14, freq: 98.0 },
    ],
    1: [
      { step: 0, freq: 110.0 },
      { step: 6, freq: 164.81 },
      { step: 10, freq: 110.0 },
      { step: 14, freq: 155.56 },
    ],
    2: [
      { step: 0, freq: 73.42 },
      { step: 6, freq: 110.0 },
      { step: 10, freq: 73.42 },
      { step: 14, freq: 110.0 },
    ],
    3: [
      { step: 0, freq: 98.0 },
      { step: 6, freq: 146.83 },
      { step: 10, freq: 98.0 },
      { step: 14, freq: 123.47 },
    ],
  };
  const currentBassEvents = safeGet(bossaBass, chordIndex, bossaBass[0]);
  const bassEvent = currentBassEvents.find((e) => e.step === step % 16);

  if (bassEvent) {
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    const bFilter = ctx.createBiquadFilter();

    bGain.gain.value = 0;
    bOsc.type = 'triangle';
    bOsc.frequency.setValueAtTime(bassEvent.freq, time);

    bFilter.type = 'lowpass';
    bFilter.frequency.setValueAtTime(280, time);

    bGain.gain.setValueAtTime(0.0001, time);
    bGain.gain.linearRampToValueAtTime(0.12, time + 0.015);
    bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    bOsc.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(destination);

    bOsc.start(time);
    bOsc.stop(time + 0.3);
    trackActiveNode(bOsc, undefined, bGain);
  }

  const isStrum = step % 16 === 0 || step % 16 === 6 || step % 16 === 10 || step % 16 === 14;
  if (isStrum) {
    const shopChords: Record<number, number[]> = {
      0: [261.63, 329.63, 392.0, 493.88],
      1: [277.18, 329.63, 392.0, 466.16],
      2: [293.66, 349.23, 440.0, 523.25],
      3: [246.94, 329.63, 349.23, 440.0],
    };
    const chordNotes = safeGet(shopChords, chordIndex, shopChords[0]);

    chordNotes.forEach((cFreq, cIdx) => {
      const uOsc = ctx.createOscillator();
      const uGain = ctx.createGain();
      const uFilter = ctx.createBiquadFilter();

      uGain.gain.value = 0;
      uOsc.type = 'triangle';
      uOsc.frequency.setValueAtTime(cFreq, time);

      uFilter.type = 'lowpass';
      uFilter.frequency.setValueAtTime(1100, time);

      const uVol = cIdx === 0 ? 0.045 : 0.032;
      uGain.gain.setValueAtTime(0.0001, time);
      uGain.gain.linearRampToValueAtTime(uVol, time + 0.01);
      uGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      uOsc.connect(uFilter);
      uFilter.connect(uGain);
      uGain.connect(destination);

      uOsc.start(time);
      uOsc.stop(time + 0.24);
      trackActiveNode(uOsc, undefined, uGain);
    });
  }

  const melodyMap: Record<number, number[]> = {
    0: [659.25, 0, 783.99, 0, 880.0, 0, 987.77, 0, 783.99, 0, 659.25, 0, 587.33, 0, 523.25, 0],
    1: [554.37, 0, 659.25, 0, 783.99, 0, 932.33, 0, 783.99, 0, 659.25, 0, 698.46, 0, 0, 0],
    2: [698.46, 0, 880.0, 0, 1046.5, 0, 880.0, 0, 698.46, 0, 587.33, 0, 659.25, 0, 0, 0],
    3: [587.33, 0, 783.99, 0, 987.77, 0, 1174.66, 0, 987.77, 0, 783.99, 0, 523.25, 0, 0, 0],
  };
  const currentMelody = safeGet(melodyMap, chordIndex, melodyMap[0]);
  const mFreq = safeGet(currentMelody, step % 16, 0);

  if (mFreq && mFreq > 0) {
    const mOsc = ctx.createOscillator();
    const mGain = ctx.createGain();
    const mFilter = ctx.createBiquadFilter();

    mGain.gain.value = 0;
    mOsc.type = 'sine';
    mOsc.frequency.setValueAtTime(mFreq, time);

    mFilter.type = 'lowpass';
    mFilter.frequency.setValueAtTime(1600, time);

    mGain.gain.setValueAtTime(0.0001, time);
    mGain.gain.linearRampToValueAtTime(0.07, time + 0.008);
    mGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    mOsc.connect(mFilter);
    mFilter.connect(mGain);
    mGain.connect(destination);

    mOsc.start(time);
    mOsc.stop(time + 0.24);
    trackActiveNode(mOsc, undefined, mGain);
  }

  if (step % 8 === 4) {
    const wOsc = ctx.createOscillator();
    const wGain = ctx.createGain();
    const wFilter = ctx.createBiquadFilter();

    wGain.gain.value = 0;
    wOsc.type = 'triangle';
    wOsc.frequency.setValueAtTime(1400, time);

    wFilter.type = 'bandpass';
    wFilter.frequency.setValueAtTime(1400, time);

    wGain.gain.setValueAtTime(0.0001, time);
    wGain.gain.linearRampToValueAtTime(0.04, time + 0.004);
    wGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    wOsc.connect(wFilter);
    wFilter.connect(wGain);
    wGain.connect(destination);

    wOsc.start(time);
    wOsc.stop(time + 0.04);
    trackActiveNode(wOsc, undefined, wGain);
  }
};

export const shopTrack: TrackModule = {
  theme: 'shop',
  scheduleStep: scheduleShopStep,
  schedulePrototypeStep: schedulePrototypeShop,
};
