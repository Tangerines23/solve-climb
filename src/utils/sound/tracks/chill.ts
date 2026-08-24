import type { TrackModule, TrackContext, PrototypeTrackContext } from './types';
import { safeGet } from './helpers';

export const scheduleChillStep = ({
  ctx,
  destination,
  reverbSend,
  time,
  step: stepIndex,
  trackActiveNode,
  createPanner,
}: TrackContext): void => {
  const sTime = Math.max(time, ctx.currentTime);
  const localStep = stepIndex % 256; // 16마디 루프 (~50.5초)
  const barIndex = Math.floor(localStep / 16); // 0~15 마디
  const subStep = localStep % 16; // 0~15 (16분음표)
  const progBar = barIndex % 8; // 8마디 코드 순환

  // F Lydian / C Major 부유하는 모달 하모니 진행 (Fmaj7#11 ➔ Cmaj9 ➔ Am9 ➔ Gsus4)
  const modalChords = [
    // 0~1: Fmaj7(#11) (F2 베이스, C4-E4-B4-E5-A4 오스티나토)
    {
      name: 'Fmaj7#11',
      root: 87.31,
      bass: 43.65,
      notes: [261.63, 329.63, 493.88, 659.25, 440.0],
    },
    {
      name: 'Fmaj7#11',
      root: 87.31,
      bass: 43.65,
      notes: [261.63, 329.63, 493.88, 659.25, 440.0],
    },
    // 2~3: Cmaj9/E (E2 베이스, G3-D4-E4-G4-D5)
    { name: 'Cmaj9/E', root: 82.41, bass: 41.2, notes: [196.0, 293.66, 329.63, 392.0, 587.33] },
    { name: 'Cmaj9/E', root: 82.41, bass: 41.2, notes: [196.0, 293.66, 329.63, 392.0, 587.33] },
    // 4~5: Am9 (A1 베이스, C4-E4-G4-B4-E5)
    { name: 'Am9', root: 110.0, bass: 55.0, notes: [261.63, 329.63, 392.0, 493.88, 659.25] },
    { name: 'Am9', root: 110.0, bass: 55.0, notes: [261.63, 329.63, 392.0, 493.88, 659.25] },
    // 6~7: Gsus4(add9) ➔ G (G1 베이스, D4-G4-A4-B4-D5)
    { name: 'Gsus4', root: 98.0, bass: 49.0, notes: [293.66, 392.0, 440.0, 493.88, 587.33] },
    { name: 'Gsus4', root: 98.0, bass: 49.0, notes: [293.66, 392.0, 440.0, 493.88, 587.33] },
  ];

  const chord = safeGet(modalChords, progBar, modalChords[0]);

  // -------------------------------------------------------------
  // 1. 🪵 C418 스타일 엇박 아날로그 오스티나토 (Warm Analog Ostinato - 전 파트)
  // 3+3+2+3+3 폴리리듬 당김음 패턴 (ticks: 0, 3, 6, 8, 11, 14)
  // -------------------------------------------------------------
  const ostinatoTicks = [0, 3, 6, 8, 11, 14];
  const tickIdx = ostinatoTicks.indexOf(subStep);

  if (tickIdx !== -1) {
    const oFreq = safeGet(chord.notes, tickIdx % chord.notes.length, chord.notes[0]);

    try {
      const oOsc = ctx.createOscillator();
      const oGain = ctx.createGain();
      const oFilter = ctx.createBiquadFilter();
      const oPanner = createPanner(ctx, (tickIdx % 2 === 0 ? -1 : 1) * 0.16);

      oGain.gain.value = 0;
      // 빈티지 웜 아날로그 톤 (삼각파와 사인의 부드러운 하모니)
      oOsc.type = tickIdx === 0 || tickIdx === 3 ? 'triangle' : 'sine';
      oOsc.frequency.setValueAtTime(oFreq, sTime);

      oFilter.type = 'lowpass';
      oFilter.frequency.setValueAtTime(680, sTime);

      // 둥글고 몽환적인 엔벨로프 (짧은 어택 + 맑은 감쇠)
      const oVol = tickIdx === 0 ? 0.055 : 0.042;
      oGain.gain.setValueAtTime(0.0001, sTime);
      oGain.gain.linearRampToValueAtTime(oVol, sTime + 0.015);
      oGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.55);

      oOsc.connect(oFilter);
      oFilter.connect(oGain);

      if (oPanner) {
        oGain.connect(oPanner);
        oPanner.connect(destination);
        oPanner.connect(reverbSend);
      } else {
        oGain.connect(destination);
        oGain.connect(reverbSend);
      }

      oOsc.start(sTime);
      oOsc.stop(sTime + 0.6);
      trackActiveNode(oOsc, undefined, oGain);
    } catch {
      // audio safe
    }
  }

  // -------------------------------------------------------------
  // 2. ⚡ 부유하는 웜 서브 펄스 (Buoyant Warm Sub Pulse - Part 2, 3, 4: stepIndex >= 64)
  // 엇박으로 둥- 둥- 받쳐주는 따뜻한 아날로그 서브 베이스
  // -------------------------------------------------------------
  if (stepIndex >= 64 && (subStep === 0 || subStep === 6)) {
    try {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      const bFilter = ctx.createBiquadFilter();

      bGain.gain.value = 0;
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(subStep === 0 ? chord.bass : chord.root * 0.5, sTime);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(140, sTime);

      const bVol = subStep === 0 ? 0.08 : 0.095;
      bGain.gain.setValueAtTime(0.0001, sTime);
      bGain.gain.linearRampToValueAtTime(bVol, sTime + 0.08);
      bGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 1.2);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(destination);

      bOsc.start(sTime);
      bOsc.stop(sTime + 1.25);
      trackActiveNode(bOsc, undefined, bGain);
    } catch {
      // audio safe
    }
  }

  // -------------------------------------------------------------
  // 3. 🌫️ 필터드 아날로그 스트링 패드 (Airy Analog Strings - Part 3, 4: stepIndex >= 128)
  // 저역에서 서서히 열리는 맑은 공기감의 아날로그 패드
  // -------------------------------------------------------------
  if (stepIndex >= 128 && subStep === 0) {
    chord.notes.slice(0, 3).forEach((freq, pIdx) => {
      try {
        const pOsc = ctx.createOscillator();
        const pGain = ctx.createGain();
        const pFilter = ctx.createBiquadFilter();
        const pPanner = createPanner(ctx, (pIdx - 1) * 0.22);

        pGain.gain.value = 0;
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(freq * 0.5, sTime);

        pFilter.type = 'lowpass';
        pFilter.frequency.setValueAtTime(200, sTime);
        pFilter.frequency.linearRampToValueAtTime(460, sTime + 0.8);
        pFilter.frequency.linearRampToValueAtTime(220, sTime + 2.8);

        pGain.gain.setValueAtTime(0.0001, sTime);
        pGain.gain.linearRampToValueAtTime(0.038, sTime + 0.4);
        pGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 2.9);

        pOsc.connect(pFilter);
        pFilter.connect(pGain);

        if (pPanner) {
          pGain.connect(pPanner);
          pPanner.connect(destination);
          pPanner.connect(reverbSend);
        } else {
          pGain.connect(destination);
          pGain.connect(reverbSend);
        }

        pOsc.start(sTime);
        pOsc.stop(sTime + 2.95);
        trackActiveNode(pOsc, undefined, pGain);
      } catch {
        // audio safe
      }
    });
  }

  // -------------------------------------------------------------
  // 4. ✨ 카운터 하모닉 글리머 (Counter Harmonic Glimmer - Part 4: stepIndex >= 192)
  // 오스티나토의 틈새로 부드럽게 반짝이는 배음 에코
  // -------------------------------------------------------------
  if (stepIndex >= 192 && (subStep === 4 || subStep === 12)) {
    const glimmers = [783.99, 987.77, 1174.66, 1318.51]; // G5, B5, D6, E6
    const gFreq = safeGet(glimmers, (progBar + Math.floor(subStep / 4)) % glimmers.length, 987.77);

    try {
      const gOsc = ctx.createOscillator();
      const gGain = ctx.createGain();
      const gPanner = createPanner(ctx, Math.sin(subStep) * 0.3);

      gGain.gain.value = 0;
      gOsc.type = 'sine';
      gOsc.frequency.setValueAtTime(gFreq, sTime);

      gGain.gain.setValueAtTime(0.0001, sTime);
      gGain.gain.linearRampToValueAtTime(0.024, sTime + 0.03);
      gGain.gain.exponentialRampToValueAtTime(0.0001, sTime + 0.75);

      if (gPanner) {
        gOsc.connect(gGain);
        gGain.connect(gPanner);
        gPanner.connect(destination);
        gPanner.connect(reverbSend);
      } else {
        gOsc.connect(gGain);
        gGain.connect(destination);
        gGain.connect(reverbSend);
      }

      gOsc.start(sTime);
      gOsc.stop(sTime + 0.8);
      trackActiveNode(gOsc, undefined, gGain);
    } catch {
      // audio safe
    }
  }
};

