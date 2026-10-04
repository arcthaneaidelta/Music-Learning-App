import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const ProposalPage: React.FC = () => {
  const deliverables = [
    { num: '01', title: 'Local Audio Import & Decode', desc: 'Robust decoding of MP3, WAV, M4A with memory budgeting.' },
    { num: '02', title: 'Glitch-Free Transport & Seeking', desc: 'Instant seek with zero audible click, pop, or dropped frames.' },
    { num: '03', title: 'Timestamped Markers', desc: 'Sample-locked markers with beat snapping, drag nudging, and persistent storage.' },
    { num: '04', title: 'Synchronized Musical Counts', desc: 'Dynamic Bar & Beat derivations driven directly by hardware audio clocks.' },
    { num: '05', title: 'Structural Song Regions', desc: 'Definition, editing, and immediate seek navigation across sections.' },
    { num: '06', title: 'Sample-Accurate Looping', desc: 'Hardware buffer loops with pass counting and zero drift over hundreds of cycles.' },
    { num: '07', title: 'Bidirectional Scrub with Sync', desc: 'Pointer-tracked scrubbing with live counts and grain feedback.' },
    { num: '08', title: 'Variable Playback Speed', desc: 'Dynamic 50%–125% speed adjustments with preserved clock continuity.' },
    { num: '09', title: 'Saved Timeline & Beat Maps', desc: 'Structured, versioned JSON schema (.metre.json) for project interchange.' },
    { num: '10', title: 'Exact Kill & Restore Proof', desc: 'Instant state reconstruction to the millisecond upon app cold restart.' },
  ];

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
            className="text-ink-2 hover:text-ink transition-colors"
          >
            Architecture
          </Link>
          <Link
            to="/proposal"
            className="text-primary font-semibold underline underline-offset-4"
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

      {/* Main Proposal Body */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">
        {/* Bid Headline & Read Confirmation */}
        <div className="p-6 bg-surface border border-border rounded-lg shadow-1 flex flex-col gap-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
            Bid Submission & Implementation Strategy
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-ink">
            MASTER AUDIO CLOCK.
          </h1>
          <p className="text-sm font-ui text-ink-2 leading-relaxed">
            I have carefully reviewed your complete specification for the mobile music learning app. The core technical risk is not UI styling; it is establishing a single master audio clock that keeps visual counts, loops, markers, and waveforms permanently locked without cumulative drift. The demo you are testing right now is a living functional proof of that exact architecture.
          </p>
        </div>

        {/* Scope: 10 PoC Deliverables */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-medium text-ink">
              Proof-of-Concept Scope (10 Deliverables)
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-success/15 text-success font-semibold">
              10/10 Working in Demo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliverables.map((d) => (
              <div
                key={d.num}
                className="p-4 bg-surface rounded-md border border-border flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono text-ink-3">{d.num}</div>
                  <h3 className="text-sm font-semibold font-ui text-ink mt-0.5">
                    {d.title}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1 leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Milestones & Timeline */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-medium text-ink">
              Milestone Timeline
            </h2>
          </div>

          <div className="border-l-2 border-border-strong pl-4 sm:pl-6 ml-2 sm:ml-4 space-y-6 text-xs sm:text-sm font-ui">
            <div className="relative">
              <span className="absolute -left-[25px] sm:-left-[33px] top-1 w-3 h-3 rounded-full bg-primary" />
              <div className="font-mono text-xs text-primary font-semibold">Days 0–1</div>
              <h4 className="font-semibold text-ink mt-0.5">Spike & Platform Alignment</h4>
              <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                Confirm framework stack (React Native + native C++/Swift/Kotlin audio module vs. fully native Swift/Kotlin) and validate latency constraints on real target hardware.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[25px] sm:-left-[33px] top-1 w-3 h-3 rounded-full bg-border-strong" />
              <div className="font-mono text-xs text-primary font-semibold">Days 2–4</div>
              <h4 className="font-semibold text-ink mt-0.5">Core Engine & Master Clock</h4>
              <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                Implement native audio graph (`AVAudioEngine` / `AudioTrack`), tempo map maths, downbeat calibration, and sub-frame derived visual callbacks.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[25px] sm:-left-[33px] top-1 w-3 h-3 rounded-full bg-border-strong" />
              <div className="font-mono text-xs text-primary font-semibold">Days 5–6</div>
              <h4 className="font-semibold text-ink mt-0.5">Loops, Scrubbing & Speed Control</h4>
              <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                Hardware-aligned seamless looping, pitch-preserved time-stretching, and smooth bidirectional timeline scrubbing.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[25px] sm:-left-[33px] top-1 w-3 h-3 rounded-full bg-border-strong" />
              <div className="font-mono text-xs text-primary font-semibold">Days 7–8</div>
              <h4 className="font-semibold text-ink mt-0.5">Persistence & Handover Build</h4>
              <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                Local persistence layer, schema validation, TestFlight / Android APK build, test reports, and engineering walkthrough.
              </p>
            </div>
          </div>
        </section>

        {/* Deliverables & Out of Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-5 bg-surface rounded-lg border border-border">
            <h4 className="text-sm font-semibold font-ui text-ink flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-success" />
              <span>Included in PoC Package</span>
            </h4>
            <ul className="text-xs text-ink-2 space-y-1.5 list-disc pl-4">
              <li>Full native source code repository with clean commits</li>
              <li>Compilable TestFlight build (iOS) and APK build (Android)</li>
              <li>Architecture documentation & timing model guide</li>
              <li>Unit test suite verifying clock derivations and wrap math</li>
              <li>Handover call and Q&A session</li>
            </ul>
          </div>

          <div className="p-5 bg-surface-sunken rounded-lg border border-border">
            <h4 className="text-sm font-semibold font-ui text-ink flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Explicitly Out of PoC Scope</span>
            </h4>
            <ul className="text-xs text-ink-3 space-y-1.5 list-disc pl-4">
              <li>Backend accounts, social login & cloud synchronization</li>
              <li>Payment gateways & subscription billing</li>
              <li>Commercial music catalogue licensing</li>
              <li>MIDI hardware input / Bluetooth LE peripheral scanning</li>
              <li>Automatic machine learning tempo / stem separation</li>
            </ul>
          </div>
        </div>

        {/* Fixed Price Block & About Me */}
        <div className="p-6 bg-primary text-[#F4F1EB] rounded-lg shadow-2 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-accent-soft">
              Fixed Price Milestone
            </div>
            <div className="text-3xl font-display font-medium mt-1">
              $[ENTER FIXED PRICE]
            </div>
            <div className="text-xs text-[#F4F1EB]/80 mt-1">
              Guaranteed fixed price within your $1,500 ceiling. Delivery in 8 days.
            </div>
          </div>

          <a
            href="mailto:hello@example.com?subject=Senior%20Mobile%20Audio%20Developer%20PoC"
            className="shrink-0"
          >
            <Button
              variant="inverted"
              size="lg"
              leftIcon={<Mail className="w-4 h-4" />}
            >
              Start the conversation
            </Button>
          </a>
        </div>
      </main>
    </div>
  );
};
