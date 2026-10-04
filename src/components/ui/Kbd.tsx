import React from 'react';

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-mono font-medium text-ink-2 bg-surface-sunken border border-border-strong rounded-sm shadow-1 ${className}`}
    >
      {children}
    </kbd>
  );
};
