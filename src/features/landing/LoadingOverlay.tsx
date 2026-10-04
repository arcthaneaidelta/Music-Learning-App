import React, { useState, useEffect } from 'react';
import { Logo } from '../../components/ui/Logo';

interface LoadingOverlayProps {
  onComplete: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);

  useEffect(() => {
    // Check if already shown in this session
    const seen = sessionStorage.getItem('metre_loader_seen');
    if (seen) {
      onComplete();
      return;
    }

    sessionStorage.setItem('metre_loader_seen', 'true');

    // Sequence: 4 beat ticks over 750ms
    const beatInterval = 750 / 4;
    const t1 = setTimeout(() => setActiveBeat(1), 150);
    const t2 = setTimeout(() => setActiveBeat(2), 150 + beatInterval);
    const t3 = setTimeout(() => setActiveBeat(3), 150 + beatInterval * 2);
    const t4 = setTimeout(() => setActiveBeat(4), 150 + beatInterval * 3);

    // Exit sequence starts at 900ms
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        onComplete();
      }, 400); // 400ms slide-up transition
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  // Click or keydown skips instantly
  const handleSkip = () => {
    setExiting(true);
    setTimeout(onComplete, 150);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-loader bg-bg flex flex-col items-center justify-center transition-all duration-400 ease-out-quint cursor-pointer select-none ${
        exiting ? '-translate-y-full opacity-90' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Wordmark */}
        <div className="animate-in fade-in zoom-in-95 duration-250">
          <Logo size="lg" />
        </div>

        {/* 120px hairline with terracotta playhead and 4 beat tick dots */}
        <div className="relative w-32 h-6 flex items-center justify-center">
          {/* Base Hairline */}
          <div className="w-full h-px bg-border-strong relative">
            {/* 4 tiny tick marks */}
            {[0, 1, 2, 3].map((b) => (
              <span
                key={b}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                  activeBeat > b ? 'bg-ink' : 'bg-border-strong'
                }`}
                style={{ left: `${(b / 3) * 100}%` }}
              />
            ))}

            {/* Terracotta traveling playhead */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 bg-accent rounded-sm shadow-1 transition-all duration-750 ease-in-out-travel -ml-1"
              style={{
                left: `${Math.min(100, Math.max(0, (activeBeat / 4) * 100))}%`,
              }}
            />
          </div>
        </div>

        <span className="text-[11px] font-ui text-ink-3">
          Tuning the master clock... (Tap to skip)
        </span>
      </div>
    </div>
  );
};
