import React, { useEffect, useRef } from 'react';
import { ClockTicker } from '../../audio/ClockTicker';
import { formatTime } from '../../lib/format';
import { useProjectStore } from '../../state/projectStore';
import { BeatPosition } from '../../audio/BeatMap';
import { ClockSnapshot } from '../../audio/MasterClock';
import { Region } from '../../persistence/schema';

export const CountStage: React.FC = () => {
  const { currentSection, loop } = useProjectStore();
  const ticker = ClockTicker.getInstance();

  const beatNumberRef = useRef<HTMLDivElement>(null);
  const infoTextRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const passCounterRef = useRef<HTMLSpanElement>(null);
  const sectionChipRef = useRef<HTMLSpanElement>(null);

  const lastBeatRef = useRef<number>(-1);
  const lastPassRef = useRef<number>(-1);

  useEffect(() => {
    const unsubscribe = ticker.subscribe(
      (songPos: number, beatPos: BeatPosition, snapshot: ClockSnapshot) => {
        // 1. Update huge beat numeral (only pulse and change when beat changes)
        if (beatNumberRef.current && lastBeatRef.current !== beatPos.beat) {
          lastBeatRef.current = beatPos.beat;
          if (beatPos.inCountIn) {
            beatNumberRef.current.textContent = '·';
            beatNumberRef.current.style.color = 'var(--ink-3)';
          } else {
            beatNumberRef.current.textContent = beatPos.beat.toString();
            beatNumberRef.current.style.color =
              beatPos.beat === 1 ? 'var(--accent)' : 'var(--ink)';

            // Trigger scale pulse
            beatNumberRef.current.classList.remove('animate-beat-pulse');
            // Force reflow
            void beatNumberRef.current.offsetWidth;
            beatNumberRef.current.classList.add('animate-beat-pulse');
          }
        }

        // 2. Update info text: "Bar 12 · Beat 3 · 00:28.74 / 01:20.00"
        if (infoTextRef.current) {
          const timeFormatted = formatTime(songPos, true);
          const durationFormatted = formatTime(snapshot.duration, false);
          const barBeatText = beatPos.inCountIn
            ? `Count-in · ${timeFormatted}`
            : `Bar ${beatPos.bar} · Beat ${beatPos.beat} · ${timeFormatted} / ${durationFormatted}`;
          infoTextRef.current.textContent = barBeatText;
        }

        // 3. Update 4 beat dots
        if (dotsRef.current) {
          const dots = dotsRef.current.children;
          for (let i = 0; i < dots.length; i++) {
            const dot = dots[i] as HTMLElement;
            const isCurrent = !beatPos.inCountIn && beatPos.beat === i + 1;
            if (isCurrent) {
              dot.style.backgroundColor =
                i === 0 ? 'var(--accent)' : 'var(--primary)';
              dot.style.transform = 'scale(1.25)';
            } else {
              dot.style.backgroundColor = 'var(--border-strong)';
              dot.style.transform = 'scale(1)';
            }
          }
        }

        // 4. Update pass counter when looping
        if (passCounterRef.current) {
          if (snapshot.loop && snapshot.loopPass > 0) {
            if (lastPassRef.current !== snapshot.loopPass) {
              lastPassRef.current = snapshot.loopPass;
              passCounterRef.current.textContent = `Pass ${snapshot.loopPass}`;
            }
            passCounterRef.current.style.display = 'inline-flex';
          } else {
            passCounterRef.current.style.display = 'none';
          }
        }

        // 5. Update section name if playhead entered new region
        const storeState = useProjectStore.getState();
        const regions = storeState.project.regions;
        const foundSection = regions.find(
          (r: Region) => songPos >= r.start && songPos < r.end
        );
        if (foundSection && foundSection.id !== storeState.currentSection?.id) {
          useProjectStore.setState({ currentSection: foundSection });
        }
      }
    );

    return () => unsubscribe();
  }, [ticker]);

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-surface border-b border-border select-none">
      {/* Top row: Section chip (left) & Loop Pass (right) */}
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <span
          ref={sectionChipRef}
          className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-sm border"
          style={{
            borderColor: currentSection?.color || 'var(--border)',
            backgroundColor: `${currentSection?.color || 'var(--border)'}26`,
            color: 'var(--ink)',
          }}
        >
          {currentSection ? currentSection.name : 'Track'}
        </span>

        <span
          ref={passCounterRef}
          style={{ display: loop ? 'inline-flex' : 'none' }}
          className="text-xs font-mono font-medium px-2 py-0.5 rounded-sm bg-accent-soft text-accent border border-accent/20"
        >
          Pass 1
        </span>
      </div>

      {/* Giant Mono Count Numeral */}
      <div
        ref={beatNumberRef}
        aria-hidden="true"
        className="font-mono text-7xl sm:text-8xl md:text-9xl font-semibold tracking-tighter leading-none my-1 select-none transition-colors duration-100"
      >
        1
      </div>

      {/* Four beat indicator dots */}
      <div ref={dotsRef} className="flex items-center gap-2.5 my-2">
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className="w-2.5 h-2.5 rounded-full bg-border-strong transition-all duration-120"
          />
        ))}
      </div>

      {/* Bar · Beat · Timecode */}
      <div
        ref={infoTextRef}
        className="text-xs sm:text-sm font-mono font-medium text-ink-2 tabular-nums mt-1"
      >
        Bar 1 · Beat 1 · 00:00.00 / 01:20.00
      </div>
    </div>
  );
};
