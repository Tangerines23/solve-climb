import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleCrisisStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step,
  trackActiveNode,
  createPanner,
  getNoiseBuffer,
}: TrackContext): void => {
  const part = Math.floor(step / 112); // 0: Ticking Heartbeat, 1: Chromatic Pulse, 2: Emergency Siren, 3: Final Countdown
  const localStep = step % 112;
  const bar = Math.floor(localStep / 16); // 0~6 마디

  // -------------------------------------------------------------
  // 1. 쿵-쾅 더블 심장박동 서브 펄스 (LUB-DUB Heartbeat Pulse)
  // -------------------------------------------------------------
  // Part 3 카운트다운 시 4스텝마다 가속, 평상시 8스텝마다 LUB-DUB
  const isDoubleFast = part === 3 && localStep >= 64;
  const isFirstBeat = isDoubleFast ? step % 4 === 0 : step % 8 === 0;
  const isSecondBeat = isDoubleFast ? step % 4 === 1 : step % 8 === 2;

  if (isFirstBeat || isSecondBeat) {
    // (1) 메인 심장박동 트라이앵글 펀치
    const hOsc = ctx.createOscillator();
    const hGain = ctx.createGain();
    const hFilter = ctx.createBiquadFilter();

    hGain.gain.value = 0;
    hOsc.type = 'triangle';
    const startFreq = isFirstBeat ? 160 : 130;
    const endFreq = isFirstBeat ? 52 : 44;
    hOsc.frequency.setValueAtTime(startFreq, time);
    hOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.11);

    hFilter.type = 'lowpass';
    hFilter.frequency.setValueAtTime(420, time);

    const hVol = isFirstBeat ? 0.3 : 0.2;
    hGain.gain.setValueAtTime(0.0001, time);
    hGain.gain.linearRampToValueAtTime(hVol, time + 0.008);
    hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);

    hOsc.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(destination);

    hOsc.start(time);
    hOsc.stop(time + 0.15);
    trackActiveNode(hOsc, undefined, hGain);

    // (2) 가슴을 울리는 40Hz 서브 베이스 펄스
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subGain.gain.value = 0;
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isFirstBeat ? 80 : 65, time);
    subOsc.frequency.exponentialRampToValueAtTime(36, time + 0.14);

    subGain.gain.setValueAtTime(0.0001, time);
    subGain.gain.linearRampToValueAtTime(isFirstBeat ? 0.24 : 0.15, time + 0.012);
    subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);

    subOsc.connect(subGain);
    subGain.connect(destination);

    subOsc.start(time);
    subOsc.stop(time + 0.19);
    trackActiveNode(subOsc, undefined, subGain);
  }

  // -------------------------------------------------------------
  // 2. 16비트 초침 째깍거림 (Ticking Clock Percussion)
  // -------------------------------------------------------------
  const noiseBuf = getNoiseBuffer(ctx);
  if (noiseBuf && typeof ctx.createBufferSource === 'function') {
    const tSource = ctx.createBufferSource();
    const tGain = ctx.createGain();
    const tFilter = ctx.createBiquadFilter();
    // 초침이 좌우로 번갈아 째깍거리는 긴장감 연출
    const panVal = step % 2 === 0 ? -0.22 : 0.22;
    const tPanner = createPanner(ctx, panVal);

    tSource.buffer = noiseBuf;
    tFilter.type = 'bandpass';
    tFilter.frequency.setValueAtTime(4500, time);
    tFilter.Q.value = 3.5;

    const tVol = step % 4 === 0 ? 0.045 : 0.028;
    tGain.gain.setValueAtTime(0.0001, time);
    tGain.gain.linearRampToValueAtTime(tVol, time + 0.002);
    tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    tSource.connect(tFilter);
    tFilter.connect(tGain);

    if (tPanner) {
      tGain.connect(tPanner);
      tPanner.connect(destination);
      tPanner.connect(reverbSend);
    } else {
      tGain.connect(destination);
      tGain.connect(reverbSend);
    }

    tSource.start(time);
    tSource.stop(time + 0.03);
    trackActiveNode(undefined, tSource, tGain);
  }

  // -------------------------------------------------------------
  // 3. 크로매틱 반음 하강 텐션 드론 패드 (Chromatic Tension Drone)
  // -------------------------------------------------------------
  if (step % 16 === 0) {
    const tensionChords: Record<number, number[]> = {
      0: [146.83, 174.61, 220.0, 293.66], // Dm (D, F, A, D)
      1: [138.59, 174.61, 207.65, 277.18], // C#dim (C#, F, G#, C#)
      2: [130.81, 164.81, 196.0, 261.63], // C (C, E, G, C)
      3: [123.47, 155.56, 185.0, 246.94], // Bdim (B, Eb, F#, B)
    };
    const currentChord = safeGet(tensionChords, bar % 4, tensionChords[0]);

    currentChord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      // Part 3 카운트다운 시 필터가 점점 닫힘
      const fCutoff = part === 3 ? 320 : 550;
      filter.frequency.setValueAtTime(fCutoff, time);
      filter.frequency.linearRampToValueAtTime(fCutoff * 0.7, time + 1.6);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.08 : 0.045, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      gain.connect(reverbSend);

      osc.start(time);
      osc.stop(time + 1.75);
      trackActiveNode(osc, undefined, gain);
    });
  }

  // -------------------------------------------------------------
  // 4. 비상 경보 사이렌 신스 솔로 (Emergency Alarm Synth)
  // -------------------------------------------------------------
  if (part === 1 || part === 2) {
    const isSirenStep = localStep % 8 === 0 || localStep % 8 === 4;
    if (isSirenStep) {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sFilter = ctx.createBiquadFilter();
      const sPanner = createPanner(ctx, -0.28); // 좌측 28% 경보 사이렌 정위

      sGain.gain.value = 0;
      sOsc.type = 'sawtooth';
      const sirenFreq = localStep % 8 === 0 ? 880.0 : 1174.66; // A5 / D6
      sOsc.frequency.setValueAtTime(sirenFreq, time);
      sOsc.frequency.linearRampToValueAtTime(sirenFreq * 1.05, time + 0.15);

      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(1800, time);
      sFilter.Q.value = 2.0;

      sGain.gain.setValueAtTime(0.0001, time);
      sGain.gain.linearRampToValueAtTime(0.052, time + 0.015);
      sGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

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
      sOsc.stop(time + 0.3);
      trackActiveNode(sOsc, undefined, sGain);
    }
  }
};

