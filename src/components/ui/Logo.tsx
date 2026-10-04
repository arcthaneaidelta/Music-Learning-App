import React from 'react';

interface LogoProps {
  markOnly?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ markOnly = false, className = '', size = 'md' }) => {
  const height = size === 'sm' ? 22 : size === 'lg' ? 34 : 26;

  if (markOnly) {
    return (
      <svg
        viewBox="0 0 32 32"
        height={height}
        width={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block align-middle ${className}`}
        aria-label="Metre logo mark"
      >
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.2" className="text-ink" />
        <line x1="16" y1="4" x2="16" y2="28" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 105 32"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Metre logo"
      >
        {/* Fraunces-styled typographic wordmark "metre" */}
        <text
          x="0"
          y="23"
          fontFamily="var(--font-display)"
          fontSize="26"
          fontWeight="500"
          fill="currentColor"
          className="text-ink"
          letterSpacing="-0.02em"
        >
          metre
        </text>
        {/* Terracotta playhead needle right beside wordmark */}
        <line
          x1="88"
          y1="4"
          x2="88"
          y2="28"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Subtle playhead needle triangle tip */}
        <polygon
          points="85,4 91,4 88,9"
          fill="var(--accent)"
        />
      </svg>
    </div>
  );
};
