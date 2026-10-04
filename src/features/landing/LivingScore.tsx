import React, { useRef, useEffect, useState } from 'react';
import { AudioEngine } from '../../audio/AudioEngine';
import { generateSampleTrack } from '../../audio/sampleTrack';
import { Volume2, VolumeX, Repeat, Sparkles } from 'lucide-react';
import { formatTime } from '../../lib/format';

export const LivingScore: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = AudioEngine.getInstance();

  const [hasSound, setHasSound] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(1.0);
  const [virtualLoop, setVirtualLoop] = useState<{ a: number; b: number } | null>(null);

  // Virtual clock state (advances silently before user gesture)
  const virtualStateRef = useRef({
    songPos: 12.0, // starts at 12s in Verse
    lastPerfTime: performance.now(),
    rate: 1.0,
  });

  const isVisibleRef = useRef(true);

  // Synthesize sample track buffer in background if not already loaded
  useEffect(() => {
    if (!engine.getCurrentBuffer()) {
      generateSampleTrack().then((buf) => {
        engine.setAudioBuffer(buf, false);
      });
    }
  }, [engine]);

  // IntersectionObserver to pause rendering when offscreen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle Play Sound (Switch from Virtual Clock to Real Audio Clock Without Visual Jump!)
  const handleToggleSound = async () => {
    if (!isPlayingAudio) {
      const currentPos = virtualStateRef.current.songPos;
      await engine.ensureContext();
      if (!engine.getCurrentBuffer()) {
        const buf = await generateSampleTrack();
        await engine.setAudioBuffer(buf, false);
      }
      engine.setRate(activeSpeed);
      engine.seek(currentPos);
      if (virtualLoop) {
        engine.setLoop(virtualLoop);
      }
      await engine.play(false);
      setIsPlayingAudio(true);
      setHasSound(true);
    } else {
      engine.pause();
      setIsPlayingAudio(false);
      virtualStateRef.current.songPos = engine.getSongPosition();
      virtualStateRef.current.lastPerfTime = performance.now();
    }
  };

  const handleSpeedChange = (rate: number) => {
    setActiveSpeed(rate);
    virtualStateRef.current.rate = rate;
    if (isPlayingAudio) {
      engine.setRate(rate);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Quick 2-bar loop at current position
    const currentPos = isPlayingAudio
      ? engine.getSongPosition()
      : virtualStateRef.current.songPos;
    const a = Math.floor(currentPos / 2.5) * 2.5;
    const b = a + 5.0; // 2 bars = 5.0s
    const newLoop = { a, b: Math.min(80.0, b) };

    setVirtualLoop(newLoop);
    if (isPlayingAudio) {
      engine.setLoop(newLoop);
    }
  };

  // Main 60fps Canvas Loop (Living Score)
  useEffect(() => {
    let animId: number;

    const render = () => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      // Calculate Song Position
      let currentPos = 0;
      if (isPlayingAudio) {
        currentPos = engine.getSongPosition();
        virtualStateRef.current.songPos = currentPos;
        virtualStateRef.current.lastPerfTime = performance.now();
      } else {
        // Virtual Clock advancing at 96 BPM
        const nowPerf = performance.now();
        const deltaSec = (nowPerf - virtualStateRef.current.lastPerfTime) / 1000;
        virtualStateRef.current.lastPerfTime = nowPerf;
        let pos = virtualStateRef.current.songPos + deltaSec * virtualStateRef.current.rate;

        // Virtual Loop
        if (virtualLoop && pos >= virtualLoop.b) {
          pos = virtualLoop.a;
        } else if (pos >= 80.0) {
          pos = 0;
        }
        virtualStateRef.current.songPos = pos;
        currentPos = pos;
      }

      // Clear Canvas
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Center Fixed Playhead at 45% width
      const playheadX = w * 0.45;
      const pxPerSec = 75; // 75px per second of audio
      const duration = 80.0;

      // 1. Draw Scrolling Beat Grid & Bars
      const spb = 60.0 / 96.0; // 0.625s
      const totalBeats = Math.ceil(duration / spb);

      ctx.lineWidth = 1;
      for (let b = 0; b < totalBeats; b++) {
        const beatTime = b * spb;
        const screenX = playheadX + (beatTime - currentPos) * pxPerSec;

        if (screenX >= -50 && screenX <= w + 50) {
          const isBar = b % 4 === 0;
          ctx.strokeStyle = isBar ? 'var(--border-strong)' : 'var(--border)';

          ctx.beginPath();
          ctx.moveTo(screenX, isBar ? 8 : h - 28);
          ctx.lineTo(screenX, h - 8);
          ctx.stroke();

          if (isBar) {
            const barNum = Math.floor(b / 4) + 1;
            ctx.font = '500 10px var(--font-mono)';
            ctx.fillStyle = 'var(--ink-3)';
            ctx.fillText(`Bar ${barNum}`, screenX + 4, 18);
          }
        }
      }

      // 2. Draw Loop bracket if active
      if (virtualLoop) {
        const lx1 = playheadX + (virtualLoop.a - currentPos) * pxPerSec;
        const lx2 = playheadX + (virtualLoop.b - currentPos) * pxPerSec;

        if (lx2 >= 0 && lx1 <= w) {
          ctx.fillStyle = 'rgba(241, 217, 206, 0.4)';
          ctx.fillRect(lx1, 10, lx2 - lx1, h - 20);

          ctx.strokeStyle = 'var(--accent)';
          ctx.lineWidth = 2;
          ctx.strokeRect(lx1, 10, lx2 - lx1, h - 20);
        }
      }

      // 3. Draw Waveform Peaks
      const peaks = engine.peaks;
      if (peaks && peaks.levels.length > 0) {
        const level = peaks.levels[1] || peaks.levels[0];
        const centerY = h / 2;
        const amp = (h - 40) / 2;
        const bucketCount = level.min.length;

        for (let i = 0; i < bucketCount; i += 2) {
          const sampleTime = (i / bucketCount) * duration;
          const sx = playheadX + (sampleTime - currentPos) * pxPerSec;

          if (sx >= -10 && sx <= w + 10) {
            const minVal = level.min[i];
            const maxVal = level.max[i];

            ctx.strokeStyle =
              sampleTime <= currentPos ? 'var(--primary)' : 'var(--ink-3)';
            ctx.lineWidth = 1.4;

            ctx.beginPath();
            ctx.moveTo(sx, centerY - maxVal * amp);
            ctx.lineTo(sx, centerY - minVal * amp + 1);
            ctx.stroke();
          }
        }
      }

      // 4. Fixed Central Terracotta Playhead Needle
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      // Triangle head on playhead
      ctx.fillStyle = 'var(--accent)';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 9);
      ctx.fill();

      // 5. Huge Mono Musical Count Display To The Left Of The Playhead
      const beatPos = engine.beatMap.timeToBeat(currentPos);
      ctx.font = '600 48px var(--font-mono)';
      ctx.fillStyle =
        beatPos.beat === 1 ? 'var(--accent)' : 'var(--ink)';
      ctx.textAlign = 'right';
      ctx.fillText(beatPos.beat.toString(), playheadX - 24, h / 2 + 16);

      // Bar number subtitle
      ctx.font = '500 12px var(--font-mono)';
      ctx.fillStyle = 'var(--ink-2)';
      ctx.fillText(`Bar ${beatPos.bar}`, playheadX - 24, h / 2 + 36);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, isPlayingAudio, virtualLoop]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col bg-surface border border-border rounded-lg shadow-2 overflow-hidden select-none"
    >
      {/* Waveform Strip Canvas */}
      <div className="relative w-full h-56 sm:h-64 cursor-pointer bg-surface-sunken">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Top Hint */}
        <div className="absolute top-2 left-3 text-[11px] font-mono text-ink-3 pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Tap to loop 2 bars · Scroll auto-advances at 96 BPM</span>
        </div>

        {/* 56px Round "Play sound" Hero Button (§7.2) */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="absolute bottom-3 right-3 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover active:scale-95 text-[#FBF9F5] shadow-2 flex items-center justify-center transition-all z-10"
          title={isPlayingAudio ? 'Mute sound' : 'Enable live audio'}
        >
          {isPlayingAudio ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Speed Controls Below Canvas (§7.2) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-t border-border text-xs font-ui">
        <div className="flex items-center gap-2">
          <span className="text-ink-3">Speed:</span>
          {[0.6, 0.8, 1.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-sm border transition-all ${
                Math.abs(activeSpeed - rate) < 0.01
                  ? 'bg-primary text-white border-primary shadow-1'
                  : 'bg-surface-sunken text-ink-2 border-border hover:bg-surface'
              }`}
            >
              {Math.round(rate * 100)}%
            </button>
          ))}
        </div>

        <span className="text-[11px] text-ink-3 font-mono">
          {isPlayingAudio ? 'Audio Clock Active' : 'Virtual Clock (Click to hear)'}
        </span>
      </div>
    </div>
  );
};
