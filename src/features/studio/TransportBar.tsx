import React from 'react';
import { PlayButton } from '../../components/ui/PlayButton';
import { IconButton } from '../../components/ui/IconButton';
import {
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { useProjectStore } from '../../state/projectStore';
import { useToast } from '../../components/ui/Toast';
import { formatTime } from '../../lib/format';

export const TransportBar: React.FC = () => {
  const {
    isPlaying,
    isAudioReady,
    togglePlay,
    seekTo,
    stepBar,
    loop,
    project,
    addMarker,
    deleteMarker,
  } = useProjectStore();

  const { showToast } = useToast();

  const handleToStart = () => {
    if (loop) {
      seekTo(loop.a);
    } else {
      seekTo(0);
    }
  };

  const handleNextSection = () => {
    const curPos = useProjectStore.getState().project.session.position;
    const nextRegion = project.regions.find((r) => r.start > curPos + 0.1);
    if (nextRegion) {
      seekTo(nextRegion.start);
    } else {
      seekTo(0);
    }
  };

  const handleAddMarker = () => {
    const m = addMarker();
    showToast({
      type: 'undo',
      text: `Added ${m.name} at ${formatTime(m.time)}`,
      undoAction: () => deleteMarker(m.id),
    });
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 bg-surface border-b border-border select-none">
      {/* Left utility: Return to start / loop start */}
      <IconButton
        icon={<RotateCcw className="w-5 h-5" />}
        label={loop ? 'Return to loop start' : 'Return to beginning'}
        onClick={handleToStart}
        size="md"
      />

      {/* Main Transport Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Skip to Previous / Loop start */}
        <IconButton
          icon={<SkipBack className="w-5 h-5" />}
          label="Skip back"
          onClick={handleToStart}
          size="md"
        />

        {/* -1 Bar */}
        <button
          type="button"
          onClick={() => stepBar(-1)}
          className="px-2.5 py-1.5 rounded-md border border-border bg-surface-sunken hover:bg-surface text-ink text-xs font-mono font-medium active:scale-95 transition-all"
          title="Step back 1 bar (Left arrow)"
        >
          -1 bar
        </button>

        {/* Big 64px Play Button */}
        <PlayButton
          isPlaying={isPlaying}
          isLoading={!isAudioReady}
          onClick={togglePlay}
        />

        {/* +1 Bar */}
        <button
          type="button"
          onClick={() => stepBar(1)}
          className="px-2.5 py-1.5 rounded-md border border-border bg-surface-sunken hover:bg-surface text-ink text-xs font-mono font-medium active:scale-95 transition-all"
          title="Step forward 1 bar (Right arrow)"
        >
          +1 bar
        </button>

        {/* Skip to Next Section */}
        <IconButton
          icon={<SkipForward className="w-5 h-5" />}
          label="Next section"
          onClick={handleNextSection}
          size="md"
        />
      </div>

      {/* Right utility: Quick Add Marker */}
      <button
        type="button"
        onClick={handleAddMarker}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-sunken hover:bg-surface border border-border text-ink text-xs font-medium font-ui active:scale-95 transition-all shadow-1"
        title="Add marker at playhead (Hotkey: M)"
      >
        <Flag className="w-4 h-4 text-accent" />
        <span className="hidden xs:inline">+ Marker</span>
      </button>
    </div>
  );
};
