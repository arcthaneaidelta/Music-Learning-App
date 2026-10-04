/**
 * Plays short 90ms grains of audio with smooth envelope for click-free scrubbing.
 */

export class ScrubGrainPlayer {
  ctx: AudioContext;
  buffer: AudioBuffer | null = null;
  lastPlayTime = 0;
  minInterval = 0.05; // 50ms between grains to prevent overlapping noise bursts

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  setBuffer(buffer: AudioBuffer | null) {
    this.buffer = buffer;
  }

  playGrain(songPosition: number, rate = 1.0) {
    if (!this.buffer || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - this.lastPlayTime < this.minInterval) return;
    this.lastPlayTime = now;

    const grainDuration = 0.09; // 90ms
    const pos = Math.max(0, Math.min(this.buffer.duration - grainDuration, songPosition));

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffer;
      source.playbackRate.value = rate;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      // Fast attack & decay envelope
      gain.gain.linearRampToValueAtTime(0.4, now + 0.015);
      gain.gain.linearRampToValueAtTime(0.4, now + grainDuration - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + grainDuration);

      source.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(now, pos, grainDuration);
      source.stop(now + grainDuration + 0.01);
    } catch {
      // AudioContext state or buffer boundary edge case
    }
  }
}