export const schedulePrototypeChill = ({
  ctx,
  destination,
  time,
  step: chordIndex,
  trackActiveNode,
}: PrototypeTrackContext): void => {
  const chords = [
    [130.81, 196.0, 246.94, 329.63],
    [110.0, 164.81, 196.0, 261.63],
    [87.31, 130.81, 174.61, 220.0],
    [98.0, 146.83, 196.0, 293.66],
    [82.41, 123.47, 196.0, 246.94],
    [87.31, 130.81, 220.0, 329.63],
    [73.42, 110.0, 174.61, 261.63],
    [98.0, 146.83, 246.94, 349.23],
  ];

  const chord = safeGet(chords, chordIndex, chords[0]);
  const duration = 2.4;
  const attack = 0.6;

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    gain.gain.value = 0;
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.linearRampToValueAtTime(620, time + attack);
    filter.frequency.linearRampToValueAtTime(420, time + duration);

    const noteVol = i === 0 ? 0.12 : 0.07;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(noteVol, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + duration + 0.05);

    trackActiveNode(osc, undefined, gain);
  });

  if (chordIndex >= 4) {
    const melodyNotes = [
      [329.63, 392.0],
      [440.0, 523.25],
      [392.0, 349.23],
      [293.66, 261.63],
    ];
    const melodyPair = safeGet(melodyNotes, chordIndex - 4, [329.63, 392.0]);

    melodyPair.forEach((mFreq, mIdx) => {
      const mTime = time + 0.3 + mIdx * 0.9;
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      const mFilter = ctx.createBiquadFilter();

      mGain.gain.value = 0;
      mOsc.type = 'sine';
      mOsc.frequency.setValueAtTime(mFreq, mTime);

      mFilter.type = 'lowpass';
      mFilter.frequency.setValueAtTime(800, mTime);

      mGain.gain.setValueAtTime(0.0001, mTime);
      mGain.gain.linearRampToValueAtTime(0.065, mTime + 0.25);
      mGain.gain.exponentialRampToValueAtTime(0.0001, mTime + 0.85);

      mOsc.connect(mFilter);
      mFilter.connect(mGain);
      mGain.connect(destination);

      mOsc.start(mTime);
      mOsc.stop(mTime + 0.9);
      trackActiveNode(mOsc, undefined, mGain);
    });
  }

  const sparkles = [659.25, 523.25, 783.99, 587.33, 659.25, 880.0, 783.99, 1046.5];
  const sparkleFreq = safeGet(sparkles, chordIndex, 659.25);
  const sparkleTime = time + 0.8;

  const spOsc = ctx.createOscillator();
  const spGain = ctx.createGain();
  spGain.gain.value = 0;
  spOsc.type = 'sine';
  spOsc.frequency.setValueAtTime(sparkleFreq, sparkleTime);

  spGain.gain.setValueAtTime(0.0001, sparkleTime);
  spGain.gain.linearRampToValueAtTime(0.035, sparkleTime + 0.3);
  spGain.gain.exponentialRampToValueAtTime(0.0001, sparkleTime + 1.2);

  spOsc.connect(spGain);
  spGain.connect(destination);

  spOsc.start(sparkleTime);
  spOsc.stop(sparkleTime + 1.25);

  trackActiveNode(spOsc, undefined, spGain);
};

export const chillTrack: TrackModule = {
  theme: 'chill',
  scheduleStep: scheduleChillStep,
  schedulePrototypeStep: schedulePrototypeChill,
};
