import { AudioEngine } from './AudioEngine';
import { BeatPosition } from './BeatMap';
import { ClockSnapshot } from './MasterClock';

export type ClockTickListener = (
  songPos: number,
  beatPos: BeatPosition,
  snapshot: ClockSnapshot
) => void;

export class ClockTicker {
  private static instance: ClockTicker | null = null;
  private listeners: Set<ClockTickListener> = new Set();
  private rafId: number | null = null;
  private engine: AudioEngine;
  private isRunning = false;
  private lastBeatNumber = -1;

  private constructor() {
    this.engine = AudioEngine.getInstance();
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  static getInstance(): ClockTicker {
    if (!ClockTicker.instance) {
      ClockTicker.instance = new ClockTicker();
    }
    return ClockTicker.instance;
  }

  subscribe(listener: ClockTickListener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else if (this.listeners.size > 0) {
      this.start();
    }
  }

  private tick() {
    if (!this.isRunning) return;

    const now = this.engine.getNow();
    const songPos = this.engine.clock.getPosition(now);
    const beatPos = this.engine.beatMap.timeToBeat(songPos);
    const snapshot = this.engine.clock.getSnapshot(now);

    // Record drift measurement
    if (this.engine.clock.playing) {
      this.engine.recordDrift(songPos, snapshot.position);
    }

    // Notify subscribers with direct DOM callbacks
    this.listeners.forEach((listener) => {
      try {
        listener(songPos, beatPos, snapshot);
      } catch (err) {
        console.error('Error in clock tick listener:', err);
      }
    });

    this.rafId = requestAnimationFrame(this.tick);
  }
}
