import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { LivingScore } from './LivingScore';
import { LoadingOverlay } from './LoadingOverlay';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [showLoader, setShowLoader] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStoryStep, setActiveStoryStep] = useState(1);

  // Deliverables checklist per §7.4
  const checklist = [
    { num: '01', title: 'Import & play local file', desc: 'Drag any MP3, WAV or M4A onto the studio; decodes directly in-browser with zero upload.', tryLink: '/studio' },
    { num: '02', title: 'Play / pause / seek', desc: 'Sample-locked transport bar with tap-to-seek waveform and bar/beat stepping.', tryLink: '/studio/harbour-light' },
    { num: '03', title: 'Timestamped markers', desc: 'Press M to drop flags on the beat; drag to nudge; tap to jump with zero latency.', tryLink: '/studio/harbour-light?try=markers' },
    { num: '04', title: 'Synchronized musical counts', desc: 'Giant count display locked to kick transients without cumulative timing wander.', tryLink: '/studio/harbour-light' },
    { num: '05', title: 'Song regions (define & navigate)', desc: 'Coloured section bands with active region chips and instant navigation.', tryLink: '/studio/harbour-light' },
    { num: '06', title: 'Accurate region looping', desc: 'Hardware buffer loops with pass counter and 0 clicks at wrap boundaries.', tryLink: '/studio/harbour-light?try=loop' },
    { num: '07', title: 'Bidirectional scrub with sync', desc: 'Drag playhead with optional 90ms grain audio; counts update strictly derived.', tryLink: '/studio/harbour-light?try=scrub' },
    { num: '08', title: 'Playback speed (50%–125%)', desc: 'Drop to 60% mid-loop; clock re-anchors continuously without losing position.', tryLink: '/studio/harbour-light?try=speed' },
    { num: '09', title: 'Save timing map', desc: 'Full JSON timing map drawer with versioned schema export and clipboard copy.', tryLink: '/studio/harbour-light' },
    { num: '10', title: 'Exact app kill restore', desc: 'Simulate app kill reloads instantly and restores exact millisecond position.', tryLink: '/studio/harbour-light?try=restore' },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-accent-soft">
      {/* 900ms Instrument-tuning Entry Loader */}
      {showLoader && <LoadingOverlay onComplete={() => setShowLoader(false)} />}

      {/* Top Navbar */}
      <header className="h-16 w-full border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-nav">
        <Link to="/" className="inline-block">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-ui">
          <Link
            to="/architecture"
            className="text-ink-2 hover:text-ink transition-colors font-medium"
          >
            Architecture & Clock Model
          </Link>
          <Link
            to="/proposal"
            className="text-ink-2 hover:text-ink transition-colors font-medium"
          >
            Milestone Proposal
          </Link>
          <Link to="/studio/harbour-light">
            <Button variant="primary" size="sm">
              Open the live demo →
            </Button>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <Link to="/studio/harbour-light">
            <Button variant="primary" size="sm">
              Demo
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-ink-2 hover:text-ink"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-modal bg-surface p-6 flex flex-col gap-6 md:hidden">
          <Link
            to="/studio/harbour-light"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl font-display font-medium text-ink"
          >
            Open Live Studio Demo →
          </Link>
          <Link
            to="/studio"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl font-display font-medium text-ink"
          >
            Projects Library
          </Link>
          <Link
            to="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl font-display font-medium text-ink"
          >
            Architecture & Risk Register
          </Link>
          <Link
            to="/proposal"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl font-display font-medium text-ink"
          >
            Fixed-Price Bid Proposal
          </Link>
        </div>
      )}

      {/* Hero Section (§7.2) */}
      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 pb-16 lg:py-20 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-accent">
              <span>PROOF OF CONCEPT</span>
              <span>·</span>
              <span>AUDIO SYNCHRONIZATION</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-ink tracking-tight leading-[1.05]">
              The audio is the clock. Everything else follows.
            </h1>

            <p className="text-base sm:text-lg text-ink-2 leading-relaxed mt-1">
              A working demonstration of sample-accurate counts, loops, markers,
              and speed changes: built the way a production iOS and Android app
              would be, and playable right here.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link to="/studio/harbour-light">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open the live demo
                </Button>
              </Link>
              <Link to="/architecture">
                <Button variant="secondary" size="lg">
                  How it's built
                </Button>
              </Link>
            </div>

            <div className="text-xs text-ink-3 mt-1 font-ui">
              Best with headphones. No sign-up. Nothing leaves your device.
            </div>
          </div>

          {/* Right Column: Living Score Canvas (§7.2) */}
          <div className="lg:col-span-6 w-full">
            <LivingScore />
          </div>
        </div>

        {/* Scroll Cue (§7.2) */}
        <div className="w-full flex justify-center mt-12 sm:mt-16">
          <div className="relative w-px h-8 bg-border">
            <div className="w-1.5 h-1.5 rounded-full bg-accent -ml-[2px] animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* Section 7.3: "Why this is hard" (Scroll story with 3 beats) */}
      <section className="w-full bg-surface border-y border-border py-16 px-4 sm:px-6">
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Sticky Headline */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="text-xs font-mono uppercase tracking-wider text-accent font-semibold mb-2">
              The Architecture Thesis
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-ink leading-tight">
              A music app that drifts is a broken music app.
            </h2>
            <p className="text-sm text-ink-2 mt-3 leading-relaxed">
              Timers, animation frames, and audio hardware buffers run on entirely different physical clocks. If your UI asks anything other than the audio hardware what time it is, they will disagree by a few milliseconds, then by a few hundred.
            </p>
          </div>

          {/* Right Column: 3 Beats & Diagram */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1 */}
            <div
              className={`p-5 rounded-lg border transition-all duration-200 cursor-pointer ${
                activeStoryStep === 1
                  ? 'bg-surface-elevated border-border-strong shadow-1'
                  : 'bg-surface-sunken/50 border-border opacity-70'
              }`}
              onClick={() => setActiveStoryStep(1)}
            >
              <div className="text-xs font-mono font-semibold text-error mb-1">
                Step 1: The Common Pitfall
              </div>
              <h3 className="text-base font-semibold font-ui text-ink">
                "Most apps ask the UI what time it is."
              </h3>
              <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                They start an `Interval` or increment a timestamp on every screen refresh. When the device stutters or drops a frame, the visual counts drift permanently away from the music's downbeat.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-5 rounded-lg border transition-all duration-200 cursor-pointer ${
                activeStoryStep === 2
                  ? 'bg-surface-elevated border-border-strong shadow-1'
                  : 'bg-surface-sunken/50 border-border opacity-70'
              }`}
              onClick={() => setActiveStoryStep(2)}
            >
              <div className="text-xs font-mono font-semibold text-primary mb-1">
                Step 2: The Core Rule
              </div>
              <h3 className="text-base font-semibold font-ui text-ink">
                "This one asks the audio."
              </h3>
              <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                The hardware audio clock (`AudioContext.getOutputTimestamp`) is the only master authority. Every single visual element is computed on-the-fly as a pure mathematical function of audio position.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-5 rounded-lg border transition-all duration-200 cursor-pointer ${
                activeStoryStep === 3
                  ? 'bg-surface-elevated border-border-strong shadow-1'
                  : 'bg-surface-sunken/50 border-border opacity-70'
              }`}
              onClick={() => setActiveStoryStep(3)}
            >
              <div className="text-xs font-mono font-semibold text-accent mb-1">
                Step 3: Zero Accumulation
              </div>
              <h3 className="text-base font-semibold font-ui text-ink">
                "Everything else is derived."
              </h3>
              <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                Musical counts, loop boundaries, markers, and waveforms never keep internal state. If you change playback speed or scrub forward, the clock re-anchors instantaneously with zero drift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7.4: "Ten things, working" Checklist */}
      <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-16 flex flex-col gap-8">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-accent font-semibold mb-1">
            Verification Matrix
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-ink">
            Ten things requested. All ten working.
          </h2>
          <p className="text-xs sm:text-sm text-ink-3 mt-1 font-ui">
            Click "Try it" on any item to open the live studio with that capability focused.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((item) => (
            <div
              key={item.num}
              className="p-4 bg-surface border border-border rounded-lg shadow-1 hover:border-border-strong transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-ink-3 mt-0.5">
                  {item.num}
                </span>
                <div>
                  <h3 className="text-sm font-semibold font-ui text-ink group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Link
                  to={item.tryLink}
                  className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                >
                  <span>Try it in studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7.5: "Numbers, not adjectives" */}
      <section className="w-full bg-surface border-y border-border py-14 px-4 sm:px-6">
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-primary">
              ≤ 16 ms
            </div>
            <div className="text-xs font-ui text-ink-2 mt-2 font-medium">
              ±1 visual video frame
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5 max-w-[200px]">
              Visual playhead vs audio clock, measured live on canvas
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-primary">
              0 clicks
            </div>
            <div className="text-xs font-ui text-ink-2 mt-2 font-medium">
              At loop wrap boundaries
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5 max-w-[200px]">
              Sample-aligned buffer looping at 60%–125% speed
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-primary">
              10 / 10
            </div>
            <div className="text-xs font-ui text-ink-2 mt-2 font-medium">
              PoC Deliverables
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5 max-w-[200px]">
              Demonstrated live in browser with real audio logic
            </div>
          </div>
        </div>
      </section>

      {/* Section 7.6: "Honest about the hard parts" (Trust Differentiator) */}
      <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-16 flex flex-col gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-accent font-semibold mb-1">
            Trust & Transparency
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-ink">
            Honest about the hard parts.
          </h2>
          <p className="text-xs sm:text-sm text-ink-3 mt-1 font-ui">
            Audio apps fail on the edge cases. Here are the three platform challenges that require upfront native planning:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-surface border border-border rounded-lg flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold font-ui text-ink">
                1. Time-Stretching Quality
              </h3>
              <p className="text-xs text-ink-2 mt-1.5 leading-relaxed">
                Browser audio relies on simple playbackRate, which shifts pitch. In native production, we deploy `AVAudioUnitTimePitch` (iOS) and Media3 `Sonic` (Android) to preserve natural pitch at 50%–75% speed.
              </p>
            </div>
            <Link
              to="/architecture"
              className="text-xs font-semibold text-primary hover:underline"
            >
              See risk register →
            </Link>
          </div>

          <div className="p-5 bg-surface border border-border rounded-lg flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold font-ui text-ink">
                2. Bluetooth Latency & Route Changes
              </h3>
              <p className="text-xs text-ink-2 mt-1.5 leading-relaxed">
                When a user connects AirPods or a car stereo mid-playback, output latency spikes from 12ms to 180ms. The engine must query outputLatency and re-anchor without visual stutter.
              </p>
            </div>
            <Link
              to="/architecture"
              className="text-xs font-semibold text-primary hover:underline"
            >
              See platform mapping →
            </Link>
          </div>

          <div className="p-5 bg-surface border border-border rounded-lg flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold font-ui text-ink">
                3. Interruptions & Memory
              </h3>
              <p className="text-xs text-ink-2 mt-1.5 leading-relaxed">
                Incoming calls, alarms, and backgrounding require audio session interruption handlers that flush and snapshot state, then restore within 5ms upon return.
              </p>
            </div>
            <Link
              to="/architecture"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Read architecture notes →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 20: Footer / Closing (§20) */}
      <footer className="w-full bg-primary text-[#F4F1EB] pt-16 pb-8 px-4 sm:px-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: CTA */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <h2 className="text-2xl sm:text-3xl font-display font-medium leading-tight">
                If your product depends on time, it should depend on the right clock.
              </h2>
              <p className="text-xs sm:text-sm text-[#F4F1EB]/80 max-w-md leading-relaxed">
                Ready to de-risk your mobile audio timeline with a fixed-price PoC? Let's discuss framework choices and milestone schedule.
              </p>
              <div className="pt-2">
                <a href="mailto:hello@example.com?subject=Music%20App%20Timing%20PoC">
                  <Button variant="inverted" size="lg">
                    Start the conversation
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Links */}
            <div className="md:col-span-5 flex flex-col gap-3 text-xs font-ui">
              <div className="font-semibold uppercase tracking-wider text-accent-soft text-[11px]">
                Navigation
              </div>
              <Link to="/studio/harbour-light" className="hover:underline">
                Live Studio Demo
              </Link>
              <Link to="/studio" className="hover:underline">
                Projects Library & Import
              </Link>
              <Link to="/architecture" className="hover:underline">
                Architecture & Platform Mapping
              </Link>
              <Link to="/proposal" className="hover:underline">
                Milestones & Fixed-Price Proposal
              </Link>

              <div className="text-[11px] text-[#F4F1EB]/60 mt-4 leading-relaxed">
                Built as a working proof of concept in a focused sprint. Production codebase uses AVAudioEngine on iOS and Media3/AudioTrack on Android.
              </div>
            </div>
          </div>

          {/* Bottom Row with Metronome Signature (§20) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#F4F1EB]/20 text-[11px] font-ui text-[#F4F1EB]/70">
            <div>
              © {new Date().getFullYear()} Metre · Audio generated in your browser. Nothing is uploaded.
            </div>

            {/* Tiny animated 4-tick metronome signature */}
            <div
              className="flex items-center gap-1.5 font-mono text-[10px]"
              title="Master clock pulse (96 BPM)"
            >
              <span>Clock:</span>
              {[1, 2, 3, 4].map((t) => (
                <span
                  key={t}
                  className="w-1.5 h-1.5 rounded-full bg-[#F4F1EB]/30 animate-pulse"
                  style={{ animationDuration: '0.625s' }}
                />
              ))}
              <span>96 BPM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
