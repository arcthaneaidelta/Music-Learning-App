import { MasterClock } from './MasterClock';
import { BeatMap } from './BeatMap';

/**
 * High-precision look-ahead scheduler for the metronome / click track.
 * Follows Chris Wilson's Web Audio look-ahead pattern:
 * 25ms polling timer, 120ms look-ahead scheduling into AudioContext.
 */

export class ClickScheduler {
  ctx: AudioContext;
  clock: MasterClock;
  beatMap: BeatMap;
  timerId: number | null = null;
  enabled = false;
  offsetMs = 0; // offset in ms for hearing test (e.g. +30ms)
  lookahead = 0.12; // 120ms lookahead
  scheduleInterval = 25; // 25ms polling
  lastScheduledBeatIndex = -1;

  constructor(ctx: AudioContext, clock: MasterClock, beatMap: BeatMap) {
    this.ctx = ctx;
    this.clock = clock;
    this.beatMap = beatMap;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.lastScheduledBeatIndex = -1;
      this.start();
    } else {
      this.stop();
    }
  }

  setOffsetMs(ms: number) {
    this.offsetMs = ms;
  }

  start() {
    if (this.timerId !== null) return;
    this.timerId = window.setInterval(() => {
      this.scheduleTicks();
    }, this.scheduleInterval);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  scheduleClickSound(time: number, isDownbeat: boolean) {
    if (time < this.ctx.currentTime) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Downbeat click is higher pitched, secondary clicks lower
    osc.frequency.setValueAtTime(isDownbeat ? 1800 : 1200, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.02);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(isDownbeat ? 0.6 : 0.4, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private scheduleTicks() {
    if (!this.enabled || !this.clock.playing || this.ctx.state !== 'running') {
      return;
    }

    const currentCtxTime = this.ctx.currentTime;
    const windowEndCtxTime = currentCtxTime + this.lookahead;

    // Current position in song
    const currentSongPos = this.clock.getPosition(currentCtxTime);
    // Song position at window end:
    // (windowEndCtxTime - currentCtxTime) * rate
    const windowEndSongPos = currentSongPos + this.lookahead * this.clock.rate;

    const spb = this.beatMap.secondsPerBeat;
    const downbeat = this.beatMap.downbeatOffset;

    // Beat index range that might fall in this window
    const startBeatIndex = Math.floor((currentSongPos - downbeat) / spb);
    const endBeatIndex = Math.ceil((windowEndSongPos - downbeat) / spb);

    for (let b = startBeatIndex; b <= endBeatIndex; b++) {
      if (b <= this.lastScheduledBeatIndex) continue;

      const beatSongTime = downbeat + b * spb;
      if (beatSongTime >= currentSongPos && beatSongTime <= windowEndSongPos) {
        // Calculate audio context time for this beat
        const deltaSongSeconds = beatSongTime - currentSongPos;
        const deltaCtxSeconds = deltaSongSeconds / this.clock.rate;
        const targetCtxTime = currentCtxTime + deltaCtxSeconds + this.offsetMs / 1000;

        const isDownbeat = (b % this.beatMap.meterNumerator) === 0;
        this.scheduleClickSound(targetCtxTime, isDownbeat);
        this.lastScheduledBeatIndex = b;
      }
    }
  }

  /**
   * Resets scheduled beat history on seek, loop wrap, or speed change.
   */
  reset() {
    this.lastScheduledBeatIndex = -1;
  }
}
