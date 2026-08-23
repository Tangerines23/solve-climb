import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleVictoryStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 96); // 0: Grand Fanfare, 1: Trumpet Lead, 2: Summit Climax, 3: Vista Glory
  const localStep = step % 96;
  const bar = Math.floor(localStep / 16); // 0~5 마디
  const chordIndex = bar % 4;

  // -------------------------------------------------------------
  // 1. 오케스트라 마칭 퍼커션 (Timpani Kick, Marching Snare, Cymbal)
  // -------------------------------------------------------------
  // (1) 웅장한 팀파니 킥 (1박 & 3박)
  if (localStep % 8 === 0) {
    const isDownbeat = localStep % 16 === 0;
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickGain.gain.value = 0;
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(isDownbeat ? 105 : 90, time);
    kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

    kickGain.gain.setValueAtTime(0.0001, time);
    kickGain.gain.linearRampToValueAtTime(isDownbeat ? 0.16 : 0.11, time + 0.005);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

    kickOsc.connect(kickGain);
    kickGain.connect(destination);

    kickOsc.start(time);
    kickOsc.stop(time + 0.1);
    trackActiveNode(kickOsc, undefined, kickGain);
  }

  // (2) 노이즈 버퍼 기반 군악대 마칭 스네어 (Marching Snare Roll)
  const isSnare = localStep % 4 === 2 || localStep % 8 === 4 || (part === 2 && localStep % 2 === 1);
  if (isSnare) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const sSource = ctx.createBufferSource();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();

      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(3000, time);
      sFilter.Q.value = 1.3;

      const sVol = localStep % 8 === 4 ? 0.055 : 0.035;
      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(sVol, time + 0.003);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

      sSource.buffer = noiseBuf;
      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(destination);
      sGain.connect(reverbSend);

      sSource.start(time);
      sSource.stop(time + 0.065);
      trackActiveNode(undefined, sSource, sGain);
    }
  }

  // (3) 승리의 심벌 크래쉬 (Crash Cymbal on bar 0)
  if (localStep === 0) {
    const noiseBuf = getNoiseBuffer(ctx);
    if (noiseBuf && typeof ctx.createBufferSource === 'function') {
      const cSource = ctx.createBufferSource();
      const cGain = ctx.createGain();
      const cFilter = ctx.createBiquadFilter();
      const cPanner = createPanner(ctx, 0.3);

      cFilter.type = 'highpass';
      cFilter.frequency.setValueAtTime(5500, time);

      cGain.gain.setValueAtTime(0.0001, time);
      cGain.gain.linearRampToValueAtTime(0.06, time + 0.005);
      cGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

      cSource.buffer = noiseBuf;
      cSource.connect(cFilter);
      cFilter.connect(cGain);

      if (cPanner) {
        cGain.connect(cPanner);
        cPanner.connect(destination);
        cPanner.connect(reverbSend);
      } else {
        cGain.connect(destination);
        cGain.connect(reverbSend);
      }

      cSource.start(time);
      cSource.stop(time + 0.45);
      trackActiveNode(undefined, cSource, cGain);
    }
  }

  // -------------------------------------------------------------
  // 2. 웅장한 브라스 신스 팡파르 화음 (Majestic Brass Fanfare)
  // -------------------------------------------------------------
  if (localStep % 16 === 0 || (part === 2 && localStep % 16 === 8)) {
    const victoryChords: Record<number, number[]> = {
      0: [174.61, 220.0, 261.63, 329.63, 440.0], // Fmaj7 (F, A, C, E, A)
      1: [196.0, 246.94, 293.66, 349.23, 392.0], // G7 (G, B, D, F, G)
      2: [164.81, 196.0, 246.94, 329.63, 392.0], // Em7 (E, G, B, E, G)
      3: [130.81, 196.0, 261.63, 329.63, 523.25], // Cmaj7 (C, G, C, E, C)
    };
    const chord = safeGet(victoryChords, chordIndex, victoryChords[0]);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = createPanner(ctx, i % 2 === 0 ? -0.2 : 0.2);

      gain.gain.value = 0;
      osc.type = i === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, time);
      filter.frequency.linearRampToValueAtTime(1600, time + 0.4);
      filter.frequency.linearRampToValueAtTime(650, time + 1.8);

      const vol = i === 0 ? 0.1 : 0.042;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

      osc.connect(filter);
      filter.connect(gain);

      if (panner) {
        gain.connect(panner);
        panner.connect(destination);
        panner.connect(reverbSend);
      } else {
        gain.connect(destination);
        gain.connect(reverbSend);
      }

      osc.start(time);
      osc.stop(time + 2.0);
      trackActiveNode(osc, undefined, gain);
    });
  }

  // -------------------------------------------------------------
  // 3. 천상의 하프 글리산도 & 벨 차임 (Heavenly Harp Glissando)
  // -------------------------------------------------------------
  const arpSeq = [
    523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 880.0, 1174.66, 659.25, 783.99, 987.77, 1318.51,
    783.99, 1046.5, 1318.51, 1567.98,
  ];
  const harpFreq = safeGet(arpSeq, localStep % 16, 0);

  if (harpFreq) {
    const hOsc = ctx.createOscillator();
    const hGain = ctx.createGain();
    const hFilter = ctx.createBiquadFilter();
    // 하프 현이 좌우로 번갈아 튕겨나가는 입체 패닝
    const panVal = localStep % 2 === 0 ? -0.32 : 0.32;
    const hPanner = createPanner(ctx, panVal);

    hGain.gain.value = 0;
    hOsc.type = 'sine';
    hOsc.frequency.setValueAtTime(harpFreq, time);

    hFilter.type = 'lowpass';
    hFilter.frequency.setValueAtTime(2200, time);

    hGain.gain.setValueAtTime(0.0001, time);
    hGain.gain.linearRampToValueAtTime(0.048, time + 0.008);
    hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

    hOsc.connect(hFilter);
    hFilter.connect(hGain);

    if (hPanner) {
      hGain.connect(hPanner);
      hPanner.connect(destination);
      hPanner.connect(reverbSend);
    } else {
      hGain.connect(destination);
      hGain.connect(reverbSend);
    }

    hOsc.start(time);
    hOsc.stop(time + 0.35);
    trackActiveNode(hOsc, undefined, hGain);
  }

  // -------------------------------------------------------------
  // 4. 승리의 트럼펫 리드 솔로 선율 (Triumphant Trumpet Lead with Reverb)
  // -------------------------------------------------------------
  if (part === 1 || part === 2) {
    const trumpetLead: Record<number, number> = {
      0: 523.25,
      4: 659.25,
      8: 783.99,
      12: 1046.5,
      16: 987.77,
      20: 880.0,
      24: 783.99,
      28: 659.25,
      32: 587.33,
      36: 783.99,
      40: 880.0,
      44: 1174.66,
      48: 1046.5,
      52: 987.77,
      56: 880.0,
      60: 783.99,
      64: 659.25,
      68: 783.99,
      72: 880.0,
      76: 1046.5,
      80: 1318.51,
      84: 1174.66,
      88: 1046.5,
      92: 1318.51,
    };
    const tFreq = safeGet(trumpetLead, localStep, 0);

    if (tFreq) {
      const tOsc = ctx.createOscillator();
      const tGain = ctx.createGain();
      const tFilter = ctx.createBiquadFilter();
      const tPanner = createPanner(ctx, 0.15); // 중앙 우측 트럼펫 정위

      tGain.gain.value = 0;
      tOsc.type = 'sawtooth';
      tOsc.frequency.setValueAtTime(tFreq, time);

      tFilter.type = 'lowpass';
      tFilter.frequency.setValueAtTime(1100, time);
      tFilter.frequency.linearRampToValueAtTime(2200, time + 0.15);
      tFilter.frequency.linearRampToValueAtTime(850, time + 0.4);

      tGain.gain.setValueAtTime(0.0001, time);
      tGain.gain.linearRampToValueAtTime(0.065, time + 0.02);
      tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

      tOsc.connect(tFilter);
      tFilter.connect(tGain);

      if (tPanner) {
        tGain.connect(tPanner);
        tPanner.connect(destination);
        tPanner.connect(reverbSend);
      } else {
        tGain.connect(destination);
        tGain.connect(reverbSend);
      }

      tOsc.start(time);
      tOsc.stop(time + 0.45);
      trackActiveNode(tOsc, undefined, tGain);
    }
  }
};