export const schedulePrototypeCrisis = ({
  ctx,
  destination,
  time,
  step,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const isFirstBeat = step % 8 === 0;
  const isSecondBeat = step % 8 === 2;

  if (isFirstBeat || isSecondBeat) {
    const hOsc = ctx.createOscillator();
    const hGain = ctx.createGain();
    const hFilter = ctx.createBiquadFilter();

    hGain.gain.value = 0;
    hOsc.type = 'triangle';
    const startFreq = isFirstBeat ? 160 : 130;
    const endFreq = isFirstBeat ? 55 : 45;
    hOsc.frequency.setValueAtTime(startFreq, time);
    hOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.12);

    hFilter.type = 'lowpass';
    hFilter.frequency.setValueAtTime(450, time);

    const hVol = isFirstBeat ? 0.32 : 0.22;
    hGain.gain.setValueAtTime(0.0001, time);
    hGain.gain.linearRampToValueAtTime(hVol, time + 0.01);
    hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

    hOsc.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(destination);

    hOsc.start(time);
    hOsc.stop(time + 0.16);
    trackActiveNode(hOsc, undefined, hGain);

    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subGain.gain.value = 0;
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isFirstBeat ? 80 : 65, time);
    subOsc.frequency.exponentialRampToValueAtTime(38, time + 0.15);

    subGain.gain.setValueAtTime(0.0001, time);
    subGain.gain.linearRampToValueAtTime(isFirstBeat ? 0.25 : 0.16, time + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    subOsc.connect(subGain);
    subGain.connect(destination);

    subOsc.start(time);
    subOsc.stop(time + 0.2);
    trackActiveNode(subOsc, undefined, subGain);
  }

  if (step % 16 === 0) {
    const tensionChord =
      step < 16 ? [110.0, 164.81, 220.0, 261.63, 311.13] : [82.41, 123.47, 164.81, 207.65, 246.94];

    tensionChord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      gain.gain.value = 0;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.linearRampToValueAtTime(350, time + 1.8);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.1 : 0.055, time + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(time);
      osc.stop(time + 1.85);
      trackActiveNode(osc, undefined, gain);
    });
  }

  if (step % 2 === 0) {
    const tOsc = ctx.createOscillator();
    const tGain = ctx.createGain();
    const tFilter = ctx.createBiquadFilter();

    tGain.gain.value = 0;
    tOsc.type = 'triangle';
    tOsc.frequency.setValueAtTime(2800, time);

    tFilter.type = 'highpass';
    tFilter.frequency.setValueAtTime(2500, time);

    tGain.gain.setValueAtTime(0.0001, time);
    tGain.gain.linearRampToValueAtTime(0.05, time + 0.003);
    tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    tOsc.connect(tFilter);
    tFilter.connect(tGain);
    tGain.connect(destination);

    tOsc.start(time);
    tOsc.stop(time + 0.035);
    trackActiveNode(tOsc, undefined, tGain);
  }
};

export const crisisTrack: TrackModule = {
  theme: 'crisis',
  scheduleStep: scheduleCrisisStep,
  schedulePrototypeStep: schedulePrototypeCrisis,
};
