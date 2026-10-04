import React from 'react';

export interface ChipProps {
  label: string;
  isActive?: boolean;
  color?: string; // Optional custom dot color (for regions)
  onClick?: () => void;
  onDoubleClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  isActive = false,
  color,
  onClick,
  onDoubleClick,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-xs';

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`inline-flex items-center gap-1.5 rounded-sm border font-medium font-ui transition-all duration-150 ease-out-quint cursor-pointer select-none active:scale-[0.97] whitespace-nowrap ${
        isActive
          ? 'bg-primary text-[#FBF9F5] border-primary'
          : 'bg-surface text-ink border-border hover:bg-surface-sunken hover:border-border-strong'
      } ${sizeClasses} ${className}`}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full inline-block shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
    </button>
  );
};
