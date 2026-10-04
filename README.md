# Metre — Interactive Proof-of-Concept Demo
### *The audio is the clock. Everything else follows.*

A high-fidelity working synchronization proof built to accompany a bid for **Senior Mobile Audio Developer for Music Learning App**.

---

## 1. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests verifying pure clock derivations and math
npm test

# 3. Start local development server
npm run dev

# 4. Build production bundle and verify budgets
npm run build
```

The application is served at `http://localhost:5173/`.

---

## 2. Real vs. Mocked Architecture

| Capability | Status | Implementation Detail |
|---|---|---|
| **Master Clock Authority** | **Real** | Pure mathematical model derived on-demand from `AudioContext.getOutputTimestamp().contextTime` (with latency compensation). Zero UI timers. |
| **Musical Counts (Bars/Beats)** | **Real** | Derived from song position via `BeatMap`. Counts update at 60fps with zero React re-renders. |
| **Audio Synthesis** | **Real** | Pre-composed 80-second 32-bar sample track ("Harbour Light") synthesized in-browser via `OfflineAudioContext` (kick, snare, hats, bass, pads, arps). |
| **Local Audio Import** | **Real** | Decodes MP3, WAV, and M4A client-side via `decodeAudioData`. Cached as Blobs in IndexedDB. |
| **Seamless Looping** | **Real** | Hardware buffer wrapping via `AudioBufferSourceNode.loop` with pass counter. Zero audible clicks, zero drift over 100+ passes. |
| **Timeline Scrubbing** | **Real** | 60fps pointer tracking with 90ms grain audio synthesis (`ScrubGrainPlayer`). |
| **Variable Speed (50%–125%)** | **Real** | Dynamic `playbackRate` with instant clock re-anchoring (`Δ < 1e-9` mathematical continuity). |
| **Persistence & App Kill** | **Real** | IndexedDB storage (`metre-db`). "Simulate App Kill" reloads page and restores millisecond position, loop, and speed. |
| **Click-Track & Drift Meter** | **Real** | 25ms look-ahead click scheduler with +30ms offset test. Live canvas drift measurement graph. |
| **Accounts / Cloud Sync** | **Mocked / Absent** | Intentionally omitted per client brief. All data stays local to the device. |

---

## 3. Key Pages & Routes

- `/`: Landing page with live **Living Score** interactive scrolling waveform strip, architectural scroll story, 10 deliverables checklist, and transparent edge-case breakdown.
- `/studio`: Projects library and local audio file drag-and-drop import zone.
- `/studio/harbour-light`: The core Proof-of-Concept Studio (mobile-first 430px device container with desktop live Clock Inspector).
- `/architecture`: Interactive Master Clock mathematical derivation simulator, iOS/Android native platform mapping table, and technical risk register.
- `/proposal`: Fixed-price milestone proposal beginning with the required phrase `MASTER AUDIO CLOCK`.
- `/404`: Custom musical 404 page ("That bar doesn't exist").

---

## 4. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause audio |
| `M` | Drop timestamped marker on the beat |
| `L` | Toggle / clear loop |
| `[` / `]` | Step playback speed ±5% |
| `←` / `→` | Step ±1 beat |
| `Shift` + `←` / `→` | Step ±1 bar |
| `S` | Cycle snap mode (Bar → Beat → Off) |
| `C` | Toggle metronome click track |
| `?` | Open keyboard shortcuts help modal |

---

## 5. Architectural Proof: Zero Re-Render Loop

In `src/audio/ClockTicker.ts`, a single central `requestAnimationFrame` loop queries `AudioEngine.getInstance().getNow()`. Registered components (playhead transform, count numerals, timecode text) mutate DOM properties directly. React state changes are reserved exclusively for discrete events (play/pause toggle, marker created, section crossed).
