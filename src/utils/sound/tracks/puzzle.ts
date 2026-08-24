import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const schedulePuzzleStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 96); // 0: Tape Rhodes Intro, 1: Study Flow, 2: Deep Focus Solo, 3: Rainy Room Outro
  const localStep = step % 96;
  const bar = Math.floor(localStep / 16); // 0~5 마디
  const chordIndex = bar % 4;

  // -------------------------------------------------------------
  // 1. 빈티지 붐뱁 힙합 드럼 (Dusty Boom-Bap Drums & Vinyl Shaker)
  // -------------------------------------------------------------
  // (1) 더스티 로파이 킥 (Dusty Kick on 0 & 10 steps)
  if (localStep % 16 === 0 || localStep % 16 === 10) {
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(95, time);
    kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(0.14, time + 0.006);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.095);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) 빈티지 노이즈 스네어 / 림샷 탭 (Vintage Snare on 4 & 12 steps)
  if (localStep % 16 === 4 || localStep % 16 === 12) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const sSource = ctx.createBufferSource();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(1800, time);
      sFilter.Q.value = 1.1;

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.048, time + 0.004);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

      sSource.buffer = noiseBuf;
      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);
      sGain.connect(reverbSend);

      sSource.start(time);
      sSource.stop(time + 0.085);
      trackActiveNode(undefined, sSource, sGain);
    }
  }

  // (3) 레이지 스윙 하이햇 탭 (Lazy Swing Hi-Hats)
  if (step % 2 === 0) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const hSource = ctx.createBufferSource();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();
      const hPanner = createPanner(ctx, 0.2); // 우측 20% 하이햇 정위

      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(6800, time);

      const isUpbeat = localStep % 4 === 2;
      const hVol = isUpbeat ? 0.025 : 0.015;

      hGain.gain.setValueAtTime(0.0001, time);
      hGain.gain.linearRampToValueAtTime(hVol, time + 0.002);
      hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

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
      hSource.stop(time + 0.04);
      trackActiveNode(undefined, hSource, hGain);
    }
  }

  // -------------------------------------------------------------
  // 2. 딥 서브 베이스 (Round Lo-Fi Sub Bass)
  // -------------------------------------------------------------
  const subBassNotes: Record<number, number[]> = {
    0: [77.78, 0, 0, 0, 0, 0, 116.54, 0, 0, 0, 77.78, 0, 0, 0, 103.83, 0], // Ebmaj9 (Eb1, Bb1, G#1)
    1: [65.41, 0, 0, 0, 0, 0, 98.0, 0, 0, 0, 65.41, 0, 0, 0, 98.0, 0], // Cm9 (C1, G1)
    2: [87.31, 0, 0, 0, 0, 0, 130.81, 0, 0, 0, 87.31, 0, 0, 0, 130.81, 0], // Fm9 (F1, C2)
    3: [58.27, 0, 0, 0, 0, 0, 87.31, 0, 0, 0, 58.27, 0, 0, 0, 116.54, 0], // Bb13(b9) (Bb0, F1, Bb1)
  };
  const currentSubLine = safeGet(subBassNotes, chordIndex, subBassNotes[0]);
  const bFreq = safeGet(currentSubLine, localStep % 16, 0);

  if (bFreq) {
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    const bFilter = ctx.createBiquadFilter();

    bGain.gain.value = 0;
    bOsc.type = 'sine';
    bOsc.frequency.setValueAtTime(bFreq, time);

    bFilter.type = 'lowpass';
    bFilter.frequency.setValueAtTime(220, time);

    bGain.gain.setValueAtTime(0.0001, time);
    bGain.gain.linearRampToValueAtTime(0.15, time + 0.02);
    bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    bOsc.connect(bFilter);
    bFilter.connect(bGain);
    bGain.connect(destination);

    bOsc.start(time);
    bOsc.stop(time + 0.38);
    trackActiveNode(bOsc, undefined, bGain);
  }

  // -------------------------------------------------------------
  // 3. 웜 테이프 로즈 피아노 (Tape Rhodes Piano with Reverb)
  // -------------------------------------------------------------
  const isRhodesStrum = localStep % 8 === 0 || localStep % 16 === 6;
  if (isRhodesStrum) {
    const rhodesChords: Record<number, number[]> = {
      0: [155.56, 196.0, 233.08, 293.66, 349.23], // Ebmaj9 (Eb, G, Bb, D, F)
      1: [130.81, 196.0, 233.08, 261.63, 311.13], // Cm9 (C, G, Bb, C, Eb)
      2: [174.61, 207.65, 261.63, 311.13, 349.23], // Fm9 (F, Ab, C, Eb, F)
      3: [146.83, 207.65, 233.08, 293.66, 329.63], // Bb13(b9) (D, Ab, Bb, D, E)
    };
    const chordNotes = safeGet(rhodesChords, chordIndex, rhodesChords[0]);

    chordNotes.forEach((cFreq, cIdx) => {
      const rOsc = ctx.createOscillator();
      const rGain = ctx.createGain();
      const rFilter = ctx.createBiquadFilter();
      const rPanner = createPanner(ctx, -0.25); // 좌측 25% 로즈 피아노 정위

      rGain.gain.value = 0;
      rOsc.type = 'triangle';
      rOsc.frequency.setValueAtTime(cFreq, time);

      // 테이프 새츄레이션 웜 로우패스 필터
      rFilter.type = 'lowpass';
      rFilter.frequency.setValueAtTime(950, time);
      rFilter.frequency.exponentialRampToValueAtTime(450, time + 0.45);

      const rVol = cIdx === 0 ? 0.055 : 0.038;
      rGain.gain.setValueAtTime(0.0001, time);
      rGain.gain.linearRampToValueAtTime(rVol, time + 0.015);
      rGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);

      rOsc.connect(rFilter);
      rFilter.connect(rGain);

      if (rPanner) {
        rGain.connect(rPanner);
        rPanner.connect(destination);
        rPanner.connect(reverbSend);
      } else {
        rGain.connect(destination);
        rGain.connect(reverbSend);
      }

      rOsc.start(time);
      rOsc.stop(time + 0.6);
      trackActiveNode(rOsc, undefined, rGain);
    });
  }

  // -------------------------------------------------------------
  // 4. 멜로우 비닐 비브라폰 & 플루트 솔로 선율 (Mellow Vinyl Lead)
  // -------------------------------------------------------------
  if (part >= 1) {
    const lofiLead: Record<number, number> = {
      0: 587.33,
      4: 659.25,
      8: 698.46,
      12: 783.99,
      16: 698.46,
      20: 659.25,
      24: 587.33,
      28: 523.25,
      32: 659.25,
      36: 698.46,
      40: 783.99,
      44: 880.0,
      48: 783.99,
      52: 698.46,
      56: 659.25,
      60: 587.33,
      64: 523.25,
      68: 587.33,
      72: 659.25,
      76: 587.33,
      80: 523.25,
      84: 440.0,
      88: 523.25,
      92: 587.33,
    };
    const lFreq = safeGet(lofiLead, localStep, 0);

    if (lFreq) {
      const lOsc = ctx.createOscillator();
      const lGain = ctx.createGain();
      const lFilter = ctx.createBiquadFilter();
      const lPanner = createPanner(ctx, 0.22); // 우측 22% 솔로 정위

      lGain.gain.value = 0;
      lOsc.type = 'sine';
      lOsc.frequency.setValueAtTime(lFreq, time);

      lFilter.type = 'lowpass';
      lFilter.frequency.setValueAtTime(1200, time);
      lFilter.frequency.exponentialRampToValueAtTime(650, time + 0.35);

      lGain.gain.setValueAtTime(0.0001, time);
      lGain.gain.linearRampToValueAtTime(0.065, time + 0.02);
      lGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

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
      lOsc.stop(time + 0.45);
      trackActiveNode(lOsc, undefined, lGain);
    }
  }
};

export const schedulePrototypePuzzle = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  if (step % 8 === 0) {
    const jazzChords = [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 196.0, 246.94, 293.66],
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94],
    ];
    const chord = safeGet(jazzChords, Math.floor(step / 8), jazzChords[0]);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.09 : 0.05, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 1.3);
      trackActiveNode(osc, undefined, gain);
    });
  }

  const marimbaPattern = [
    523.25, 0, 659.25, 0, 0, 783.99, 0, 659.25, 493.88, 0, 587.33, 0, 0, 659.25, 0, 493.88, 440.0,
    0, 523.25, 0, 0, 659.25, 0, 523.25, 392.0, 0, 493.88, 0, 523.25, 0, 659.25, 0,
  ];

  const mFreq = safeGet(marimbaPattern, step, 0);
  if (mFreq && mFreq > 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    gain.gain.value = 0;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(mFreq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.linearRampToValueAtTime(400, time + 0.25);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.3);
    trackActiveNode(osc, undefined, gain);
  }
};

export const puzzleTrack: TrackModule = {
  theme: 'puzzle',
  scheduleStep: schedulePuzzleStep,
  schedulePrototypeStep: schedulePrototypePuzzle,
};
