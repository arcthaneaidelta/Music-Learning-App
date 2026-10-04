export interface TempoPoint {
  time: number;
  bpm: number;
  meter?: [number, number];
}

export interface BeatPosition {
  beatFloat: number;
  bar: number;
  beat: number;
  fraction: number;
  inCountIn: boolean;
}

export interface SnapResult {
  time: number;
  deltaMs: number;
  snapped: boolean;
}

export class BeatMap {
  bpm: number;
  downbeatOffset: number;
  meterNumerator: number;
  meterDenominator: number;

  constructor(
    bpm = 96,
    downbeatOffset = 0.0,
    meter: [number, number] = [4, 4]
  ) {
    this.bpm = bpm;
    this.downbeatOffset = downbeatOffset;
    this.meterNumerator = meter[0] || 4;
    this.meterDenominator = meter[1] || 4;
  }

  get secondsPerBeat(): number {
    return 60.0 / this.bpm;
  }

  get secondsPerBar(): number {
    return this.secondsPerBeat * this.meterNumerator;
  }

  timeToBeat(timeInSeconds: number): BeatPosition {
    const timeSinceDownbeat = timeInSeconds - this.downbeatOffset;
    const beatFloat = timeSinceDownbeat * (this.bpm / 60.0);

    if (timeSinceDownbeat < 0) {
      // Pre-roll / before downbeat
      const beatsBefore = Math.abs(beatFloat);
      const bar = -Math.floor(beatsBefore / this.meterNumerator);
      const beat = this.meterNumerator - (Math.floor(beatsBefore) % this.meterNumerator);
      return {
        beatFloat,
        bar,
        beat,
        fraction: 1 - (beatsBefore % 1),
        inCountIn: true,
      };
    }

    const bar = Math.floor(beatFloat / this.meterNumerator) + 1;
    const beat = (Math.floor(beatFloat) % this.meterNumerator) + 1;
    const fraction = beatFloat % 1;

    return {
      beatFloat,
      bar,
      beat,
      fraction,
      inCountIn: false,
    };
  }

  beatToTime(bar: number, beat: number): number {
    const totalBeats = (bar - 1) * this.meterNumerator + (beat - 1);
    return this.downbeatOffset + totalBeats * this.secondsPerBeat;
  }

  snapTime(timeInSeconds: number, snapMode: 'bar' | 'beat' | 'off'): SnapResult {
    if (snapMode === 'off') {
      return { time: timeInSeconds, deltaMs: 0, snapped: false };
    }

    const timeSinceDownbeat = timeInSeconds - this.downbeatOffset;
    const beatFloat = timeSinceDownbeat * (this.bpm / 60.0);

    let snappedTime = timeInSeconds;

    if (snapMode === 'bar') {
      const nearestBarIndex = Math.round(beatFloat / this.meterNumerator);
      snappedTime = this.downbeatOffset + (nearestBarIndex * this.meterNumerator) * this.secondsPerBeat;
    } else if (snapMode === 'beat') {
      const nearestBeatIndex = Math.round(beatFloat);
      snappedTime = this.downbeatOffset + nearestBeatIndex * this.secondsPerBeat;
    }

    if (snappedTime < 0) snappedTime = 0;
    const deltaMs = Math.round((snappedTime - timeInSeconds) * 1000);

    return {
      time: snappedTime,
      deltaMs,
      snapped: true,
    };
  }

  setBpm(newBpm: number) {
    this.bpm = Math.max(30, Math.min(300, newBpm));
  }

  setDownbeat(offsetInSeconds: number) {
    this.downbeatOffset = Math.max(0, offsetInSeconds);
  }

  nudgeDownbeatMs(deltaMs: number) {
    this.downbeatOffset = Math.max(0, this.downbeatOffset + deltaMs / 1000);
  }
}
