/**
 * Synthesizes the sample track "Harbour Light" entirely in-browser using OfflineAudioContext.
 * 96 BPM, 4/4, 32 bars, 1:20 duration (80.0 seconds), 44.1kHz, stereo.
 * Chord progression: A minor -> F -> C -> G (1 bar each = 2.5s each, repeating 8 times).
 *
 * Distinct sections:
 * Bars 1-4:   Intro (Warm soft pad, kick on beat 1 only)
 * Bars 5-12:  Verse (Kick 1&3, Snare 2&4, Hi-hat 8ths, Bass root-fifth)
 * Bars 13-20: Chorus (Full open chords, riding hats, punchy kick, higher bass, brighter)
 * Bars 21-24: Bridge (Drums drop out, arpeggiated 8th plucks with delay)
 * Bars 25-32: Outro (Verse groove thinning, decaying pad)
 */

export async function generateSampleTrack(
  sampleRate = 44100
): Promise<AudioBuffer> {
  const bpm = 96;
  const secondsPerBeat = 60.0 / bpm; // 0.625s
  const secondsPerBar = secondsPerBeat * 4; // 2.5s
  const totalBars = 32;
  const totalDuration = totalBars * secondsPerBar; // 80.0s

  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -6;
  compressor.knee.value = 8;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.05;

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

  // Noise buffer for snare & hats
  const noiseBufferSize = sampleRate * 2;
  const noiseBuffer = offlineCtx.createBuffer(1, noiseBufferSize, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  // Chords progression data
  // A minor, F major, C major, G major
  const chordRoots = [
    { name: 'Am', bassFreq: 110.0, notes: [220.0, 261.63, 329.63] }, // A2, A3, C4, E4
    { name: 'F', bassFreq: 87.31, notes: [174.61, 220.0, 261.63] }, // F2, F3, A3, C4
    { name: 'C', bassFreq: 65.41, notes: [130.81, 164.81, 196.0] }, // C2, C3, E3, G3
    { name: 'G', bassFreq: 98.0, notes: [196.0, 246.94, 293.66] }, // G2, G3, B3, D4
  ];

  // Helper: Sharp transient kick
  function triggerKick(time: number, isAccent = false) {
    if (time >= totalDuration) return;
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'sine';
    const startFreq = isAccent ? 140 : 120;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.07);

    gain.gain.setValueAtTime(isAccent ? 1.0 : 0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    // Sharp click transient on beat 1 for unambiguous click verification
    const click = offlineCtx.createOscillator();
    const clickGain = offlineCtx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(900, time);
    click.frequency.exponentialRampToValueAtTime(100, time + 0.012);
    clickGain.gain.setValueAtTime(0.4, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);

    click.connect(clickGain);
    clickGain.connect(masterGain);
    click.start(time);
    click.stop(time + 0.015);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  // Helper: Snare
  function triggerSnare(time: number) {
    if (time >= totalDuration) return;
    // Tone body
    const osc = offlineCtx.createOscillator();
    const oscGain = offlineCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.1);

    // Snare noise
    const noiseNode = offlineCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);
    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.setValueAtTime(0.55, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start(time);
    noiseNode.stop(time + 0.19);
  }

  // Helper: Hi-hat / Ride
  function triggerHat(time: number, isRide = false) {
    if (time >= totalDuration) return;
    const noiseNode = offlineCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    const filter = offlineCtx.createBiquadFilter();
    filter.type = isRide ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(isRide ? 6500 : 7800, time);
    if (isRide) filter.Q.value = 3;

    const hatGain = offlineCtx.createGain();
    const decay = isRide ? 0.22 : 0.045;
    hatGain.gain.setValueAtTime(isRide ? 0.35 : 0.22, time);
    hatGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noiseNode.connect(filter);
    filter.connect(hatGain);
    hatGain.connect(masterGain);
    noiseNode.start(time);
    noiseNode.stop(time + decay + 0.01);
  }

  // Helper: Bass note
  function triggerBass(time: number, duration: number, freq: number, isChorus = false) {
    if (time >= totalDuration) return;
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = isChorus ? 'sawtooth' : 'sine';

    // In chorus, bass is an octave higher and filtered
    const finalFreq = isChorus ? freq * 1.5 : freq;
    osc.frequency.setValueAtTime(finalFreq, time);

    let destNode: AudioNode = gain;
    if (isChorus) {
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(250, time + duration);
      gain.connect(filter);
      destNode = filter;
    }

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(isChorus ? 0.45 : 0.5, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);

    osc.connect(gain);
    destNode.connect(masterGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  // Helper: Pad chord
  function triggerPad(time: number, duration: number, notes: number[], isChorus = false) {
    if (time >= totalDuration) return;
    notes.forEach((freq, idx) => {
      const osc1 = offlineCtx.createOscillator();
      const osc2 = offlineCtx.createOscillator();
      const filter = offlineCtx.createBiquadFilter();
      const gain = offlineCtx.createGain();

      osc1.type = isChorus ? 'sawtooth' : 'triangle';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(freq, time);
      // Slight detune for warm chorus pad sound
      osc2.frequency.setValueAtTime(freq * 1.004, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isChorus ? 1400 : 700, time);
      filter.Q.value = 1.5;

      const baseVolume = isChorus ? 0.12 : 0.09;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(baseVolume, time + 0.3);
      gain.gain.setValueAtTime(baseVolume, time + duration - 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    });
  }

  // Helper: Bridge Arpeggiator Pluck
  function triggerPluck(time: number, freq: number) {
    if (time >= totalDuration) return;
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const filter = offlineCtx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.2);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  // Sequencer loop over 32 bars
  for (let bar = 1; bar <= totalBars; bar++) {
    const barStartTime = (bar - 1) * secondsPerBar;
    const chordIndex = (bar - 1) % 4;
    const chord = chordRoots[chordIndex];

    const isIntro = bar >= 1 && bar <= 4;
    const isVerse = bar >= 5 && bar <= 12;
    const isChorus = bar >= 13 && bar <= 20;
    const isBridge = bar >= 21 && bar <= 24;
    const isOutro = bar >= 25 && bar <= 32;

    // 1. Harmonies / Chords
    if (!isBridge) {
      triggerPad(barStartTime, secondsPerBar, chord.notes, isChorus);
    }

    // 2. Bassline
    if (isVerse || isChorus || isOutro) {
      // Beat 1 and Beat 3
      triggerBass(barStartTime, secondsPerBeat * 1.8, chord.bassFreq, isChorus);
      // Fifth on beat 3
      const fifthFreq = chord.bassFreq * 1.498;
      triggerBass(barStartTime + secondsPerBeat * 2, secondsPerBeat * 1.8, fifthFreq, isChorus);
    }

    // 3. Drums
    if (isIntro) {
      // Kick only on beat 1
      triggerKick(barStartTime, true);
    } else if (isVerse || isOutro) {
      // Kick 1, 3
      triggerKick(barStartTime, true);
      triggerKick(barStartTime + secondsPerBeat * 2);

      // Snare 2, 4 (thinner in outro)
      if (!isOutro || bar <= 28) {
        triggerSnare(barStartTime + secondsPerBeat);
        triggerSnare(barStartTime + secondsPerBeat * 3);
      }

      // Hats: 8th notes
      for (let eighth = 0; eighth < 8; eighth++) {
        if (!isOutro || eighth % 2 === 0) {
          triggerHat(barStartTime + eighth * (secondsPerBeat / 2));
        }
      }
    } else if (isChorus) {
      // Powerful Chorus Groove
      triggerKick(barStartTime, true);
      triggerKick(barStartTime + secondsPerBeat * 1.5);
      triggerKick(barStartTime + secondsPerBeat * 2);
      triggerKick(barStartTime + secondsPerBeat * 3);

      triggerSnare(barStartTime + secondsPerBeat);
      triggerSnare(barStartTime + secondsPerBeat * 3);

      // Rides on 8ths
      for (let eighth = 0; eighth < 8; eighth++) {
        triggerHat(barStartTime + eighth * (secondsPerBeat / 2), true);
      }
    } else if (isBridge) {
      // Drums drop out; arpeggiated 8ths plucks
      const arpNotes = [chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[1] * 2];
      for (let eighth = 0; eighth < 8; eighth++) {
        const noteFreq = arpNotes[eighth % arpNotes.length];
        triggerPluck(barStartTime + eighth * (secondsPerBeat / 2), noteFreq);
      }
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer;
}
