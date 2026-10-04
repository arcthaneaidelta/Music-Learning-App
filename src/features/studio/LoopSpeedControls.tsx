import React from 'react';
import { useProjectStore } from '../../state/projectStore';
import { formatTime, formatSpeed } from '../../lib/format';
import { Repeat, Sliders, Volume2, Bell, Sparkles, X } from 'lucide-react';
import { Segmented } from '../../components/ui/Segmented';
import { Slider } from '../../components/ui/Slider';

const SPEED_PRESETS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25];

export const LoopSpeedControls: React.FC = () => {
  const {
    loop,
    rate,
    snap,
    metronome,
    countIn,
    hearScrub,
    setLoop,
    clearLoop,
    setRate,
    setSnap,
    toggleMetronome,
    toggleCountIn,
    toggleHearScrub,
    project,
  } = useProjectStore();

  const handleQuickLoop2Bars = () => {
    const curPos = useProjectStore.getState().project.session.position;
    const spb = useProjectStore.getState().project.tempoMap[0].bpm;
    const barDuration = (60 / spb) * 4;
    const a = Math.floor(curPos / barDuration) * barDuration;
    const b = a + barDuration * 2;
    setLoop({ a, b: Math.min(project.audio.duration, b) });
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-surface select-none">
      {/* 1. Loop Control Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-sunken border border-border rounded-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (loop) {
                clearLoop();
              } else {
                handleQuickLoop2Bars();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium font-ui transition-all ${
              loop
                ? 'bg-accent text-white shadow-1'
                : 'bg-surface text-ink border border-border hover:border-border-strong'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{loop ? 'Loop Active' : 'Set Loop'}</span>
          </button>

          {loop ? (
            <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-ink-2">
              <span className="bg-surface px-2 py-0.5 rounded border border-border">
                A {formatTime(loop.a, true)}
              </span>
              <span className="text-ink-3">→</span>
              <span className="bg-surface px-2 py-0.5 rounded border border-border">
                B {formatTime(loop.b, true)}
              </span>
              <button
                type="button"
                onClick={clearLoop}
                className="p-1 hover:text-error text-ink-3 rounded"
                title="Clear loop (L)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-ink-3 hidden sm:inline">
              Drag brackets or select a section to loop
            </span>
          )}
        </div>

        {/* Snap mode segmented control */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-ink-3 font-ui text-[11px] uppercase tracking-wider hidden xs:inline">
            Snap:
          </span>
          <Segmented
            options={[
              { value: 'bar', label: 'Bar' },
              { value: 'beat', label: 'Beat' },
              { value: 'off', label: 'Off' },
            ]}
            value={snap}
            onChange={(val) => setSnap(val as any)}
            size="sm"
          />
        </div>
      </div>

      {/* 2. Speed Control Section */}
      <div className="flex flex-col gap-2 p-3 bg-surface-sunken border border-border rounded-md">
        <div className="flex items-center justify-between text-xs font-ui">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Playback Speed</span>
          </div>
          <span className="font-mono font-semibold text-primary tabular-nums">
            {formatSpeed(rate)}
          </span>
        </div>

        {/* Preset chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {SPEED_PRESETS.map((p) => {
            const isSelected = Math.abs(rate - p) < 0.01;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setRate(p)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-sm border transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-1'
                    : 'bg-surface text-ink-2 border-border hover:bg-surface-elevated'
                }`}
              >
                {Math.round(p * 100)}%
              </button>
            );
          })}
        </div>

        {/* Fine speed slider */}
        <Slider
          min={0.5}
          max={1.25}
          step={0.01}
          value={rate}
          onChange={(v) => setRate(v)}
          className="mt-1"
        />

        {/* Honest Architecture Disclosure Note (§23.4 / F8) */}
        <p className="text-[11px] text-ink-3 leading-tight italic">
          Pitch shifts with playbackRate in this browser demo. Production uses
          native time-stretch engines (AVAudioUnitTimePitch / Media3 Sonic).
        </p>
      </div>

      {/* 3. Toggles Row (Metronome, Count-In, Scrub Audio) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metronome Toggle */}
        <button
          type="button"
          onClick={toggleMetronome}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md border text-xs font-medium font-ui transition-all ${
            metronome
              ? 'bg-primary text-white border-primary shadow-1'
              : 'bg-surface text-ink-2 border-border hover:bg-surface-sunken'
          }`}
          title="Toggle Metronome Click (C)"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Click</span>
        </button>

        {/* Count-In Toggle */}
        <button
          type="button"
          onClick={toggleCountIn}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md border text-xs font-medium font-ui transition-all ${
            countIn
              ? 'bg-primary text-white border-primary shadow-1'
              : 'bg-surface text-ink-2 border-border hover:bg-surface-sunken'
          }`}
          title="1-bar metronome count-in before playback"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Count-in</span>
        </button>

        {/* Hear While Scrubbing */}
        <button
          type="button"
          onClick={toggleHearScrub}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md border text-xs font-medium font-ui transition-all ${
            hearScrub
              ? 'bg-primary text-white border-primary shadow-1'
              : 'bg-surface text-ink-2 border-border hover:bg-surface-sunken'
          }`}
          title="Play 90ms audio grains during timeline scrubbing"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Scrub Audio</span>
        </button>
      </div>
    </div>
  );
};
