import React, { useState, useRef } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { useProjectStore } from '../../state/projectStore';
import { AudioEngine } from '../../audio/AudioEngine';
import { formatTime } from '../../lib/format';
import { Sliders, MoveRight, MoveLeft, Target, Music } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const BeatMapSheet: React.FC = () => {
  const {
    activeSheet,
    setActiveSheet,
    project,
    setBpm,
    setDownbeatOffset,
    nudgeDownbeatMs,
  } = useProjectStore();

  const { showToast } = useToast();
  const engine = AudioEngine.getInstance();

  const isOpen = activeSheet === 'beat';
  const onClose = () => setActiveSheet(null);

  const currentBpm = project.tempoMap[0]?.bpm || 96;
  const currentOffset = project.downbeatOffset || 0.0;

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);
  const [tapDisplay, setTapDisplay] = useState<string>('Tap Beat');

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;

    // Reset if last tap was more than 2 seconds ago
    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      times.length = 0;
    }

    times.push(now);
    if (times.length > 5) {
      times.shift();
    }

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const detectedBpm = Math.round((60000 / avgInterval) * 10) / 10;
      setBpm(detectedBpm);
      setTapDisplay(`${detectedBpm} BPM`);
    } else {
      setTapDisplay('Keep tapping...');
    }
  };

  const handleSetBeat1Here = () => {
    const curPos = engine.getSongPosition();
    setDownbeatOffset(curPos);
    showToast({
      type: 'success',
      text: `Beat 1 locked to ${formatTime(curPos, true)}`,
    });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Set the Beat & Tempo Map"
      subtitle="Calibrate musical grid alignment and downbeat position"
    >
      <div className="flex flex-col gap-5 text-ink">
        {/* 1. BPM Setting */}
        <div className="flex flex-col gap-2 p-4 bg-surface rounded-md border border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Tempo (BPM)
            </label>
            <span className="font-mono text-lg font-bold text-primary">
              {currentBpm.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setBpm(Math.max(30, currentBpm - 1))}
              className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface-sunken hover:bg-surface text-ink font-mono text-sm"
            >
              -1
            </button>
            <input
              type="range"
              min="40"
              max="240"
              step="0.5"
              value={currentBpm}
              onChange={(e) => setBpm(parseFloat(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setBpm(Math.min(300, currentBpm + 1))}
              className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface-sunken hover:bg-surface text-ink font-mono text-sm"
            >
              +1
            </button>
          </div>

          {/* Tap Tempo Button */}
          <button
            type="button"
            onClick={handleTapTempo}
            className="mt-2 w-full py-2.5 px-3 bg-surface-sunken border border-border hover:border-border-strong rounded text-xs font-semibold font-ui active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Music className="w-3.5 h-3.5 text-accent" />
            <span>{tapDisplay}</span>
          </button>
        </div>

        {/* 2. Beat 1 Calibration */}
        <div className="flex flex-col gap-3 p-4 bg-surface rounded-md border border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Downbeat Offset (Beat 1)
            </label>
            <span className="font-mono text-xs text-ink-3">
              {formatTime(currentOffset, true)}
            </span>
          </div>

          <p className="text-xs text-ink-3 leading-relaxed">
            Real audio files rarely start right on beat 1. Play until the first kick or downbeat hits, pause, and tap:
          </p>

          <button
            type="button"
            onClick={handleSetBeat1Here}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-hover active:scale-98 transition-all shadow-1"
          >
            <Target className="w-4 h-4 text-accent" />
            <span>"Beat 1 is here" (at current playhead)</span>
          </button>

          {/* Nudge +/- 10ms */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border mt-1">
            <span className="text-xs font-ui text-ink-2">Fine Nudge:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  nudgeDownbeatMs(-10);
                  showToast({ type: 'info', text: 'Nudged -10ms' });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-surface-sunken hover:bg-surface text-xs font-mono"
              >
                <MoveLeft className="w-3 h-3" />
                <span>-10ms</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  nudgeDownbeatMs(10);
                  showToast({ type: 'info', text: 'Nudged +10ms' });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-surface-sunken hover:bg-surface text-xs font-mono"
              >
                <span>+10ms</span>
                <MoveRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
};