export const schedulePrototypeVictory = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const chordIndex = Math.floor(step / 16);

  if (step % 16 === 0) {
    const victoryChords: Record<number, number[]> = {
      0: [174.61, 220.0, 261.63, 329.63, 440.0],
      1: [196.0, 246.94, 293.66, 349.23, 392.0],
      2: [164.81, 196.0, 246.94, 329.63, 392.0],
      3: [130.81, 196.0, 261.63, 329.63, 523.25],
    };
    const chord = safeGet(victoryChords, chordIndex, victoryChords[0]);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = i === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);
      filter.frequency.linearRampToValueAtTime(1400, time + 0.5);
      filter.frequency.linearRampToValueAtTime(600, time + 2.1);

      const vol = i === 0 ? 0.11 : 0.045;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 2.4);
      trackActiveNode(osc, undefined, gain);
    });
  }

  const arpSeq = [
    523.25, 659.25, 783.99, 1046.5, 587.33, 783.99, 880.0, 1174.66, 659.25, 783.99, 987.77, 1318.51,
    783.99, 1046.5, 1318.51, 1567.98,
  ];
  const harpFreq = safeGet(arpSeq, step % 16, 523.25);
  if (harpFreq) {
    const hOsc = ctx.createOscillator();
    const hGain = ctx.createGain();
    hGain.gain.value = 0;
    hOsc.type = 'sine';
    hOsc.frequency.setValueAtTime(harpFreq, time);

    hGain.gain.setValueAtTime(0.0001, time);
    hGain.gain.linearRampToValueAtTime(0.045, time + 0.01);
    hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    hOsc.connect(hGain);
    hGain.connect(destination);

    hOsc.start(time);
    hOsc.stop(time + 0.38);
    trackActiveNode(hOsc, undefined, hGain);
  }
};

export const victoryTrack: TrackModule = {
  theme: 'victory',
  scheduleStep: scheduleVictoryStep,
  schedulePrototypeStep: schedulePrototypeVictory,
};
