import React from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedProps<T>) {
  const containerClasses = size === 'sm' ? 'p-0.5 rounded-sm text-xs' : 'p-1 rounded-md text-xs';
  const itemClasses = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <div
      role="group"
      className={`inline-flex items-center bg-surface-sunken border border-border ${containerClasses} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`font-medium transition-all duration-150 rounded-sm select-none cursor-pointer ${itemClasses} ${
              isSelected
                ? 'bg-surface text-ink font-semibold shadow-1'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
