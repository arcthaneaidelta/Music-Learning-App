import { clamp } from '../lib/clamp';

export interface LoopRegion {
  a: number;
  b: number;
}

export interface ClockState {
  anchorCtxTime: number;
  anchorSongPos: number;
  rate: number;
  playing: boolean;
  loop?: LoopRegion | null;
  duration: number;
}

export interface ClockSnapshot {
  position: number;
  playing: boolean;
  rate: number;
  loop: LoopRegion | null;
  loopPass: number;
  duration: number;
  anchorCtxTime: number;
  anchorSongPos: number;
}

export class MasterClock {
  anchorCtxTime = 0;
  anchorSongPos = 0;
  rate = 1.0;
  playing = false;
  loop: LoopRegion | null = null;
  duration = 80.0;
  loopEntryRaw = 0;

  constructor(duration = 80.0) {
    this.duration = Math.max(0.1, duration);
  }

  setDuration(duration: number) {
    this.duration = Math.max(0.1, duration);
  }

  /**
   * Calculate current song position from current context time.
   * Pure derivation as defined in PRD Section 23.3.
   */
  getPosition(now: number): number {
    if (!this.playing) {
      return clamp(this.anchorSongPos, 0, this.duration);
    }

    const elapsed = Math.max(0, now - this.anchorCtxTime);
    let raw = this.anchorSongPos + elapsed * this.rate;

    if (this.loop && this.loop.b > this.loop.a) {
      const loopLen = this.loop.b - this.loop.a;
      if (raw >= this.loop.a) {
        const offsetInLoop = (raw - this.loop.a) % loopLen;
        raw = this.loop.a + offsetInLoop;
      }
    }

    return clamp(raw, 0, this.duration);
  }

  /**
   * Get raw (unwrapped) position for pass counter computation.
   */
  getRawPosition(now: number): number {
    if (!this.playing) return this.anchorSongPos;
    const elapsed = Math.max(0, now - this.anchorCtxTime);
    return this.anchorSongPos + elapsed * this.rate;
  }

  /**
   * Get current loop pass index (0-indexed or 1-indexed count).
   */
  getLoopPass(now: number): number {
    if (!this.loop || this.loop.b <= this.loop.a) return 0;
    const loopLen = this.loop.b - this.loop.a;
    const raw = this.getRawPosition(now);
    if (raw < this.loop.a) return 0;
    return Math.floor((raw - this.loop.a) / loopLen) + 1;
  }

  /**
   * Re-anchor before any state mutation to guarantee absolute continuity.
   * PRD §23.3: anchorSongPos = songPos(now) before mutating, then set new values.
   */
  reanchor(now: number): number {
    const currentSongPos = this.getPosition(now);
    this.anchorSongPos = currentSongPos;
    this.anchorCtxTime = now;
    return currentSongPos;
  }

  play(now: number) {
    if (this.playing) return;
    this.anchorCtxTime = now;
    this.playing = true;
  }

  pause(now: number) {
    if (!this.playing) return;
    this.anchorSongPos = this.getPosition(now);
    this.anchorCtxTime = now;
    this.playing = false;
  }

  seek(newSongPos: number, now: number) {
    const clamped = clamp(newSongPos, 0, this.duration);
    this.anchorSongPos = clamped;
    this.anchorCtxTime = now;
  }

  setRate(newRate: number, now: number) {
    if (newRate <= 0) return;
    // Re-anchor first so position continuity is strictly preserved
    this.reanchor(now);
    this.rate = newRate;
  }

  setLoop(loop: LoopRegion | null, now: number) {
    this.reanchor(now);
    if (loop && loop.b > loop.a) {
      this.loop = { a: Math.max(0, loop.a), b: Math.min(this.duration, loop.b) };
      // If current position is outside the loop, jump to loop start
      if (this.anchorSongPos < this.loop.a || this.anchorSongPos >= this.loop.b) {
        this.anchorSongPos = this.loop.a;
      }
    } else {
      this.loop = null;
    }
  }

  getSnapshot(now: number): ClockSnapshot {
    return {
      position: this.getPosition(now),
      playing: this.playing,
      rate: this.rate,
      loop: this.loop ? { ...this.loop } : null,
      loopPass: this.getLoopPass(now),
      duration: this.duration,
      anchorCtxTime: this.anchorCtxTime,
      anchorSongPos: this.anchorSongPos,
    };
  }
}
