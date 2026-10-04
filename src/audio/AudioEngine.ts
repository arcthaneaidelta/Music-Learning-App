import { MasterClock, LoopRegion } from './MasterClock';
import { BeatMap } from './BeatMap';
import { ClickScheduler } from './Scheduler';
import { ScrubGrainPlayer } from './scrubGrain';
import { extractPeaks, WaveformPeaks } from './peaks';

export interface DriftSample {
  timestamp: number;
  deltaMs: number;
}

export type EngineEventCallback = (eventName: string, data?: any) => void;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  ctx: AudioContext | null = null;
  clock: MasterClock;
  beatMap: BeatMap;
  peaks: WaveformPeaks | null = null;

  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  private scheduler: ClickScheduler | null = null;
  private scrubPlayer: ScrubGrainPlayer | null = null;

  private eventListeners: Set<EngineEventCallback> = new Set();

  // Drift meter tracking
  private driftHistory: DriftSample[] = [];
  private readonly maxDriftHistorySec = 10;

  private constructor() {
    this.clock = new MasterClock(80.0);
    this.beatMap = new BeatMap(96, 0.0, [4, 4]);
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes or resumes the AudioContext upon user gesture.
   */
  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;
      this.gainNode.connect(this.ctx.destination);

      this.scheduler = new ClickScheduler(this.ctx, this.clock, this.beatMap);
      this.scrubPlayer = new ScrubGrainPlayer(this.ctx);
      if (this.currentBuffer) {
        this.scrubPlayer.setBuffer(this.currentBuffer);
      }
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
      this.emit('statechange', this.ctx.state);
    }

    return this.ctx;
  }

  /**
   * Returns latency-compensated current AudioContext time.
   * As specified in PRD Section 23.3:
   * now = ctx.getOutputTimestamp().contextTime (fallback: ctx.currentTime - ctx.outputLatency)
   */
  getNow(): number {
    if (!this.ctx) return 0;
    try {
      if (typeof this.ctx.getOutputTimestamp === 'function') {
        const ts = this.ctx.getOutputTimestamp();
        if (ts && typeof ts.contextTime === 'number' && ts.contextTime > 0) {
          return ts.contextTime;
        }
      }
    } catch {
      // Fallback
    }

    const outputLatency = (this.ctx as any).outputLatency || 0;
    return Math.max(0, this.ctx.currentTime - outputLatency);
  }

  /**
   * Latency readouts for the Inspector and Sync Tools.
   */
  getLatencyInfo() {
    if (!this.ctx) {
      return { baseLatency: 0, outputLatency: 0, compensated: false };
    }
    const baseLatency = (this.ctx as any).baseLatency || 0;
    const outputLatency = (this.ctx as any).outputLatency || 0;
    const hasGetOutputTimestamp = typeof this.ctx.getOutputTimestamp === 'function';

    return {
      baseLatency: Math.round(baseLatency * 1000),
      outputLatency: Math.round(outputLatency * 1000),
      compensated: hasGetOutputTimestamp || outputLatency > 0,
    };
  }

  /**
   * Sets the audio buffer (either from generated sample or uploaded file).
   */
  async setAudioBuffer(buffer: AudioBuffer, resetClock = false) {
    this.currentBuffer = buffer;
    this.clock.setDuration(buffer.duration);
    this.peaks = extractPeaks(buffer);

    if (this.scrubPlayer) {
      this.scrubPlayer.setBuffer(buffer);
    }

    if (resetClock) {
      this.clock.seek(0, this.getNow());
    }

    this.emit('bufferloaded', { duration: buffer.duration });
  }

  getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }

  /**
   * Starts playback from current clock position.
   */
  async play(countIn = false) {
    await this.ensureContext();
    if (!this.ctx || !this.currentBuffer) return;

    if (this.clock.playing) return;

    if (countIn) {
      this.emit('countinstatted');
      // 1 bar of metronome count-in
      const barDuration = this.beatMap.secondsPerBar;
      const spb = this.beatMap.secondsPerBeat;
      const startCtx = this.ctx.currentTime + 0.05;

      for (let i = 0; i < this.beatMap.meterNumerator; i++) {
        this.scheduler?.scheduleClickSound(startCtx + i * spb, i === 0);
      }

      setTimeout(() => {
        this.startSourceNode();
      }, barDuration * 1000);
      return;
    }

    this.startSourceNode();
  }

  private startSourceNode() {
    if (!this.ctx || !this.currentBuffer) return;

    this.stopSourceNode();

    const now = this.getNow();
    let currentPos = this.clock.getPosition(now);

    // If loop is set and current position is at or past end, wrap to loop start
    if (this.clock.loop && currentPos >= this.clock.loop.b) {
      currentPos = this.clock.loop.a;
      this.clock.seek(currentPos, now);
    }

    // If at end of song, wrap to beginning
    if (currentPos >= this.clock.duration - 0.02) {
      currentPos = 0;
      this.clock.seek(0, now);
    }

    this.clock.play(now);

    const source = this.ctx.createBufferSource();
    source.buffer = this.currentBuffer;
    source.playbackRate.setValueAtTime(this.clock.rate, this.ctx.currentTime);

    // Sample-accurate hardware loop
    if (this.clock.loop && this.clock.loop.b > this.clock.loop.a) {
      source.loop = true;
      source.loopStart = this.clock.loop.a;
      source.loopEnd = this.clock.loop.b;
    } else {
      source.loop = false;
    }

    source.connect(this.gainNode!);

    // Start playback at current position
    source.start(this.ctx.currentTime, currentPos);
    this.sourceNode = source;

    source.onended = () => {
      // Natural end if not looping
      if (!this.clock.loop && this.clock.playing && this.getSongPosition() >= this.clock.duration - 0.05) {
        this.pause();
        this.seek(0);
      }
    };

    this.scheduler?.reset();
    this.emit('play');
  }

  /**
   * Pauses playback retaining exact position.
   */
  pause() {
    const now = this.getNow();
    this.clock.pause(now);
    this.stopSourceNode();
    this.emit('pause');
  }

  private stopSourceNode() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Node was already stopped
      }
      this.sourceNode = null;
    }
  }

  /**
   * Seeks to target position without audible glitches.
   * If playing, seamlessly restarts source at new offset.
   */
  seek(positionInSeconds: number) {
    const wasPlaying = this.clock.playing;
    const now = this.getNow();

    this.clock.seek(positionInSeconds, now);
    this.scheduler?.reset();

    if (wasPlaying) {
      this.startSourceNode();
    }

    this.emit('seek', positionInSeconds);
  }

  /**
   * Dynamic live speed changes (50% to 125%).
   * Re-anchors clock first to preserve exact position continuity.
   */
  setRate(newRate: number) {
    const clampedRate = Math.max(0.5, Math.min(1.5, newRate));
    const now = this.getNow();

    this.clock.setRate(clampedRate, now);

    if (this.sourceNode && this.ctx) {
      this.sourceNode.playbackRate.setValueAtTime(clampedRate, this.ctx.currentTime);
    }

    this.scheduler?.reset();
    this.emit('ratechange', clampedRate);
  }

  /**
   * Sets loop region with sample-accurate loop wrapping on the source node.
   */
  setLoop(loop: LoopRegion | null) {
    const now = this.getNow();
    this.clock.setLoop(loop, now);

    if (this.clock.playing) {
      // Restart source to apply loop boundaries accurately
      this.startSourceNode();
    }

    this.scheduler?.reset();
    this.emit('loopchange', loop);
  }

  /**
   * Plays scrub grain during drag if enabled.
   */
  scrubGrain(position: number) {
    this.scrubPlayer?.playGrain(position, this.clock.rate);
  }

  /**
   * Metronome click scheduler control.
   */
  setMetronome(enabled: boolean) {
    this.scheduler?.setEnabled(enabled);
    this.emit('metronomechange', enabled);
  }

  setClickOffsetMs(offsetMs: number) {
    this.scheduler?.setOffsetMs(offsetMs);
  }

  /**
   * Retrieves the current song position derived from the master clock.
   */
  getSongPosition(): number {
    return this.clock.getPosition(this.getNow());
  }

  /**
   * Drift measurement sampling.
   */
  recordDrift(visualPos: number, clockPos: number) {
    const deltaMs = (visualPos - clockPos) * 1000;
    const now = performance.now();

    this.driftHistory.push({ timestamp: now, deltaMs });

    // Prune entries older than maxDriftHistorySec
    const cutoff = now - this.maxDriftHistorySec * 1000;
    while (this.driftHistory.length > 0 && this.driftHistory[0].timestamp < cutoff) {
      this.driftHistory.shift();
    }
  }

  getDriftStats(): { maxDeltaMs: number; p95DeltaMs: number; history: DriftSample[] } {
    if (this.driftHistory.length === 0) {
      return { maxDeltaMs: 0, p95DeltaMs: 0, history: [] };
    }

    const absDeltas = this.driftHistory.map(d => Math.abs(d.deltaMs)).sort((a, b) => a - b);
    const maxDeltaMs = Math.round(absDeltas[absDeltas.length - 1] * 10) / 10;
    const p95Index = Math.min(absDeltas.length - 1, Math.floor(absDeltas.length * 0.95));
    const p95DeltaMs = Math.round(absDeltas[p95Index] * 10) / 10;

    return {
      maxDeltaMs,
      p95DeltaMs,
      history: [...this.driftHistory],
    };
  }

  // Event subscription
  subscribe(callback: EngineEventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  private emit(eventName: string, data?: any) {
    this.eventListeners.forEach(cb => {
      try {
        cb(eventName, data);
      } catch (err) {
        console.error('Engine event error:', err);
      }
    });
  }
}
