import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unit = '',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs font-ui text-ink-2">
          <span>{label}</span>
          <span className="font-mono tabular-nums text-ink">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-8 w-full touch-none select-none">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-surface-sunken rounded-full appearance-none cursor-pointer accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            background: `linear-gradient(to right, var(--primary) ${percentage}%, var(--surface-sunken) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
};
