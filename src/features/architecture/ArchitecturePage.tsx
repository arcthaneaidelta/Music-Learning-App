import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { MasterClock } from '../../audio/MasterClock';
import { Slider } from '../../components/ui/Slider';
import {
  Cpu,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Code,
  CheckCircle2,
  FileJson,
} from 'lucide-react';
import { DEFAULT_HARBOUR_LIGHT_PROJECT } from '../../persistence/schema';

export const ArchitecturePage: React.FC = () => {
  // Live demonstration of the MasterClock math
  const [clock] = useState(() => new MasterClock(80.0));
  const [simRate, setSimRate] = useState(1.0);
  const [simPos, setSimPos] = useState(30.0);
  const [nowOffset, setNowOffset] = useState(0);
  const [isReanchored, setIsReanchored] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);

  useEffect(() => {
    clock.seek(simPos, 0);
  }, [clock, simPos]);

  const handleRateChange = (newRate: number) => {
    clock.setRate(newRate, nowOffset);
    setSimRate(newRate);
    setIsReanchored(true);
    setTimeout(() => setIsReanchored(false), 200);
  };

  const handleSeek = (newPos: number) => {
    clock.seek(newPos, nowOffset);
    setSimPos(newPos);
    setIsReanchored(true);
    setTimeout(() => setIsReanchored(false), 200);
  };

  const currentDerivedPos = clock.getPosition(nowOffset);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-accent-soft">
      {/* Top Navbar */}
      <header className="h-16 w-full border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-nav">
        <Link to="/" className="inline-block">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-4 text-xs font-ui">
          <Link to="/" className="text-ink-2 hover:text-ink transition-colors">
            Demo
          </Link>
          <Link
            to="/architecture"
            className="text-primary font-semibold underline underline-offset-4"
          >
            Architecture
          </Link>
          <Link
            to="/proposal"
            className="text-ink-2 hover:text-ink transition-colors"
          >
            Proposal
          </Link>
          <Link to="/studio/harbour-light">
            <Button variant="primary" size="sm">
              Open the demo →
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header */}
        <div>
          <div className="text-xs font-semibold font-ui uppercase tracking-wider text-accent mb-2">
            Technical Architecture & Risk Analysis
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-ink leading-tight">
            MASTER AUDIO CLOCK: The single source of time.
          </h1>
          <p className="text-base text-ink-2 mt-3 leading-relaxed">
            One clock. Everything derived. Here is the formal timing model, platform
            translation, and the risk register I'd retire first in production.
          </p>

          {/* Test verification badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/30 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>7/7 pure-function unit tests passing (re-anchor continuity Δ &lt; 1e-9)</span>
          </div>
        </div>

        {/* 1. Interactive Master Clock Model Diagram */}
        <section className="flex flex-col gap-4 p-6 bg-surface border border-border rounded-lg shadow-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-medium text-ink">
                1. The Clock Model in One Picture
              </h2>
            </div>
            <span className="text-xs font-mono text-ink-3">Interactive Pure Model</span>
          </div>

          <p className="text-xs text-ink-2 leading-relaxed">
            Drag the speed slider or tap seek points below. Notice how changing rate{' '}
            <strong>re-anchors the clock formula</strong> instantly without a visual jump.
          </p>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-sunken rounded border border-border">
            <div>
              <Slider
                min={0.5}
                max={1.5}
                step={0.05}
                value={simRate}
                onChange={handleRateChange}
                label="Simulated Playback Rate"
                unit="x"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs font-ui text-ink-2">Seek Position:</div>
              <div className="flex items-center gap-2 mt-1">
                {[0, 10, 30, 50, 65].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleSeek(pos)}
                    className="px-2.5 py-1 text-xs font-mono rounded border border-border bg-surface hover:bg-surface-elevated active:scale-95"
                  >
                    {pos}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Mathematical Formula Readout */}
          <div
            className={`p-4 rounded-md border text-xs font-mono leading-relaxed transition-colors duration-150 ${
              isReanchored
                ? 'bg-accent-soft border-accent text-accent'
                : 'bg-[#1E2321] border-[#1E2321] text-[#EBE7DF]'
            }`}
          >
            <div className="text-[11px] opacity-70 mb-1">
              // Continuous Mathematical Derivation:
            </div>
            <div>
              songPos(now) = anchorSongPos + (now - anchorCtxTime) × rate
            </div>
            <div className="mt-2 text-emerald-400">
              = {clock.anchorSongPos.toFixed(3)}s + ({nowOffset.toFixed(3)}s -{' '}
              {clock.anchorCtxTime.toFixed(3)}s) × {simRate.toFixed(2)}
            </div>
            <div className="mt-1 font-bold text-white text-sm">
              → Current Position: {currentDerivedPos.toFixed(3)} seconds
            </div>
          </div>

          {/* Architectural Hierarchy Diagram */}
          <div className="p-4 bg-surface-sunken/60 rounded border border-border text-center">
            <div className="inline-block px-4 py-2 bg-primary text-white rounded font-mono text-xs font-semibold shadow-1">
              MASTER AUDIO CLOCK (AudioContext.getOutputTimestamp)
            </div>
            <div className="w-0.5 h-6 bg-border-strong mx-auto" />
            <div className="w-full max-w-md h-0.5 bg-border-strong mx-auto" />
            <div className="grid grid-cols-4 max-w-md mx-auto pt-2 gap-2 text-[11px] font-mono">
              <div className="p-1.5 bg-surface rounded border border-border">Counts & Bars</div>
              <div className="p-1.5 bg-surface rounded border border-border">Waveform / Playhead</div>
              <div className="p-1.5 bg-surface rounded border border-border">Loop Brackets</div>
              <div className="p-1.5 bg-surface rounded border border-border">Markers & Flags</div>
            </div>
          </div>
        </section>

        {/* 2. Platform Translation Table */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-display font-medium text-ink">
              2. Platform Architecture Mapping
            </h2>
            <p className="text-xs text-ink-3 mt-1 font-ui">
              How the same clock model translates cleanly into iOS and Android production runtimes.
            </p>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg bg-surface shadow-1">
            <table className="w-full text-left text-xs font-ui border-collapse">
              <thead>
                <tr className="bg-surface-sunken border-b border-border text-ink-3 uppercase text-[11px] font-semibold">
                  <th className="p-3.5">Concern</th>
                  <th className="p-3.5">iOS Native</th>
                  <th className="p-3.5">Android Native</th>
                  <th className="p-3.5">Web Proof Demo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-ink">
                <tr>
                  <td className="p-3.5 font-semibold text-primary">Master Clock</td>
                  <td className="p-3.5 font-mono text-xs">AVAudioEngine / AVAudioTime</td>
                  <td className="p-3.5 font-mono text-xs">AudioTrack.getTimestamp() / Media3 AudioTimestamp</td>
                  <td className="p-3.5 font-mono text-xs">AudioContext.getOutputTimestamp()</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-primary">Sample-Accurate Looping</td>
                  <td className="p-3.5">AVAudioPlayerNode.scheduleBuffer(options: .loops)</td>
                  <td className="p-3.5">AudioTrack loop markers / scheduled segments</td>
                  <td className="p-3.5 font-mono text-xs">AudioBufferSourceNode.loop</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-primary">Playback Speed</td>
                  <td className="p-3.5">AVAudioUnitTimePitch (pitch-preserved)</td>
                  <td className="p-3.5">Media3 PlaybackParameters / Sonic</td>
                  <td className="p-3.5 font-mono text-xs">playbackRate.setValueAtTime()</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-primary">Latency Compensation</td>
                  <td className="p-3.5">AVAudioSession.outputLatency</td>
                  <td className="p-3.5">AudioTrack.getLatency() / property frames</td>
                  <td className="p-3.5 font-mono text-xs">outputLatency / contextTime</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Risk Register Table */}
        <section className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-display font-medium text-ink">
                3. Technical Risk Register
              </h2>
            </div>
            <p className="text-xs text-ink-3 mt-1 font-ui">
              Senior engineering means identifying and retiring the hardest failure modes first.
            </p>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg bg-surface shadow-1">
            <table className="w-full text-left text-xs font-ui border-collapse">
              <thead>
                <tr className="bg-surface-sunken border-b border-border text-ink-3 uppercase text-[11px] font-semibold">
                  <th className="p-3">Risk & Scenario</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Mitigation Strategy</th>
                  <th className="p-3">Retire in PoC?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-ink">
                <tr>
                  <td className="p-3 font-medium">
                    Bluetooth latency & output route changes (AirPods disconnects)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-error/15 text-error font-semibold">
                      High
                    </span>
                  </td>
                  <td className="p-3 text-ink-2">
                    Listen to route change notifications; query outputLatency dynamically; re-anchor master clock.
                  </td>
                  <td className="p-3 font-semibold text-success">Yes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Compressed format loop clicks (MP3/AAC priming samples)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-error/15 text-error font-semibold">
                      High
                    </span>
                  </td>
                  <td className="p-3 text-ink-2">
                    Decode directly to PCM in memory; trim encoder padding delay samples before loop point mapping.
                  </td>
                  <td className="p-3 font-semibold text-success">Yes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Cross-thread bridge drift in React Native / Flutter
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-warning/15 text-warning font-semibold">
                      Med
                    </span>
                  </td>
                  <td className="p-3 text-ink-2">
                    Keep Master Clock completely on the native side; UI queries snapshots or receives high-fps events.
                  </td>
                  <td className="p-3 font-semibold text-success">Yes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Interruptions (phone calls, backgrounding)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-warning/15 text-warning font-semibold">
                      Med
                    </span>
                  </td>
                  <td className="p-3 text-ink-2">
                    Pause on interruption began; on interruption ended, check current hardware time and re-anchor.
                  </td>
                  <td className="p-3 font-semibold text-success">Yes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    Time-stretch audio quality at 50–70% speed
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-warning/15 text-warning font-semibold">
                      Med
                    </span>
                  </td>
                  <td className="p-3 text-ink-2">
                    AVAudioUnitTimePitch / Media3 Sonic A/B comparison for vocal/transient preservation.
                  </td>
                  <td className="p-3 font-semibold text-success">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Collapsible Data Model JSON */}
        <section className="flex flex-col gap-3 p-5 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold font-display text-ink">
                4. Timing Map Data Model Schema (.metre.json)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {jsonExpanded ? 'Collapse' : 'Expand Schema'}
            </button>
          </div>

          {jsonExpanded && (
            <pre className="p-4 bg-[#1E2321] text-[#EBE7DF] rounded text-[11px] font-mono overflow-x-auto leading-relaxed">
              {JSON.stringify(DEFAULT_HARBOUR_LIGHT_PROJECT, null, 2)}
            </pre>
          )}
        </section>

        {/* 5. What I'd Decide With You Before Coding */}
        <section className="p-6 bg-surface-sunken border border-border rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-base font-display font-medium text-ink">
              5. Three Architectural Decisions to Align on Day 1
            </h2>
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-ink-2 font-ui leading-relaxed">
            <li>
              <strong>Framework Choice:</strong> React Native with a bespoke C++/Swift/Kotlin native module vs. 100% native (Swift/Kotlin). A half-day spike will confirm latency performance.
            </li>
            <li>
              <strong>Audio Format Support:</strong> Confirming if user imports include DRM-free streaming formats or strictly uncompressed/lossless MP3/WAV/AAC.
            </li>
            <li>
              <strong>Pitch Preservation Scope:</strong> Deciding whether high-performance pitch-preserved time-stretch is a strict MVP pass/fail requirement or progressive enhancement.
            </li>
          </ol>
        </section>

        {/* Closing CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border">
          <Link to="/proposal" className="text-xs font-semibold text-primary hover:underline">
            Read fixed-price PoC proposal →
          </Link>
          <Link to="/studio/harbour-light">
            <Button variant="primary" size="md">
              Test the live studio demo →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};
