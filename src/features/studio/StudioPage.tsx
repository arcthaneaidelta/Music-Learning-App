import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useProjectStore } from '../../state/projectStore';
import { StudioHeader } from './StudioHeader';
import { CountStage } from './CountStage';
import { WaveformTimeline } from './WaveformTimeline';
import { SectionChipsRow } from './SectionChipsRow';
import { TransportBar } from './TransportBar';
import { LoopSpeedControls } from './LoopSpeedControls';
import { InspectorPanel } from './InspectorPanel';
import { MarkersSheet } from './MarkersSheet';
import { BeatMapSheet } from './BeatMapSheet';
import { ProjectMapSheet } from './ProjectMapSheet';
import { SyncToolsSheet } from './SyncToolsSheet';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { useToast } from '../../components/ui/Toast';
import { formatTimeExact, formatSpeed } from '../../lib/format';
import { Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

export const StudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tryParam = searchParams.get('try');

  const {
    loadProject,
    project,
    isAudioReady,
    recentRestored,
    togglePlay,
    addMarker,
    clearLoop,
    setLoop,
    rate,
    setRate,
    stepBeat,
    stepBar,
    snap,
    setSnap,
    toggleMetronome,
    setActiveSheet,
  } = useProjectStore();

  const { showToast } = useToast();
  const [coachMark, setCoachMark] = useState<string | null>(null);

  // Load project on mount or when id changes
  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id, loadProject]);

  // Handle "Simulate App Kill" Exact Restoration Toast (§10 F10)
  useEffect(() => {
    if (recentRestored && project) {
      const posStr = formatTimeExact(project.session.position);
      const loopStr = project.session.loop
        ? `Loop (Bar ${Math.round(project.session.loop.a / 2.5) + 1}–${Math.round(
            project.session.loop.b / 2.5
          ) + 1})`
        : 'No loop';
      const speedStr = formatSpeed(project.session.rate);

      showToast({
        type: 'success',
        text: `Restored exactly: ${posStr} · ${loopStr} · ${speedStr}`,
        durationMs: 5000,
      });
    }
  }, [recentRestored, project, showToast]);

  // Handle ?try= query parameter coach-mark (§23.7)
  useEffect(() => {
    if (!tryParam) return;

    if (tryParam === 'loop') {
      setCoachMark('Try looping: Chorus is pre-selected. Tap Loop to hear seamless repetition.');
    } else if (tryParam === 'speed') {
      setCoachMark('Try playback speed: Drop to 60% mid-loop to verify that musical counts stay rock-solid.');
    } else if (tryParam === 'markers') {
      setCoachMark('Try markers: Press "M" while playing to drop timestamped flags on the beat.');
    } else if (tryParam === 'scrub') {
      setCoachMark('Try scrubbing: Drag the playhead back and forth — counts and audio update with zero drift.');
    } else if (tryParam === 'restore') {
      setCoachMark('Try app kill: Click ⋯ menu → "Simulate App Kill & Restore" to test state preservation.');
    }
  }, [tryParam]);

  // Global Keyboard Shortcuts (§17)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          addMarker();
          showToast({ type: 'info', text: 'Dropped marker at playhead' });
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (project.session.loop) {
            clearLoop();
            showToast({ type: 'info', text: 'Loop cleared' });
          } else {
            // Quick 2-bar loop at playhead
            const cur = project.session.position;
            setLoop({ a: cur, b: cur + 5.0 });
            showToast({ type: 'info', text: 'Loop set (2 bars)' });
          }
          break;
        case '[':
          e.preventDefault();
          setRate(Math.max(0.5, rate - 0.05));
          break;
        case ']':
          e.preventDefault();
          setRate(Math.min(1.25, rate + 0.05));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) stepBar(-1);
          else stepBeat(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) stepBar(1);
          else stepBeat(1);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          const nextSnap = snap === 'bar' ? 'beat' : snap === 'beat' ? 'off' : 'bar';
          setSnap(nextSnap);
          showToast({ type: 'info', text: `Snap set to ${nextSnap}` });
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          toggleMetronome();
          break;
        case '?':
          e.preventDefault();
          setActiveSheet('shortcuts');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    addMarker,
    clearLoop,
    setLoop,
    rate,
    setRate,
    stepBar,
    stepBeat,
    snap,
    setSnap,
    toggleMetronome,
    setActiveSheet,
    project,
    showToast,
  ]);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-start lg:py-6 lg:px-4">
      {/* Coach mark banner if opened via deep-link */}
      {coachMark && (
        <div className="w-full max-w-4xl mx-auto mb-3 px-4 py-2.5 bg-accent-soft text-ink border border-accent/20 rounded-md text-xs font-ui flex items-center justify-between shadow-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span className="font-medium">{coachMark}</span>
          </div>
          <button
            type="button"
            onClick={() => setCoachMark(null)}
            className="text-xs font-semibold uppercase text-ink-2 hover:text-ink ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Desktop Wrapper */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Left Side: Desktop Title & Brief Instructions */}
        <aside className="w-64 hidden xl:flex flex-col gap-4 text-ink select-none">
          <Link to="/" className="inline-block mb-2">
            <Logo size="lg" />
          </Link>
          <div className="text-xs font-ui text-ink-3 uppercase tracking-wider font-semibold">
            Proof of Concept Studio
          </div>
          <h1 className="text-xl font-display font-medium leading-snug">
            Audio-locked musical timing engine.
          </h1>
          <p className="text-xs font-ui text-ink-2 leading-relaxed">
            All visual counts, loop points, markers, and waveforms derive from one master audio clock.
          </p>

          <div className="p-3 bg-surface border border-border rounded-md text-[11px] font-ui text-ink-2 flex flex-col gap-2 shadow-1">
            <div className="font-semibold text-ink">Suggested tests:</div>
            <ul className="list-disc pl-4 space-y-1 text-ink-3">
              <li>Tap Chorus chip → loop it at 70% speed.</li>
              <li>Press "M" while playing to drop markers.</li>
              <li>Use ⋯ menu → "Simulate App Kill" to verify exact position restore.</li>
            </ul>
          </div>

          <div className="pt-2 text-[11px] font-mono text-ink-3">
            Press <kbd className="px-1 py-0.5 border rounded bg-surface">?</kbd> for shortcuts
          </div>
        </aside>

        {/* Center: Mobile-first 430px Device Frame */}
        <main className="w-full max-w-[430px] min-h-[100dvh] lg:min-h-0 bg-surface lg:rounded-[28px] border-0 lg:border lg:border-border lg:shadow-3 flex flex-col overflow-hidden">
          {/* Header */}
          <StudioHeader />

          {/* Count Stage Hero */}
          <CountStage />

          {/* Timeline & Waveform */}
          <WaveformTimeline />

          {/* Section Chips */}
          <SectionChipsRow />

          {/* Transport Bar */}
          <TransportBar />

          {/* Loop & Speed Controls Panel */}
          <LoopSpeedControls />
        </main>

        {/* Right Side: Desktop Live Inspector Panel */}
        <InspectorPanel />
      </div>

      {/* Sheets & Drawers */}
      <MarkersSheet />
      <BeatMapSheet />
      <ProjectMapSheet />
      <SyncToolsSheet />
      <ShortcutsOverlay />
    </div>
  );
};
