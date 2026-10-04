import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ClockTicker } from '../../audio/ClockTicker';
import { AudioEngine } from '../../audio/AudioEngine';
import { useProjectStore } from '../../state/projectStore';
import { formatTime, formatBarBeat } from '../../lib/format';
import { LoopRegion } from '../../audio/MasterClock';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const WaveformTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const {
    project,
    loop,
    snap,
    zoom,
    hearScrub,
    isPlaying,
    setLoop,
    seekTo,
    setZoom,
    addMarker,
  } = useProjectStore();

  const engine = AudioEngine.getInstance();
  const ticker = ClockTicker.getInstance();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'a' | 'b' | 'none'>('none');
  const wasPlayingBeforeScrubRef = useRef(false);
  const lastScrubPosRef = useRef(0);

  const duration = project.audio.duration || 80.0;

  // Convert time to pixel offset within the timeline
  const timeToPx = useCallback(
    (time: number, width: number) => {
      return (time / duration) * width;
    },
    [duration]
  );

  // Convert pixel offset to time
  const pxToTime = useCallback(
    (px: number, width: number) => {
      return Math.max(0, Math.min(duration, (px / width) * duration));
    },
    [duration]
  );

  // Redraw waveform and rulers
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Region Bands
    project.regions.forEach((region) => {
      const rx1 = timeToPx(region.start, width);
      const rx2 = timeToPx(region.end, width);
      const rw = rx2 - rx1;

      // 22% opacity background band
      ctx.fillStyle = `${region.color}38`;
      ctx.fillRect(rx1, 0, rw, height);

      // 2px solid top edge (100% opacity)
      ctx.fillStyle = region.color;
      ctx.fillRect(rx1, 0, rw, 2.5);

      // Section name watermark in background
      ctx.font = '500 10px var(--font-ui)';
      ctx.fillStyle = 'var(--ink-2)';
      ctx.fillText(region.name.toUpperCase(), rx1 + 6, 16);
    });

    // 2. Draw Beat and Bar Grid Lines
    const totalBars = Math.ceil(duration / engine.beatMap.secondsPerBar);
    for (let b = 1; b <= totalBars; b++) {
      const barTime = engine.beatMap.beatToTime(b, 1);
      const bx = timeToPx(barTime, width);

      // Bar Line
      ctx.strokeStyle = 'var(--border-strong)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, height);
      ctx.stroke();

      // Bar Number label
      ctx.font = '500 9px var(--font-mono)';
      ctx.fillStyle = 'var(--ink-3)';
      ctx.fillText(b.toString(), bx + 3, height - 6);

      // Sub-beats (2, 3, 4)
      for (let s = 2; s <= engine.beatMap.meterNumerator; s++) {
        const beatTime = engine.beatMap.beatToTime(b, s);
        const sx = timeToPx(beatTime, width);
        ctx.strokeStyle = 'var(--border)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, 4);
        ctx.lineTo(sx, height - 14);
        ctx.stroke();
      }
    }

    // 3. Draw Loop Area
    if (loop && loop.b > loop.a) {
      const lx1 = timeToPx(loop.a, width);
      const lx2 = timeToPx(loop.b, width);
      ctx.fillStyle = 'rgba(241, 217, 206, 0.45)'; // accent-soft
      ctx.fillRect(lx1, 0, lx2 - lx1, height);

      // Loop border edges
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx1, 0);
      ctx.lineTo(lx1, height);
      ctx.moveTo(lx2, 0);
      ctx.lineTo(lx2, height);
      ctx.stroke();
    }

    // 4. Draw Waveform Peaks
    const currentPos = engine.getSongPosition();
    const peaks = engine.peaks;

    if (peaks && peaks.levels.length > 0) {
      const level = peaks.levels[1] || peaks.levels[0];
      const centerY = height / 2;
      const ampHeight = (height - 32) / 2;

      ctx.lineWidth = 1.2;
      const bucketCount = level.min.length;

      for (let i = 0; i < bucketCount; i++) {
        const timeAtSample = (i / bucketCount) * duration;
        const x = timeToPx(timeAtSample, width);

        const minVal = level.min[i];
        const maxVal = level.max[i];

        const y1 = centerY - maxVal * ampHeight;
        const y2 = centerY - minVal * ampHeight;

        // Played part vs unplayed part
        ctx.strokeStyle =
          timeAtSample <= currentPos ? 'var(--primary)' : 'var(--ink-3)';

        ctx.beginPath();
        ctx.moveTo(x, Math.max(8, y1));
        ctx.lineTo(x, Math.min(height - 8, y2 + 1));
        ctx.stroke();
      }
    } else {
      // Fallback center guide line while decoding
      ctx.strokeStyle = 'var(--border)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    ctx.restore();
  }, [duration, engine, loop, project.regions, timeToPx]);

  // Hook into Central Clock Ticker for 60fps Playhead Move with NO React Re-renders
  useEffect(() => {
    const unsubscribe = ticker.subscribe((songPos) => {
      if (containerRef.current && playheadRef.current) {
        const width = containerRef.current.clientWidth;
        const x = (songPos / duration) * width;
        playheadRef.current.style.transform = `translateX(${x}px)`;
      }
    });
    return () => unsubscribe();
  }, [duration, ticker]);

  // Redraw canvas on state changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform, project.regions, loop, engine.peaks]);

  // Window resize observer
  useEffect(() => {
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  // Pointer interactions: seek, scrub, loop drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeAtPointer = pxToTime(x, rect.width);

    // Check if clicked near loop handles
    if (loop) {
      const handleAx = timeToPx(loop.a, rect.width);
      const handleBx = timeToPx(loop.b, rect.width);

      if (Math.abs(x - handleAx) <= 12) {
        setActiveHandle('a');
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (Math.abs(x - handleBx) <= 12) {
        setActiveHandle('b');
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Otherwise it's a scrub or seek gesture
    wasPlayingBeforeScrubRef.current = isPlaying;
    setIsScrubbing(true);
    lastScrubPosRef.current = timeAtPointer;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Seek to clicked position
    const snapped = engine.beatMap.snapTime(timeAtPointer, snap);
    seekTo(snapped.time);

    if (hearScrub) {
      engine.scrubGrain(snapped.time);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetTime = pxToTime(x, rect.width);

    // Dragging Loop Handle A
    if (activeHandle === 'a' && loop) {
      const snapped = engine.beatMap.snapTime(targetTime, snap);
      if (snapped.time < loop.b - 0.25) {
        setLoop({ a: snapped.time, b: loop.b });
      }
      return;
    }

    // Dragging Loop Handle B
    if (activeHandle === 'b' && loop) {
      const snapped = engine.beatMap.snapTime(targetTime, snap);
      if (snapped.time > loop.a + 0.25) {
        setLoop({ a: loop.a, b: snapped.time });
      }
      return;
    }

    // Scrubbing Playhead
    if (isScrubbing) {
      seekTo(targetTime);
      if (hearScrub) {
        engine.scrubGrain(targetTime);
      }

      // Update tooltip
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.transform = `translateX(${x}px)`;
        const beatPos = engine.beatMap.timeToBeat(targetTime);
        tooltipRef.current.textContent = `${formatTime(targetTime)} · ${formatBarBeat(
          beatPos.bar,
          beatPos.beat
        )}`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeHandle !== 'none') {
      setActiveHandle('none');
    }

    if (isScrubbing) {
      setIsScrubbing(false);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      // If was playing before scrub, resume
      if (wasPlayingBeforeScrubRef.current && !isPlaying) {
        engine.play(false);
      }
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="relative w-full bg-surface-sunken border-b border-border select-none">
      {/* Zoom / View controls bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-surface border-b border-border/60 text-[11px] font-ui text-ink-2">
        <span className="flex items-center gap-1.5 font-medium">
          <span>Overview</span>
          <span className="text-ink-3">·</span>
          <span>{duration}s</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1 hover:bg-surface-sunken rounded-sm text-ink-2 hover:text-ink"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(4.0, zoom + 0.25))}
            className="p-1 hover:bg-surface-sunken rounded-sm text-ink-2 hover:text-ink"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Waveform Track Container */}
      <div
        ref={containerRef}
        role="slider"
        aria-label="Timeline position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={engine.getSongPosition()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-36 cursor-crosshair touch-none overflow-hidden"
      >
        {/* Canvas for Waveform, Regions, Grid, and Loop shading */}
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Marker Flags Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {project.markers.map((marker) => {
            const x = timeToPx(marker.time, containerRef.current?.clientWidth || 360);
            return (
              <div
                key={marker.id}
                className="absolute top-0 bottom-0 pointer-events-auto cursor-pointer group"
                style={{ transform: `translateX(${x}px)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(marker.time);
                }}
              >
                {/* 2px vertical marker hairline */}
                <div
                  className="w-0.5 h-full opacity-80 group-hover:opacity-100"
                  style={{ backgroundColor: marker.color }}
                />
                {/* Marker flag at top */}
                <div
                  className="absolute top-0 left-0 -translate-x-1/2 px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium text-white shadow-1 whitespace-nowrap transition-transform duration-120 group-hover:scale-105"
                  style={{ backgroundColor: marker.color }}
                >
                  {marker.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loop Bracket Draggable Handles */}
        {loop && (
          <>
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-10 flex items-center justify-center group"
              style={{
                transform: `translateX(${timeToPx(
                  loop.a,
                  containerRef.current?.clientWidth || 360
                )}px)`,
              }}
            >
              <div className="w-1.5 h-7 bg-accent rounded-sm shadow-1 group-hover:scale-110 transition-transform" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-10 flex items-center justify-center group"
              style={{
                transform: `translateX(${timeToPx(
                  loop.b,
                  containerRef.current?.clientWidth || 360
                )}px)`,
              }}
            >
              <div className="w-1.5 h-7 bg-accent rounded-sm shadow-1 group-hover:scale-110 transition-transform" />
            </div>
          </>
        )}

        {/* 60fps Hardware/CSS Transform Playhead Line */}
        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-20 pointer-events-none will-change-transform"
          style={{ transform: 'translateX(0px)' }}
        >
          {/* Terracotta Top Playhead Triangle Head */}
          <div className="absolute top-0 -left-1.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-accent" />
          {/* Terracotta Bottom Playhead Triangle Head */}
          <div className="absolute bottom-0 -left-1.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[9px] border-b-accent" />
        </div>

        {/* Scrub Time Tooltip */}
        <div
          ref={tooltipRef}
          style={{ display: 'none' }}
          className="absolute top-2 left-0 -translate-x-1/2 z-30 pointer-events-none px-2 py-1 bg-ink text-[#F4F1EB] rounded text-[11px] font-mono tabular-nums shadow-2 whitespace-nowrap"
        />
      </div>
    </div>
  );
};
