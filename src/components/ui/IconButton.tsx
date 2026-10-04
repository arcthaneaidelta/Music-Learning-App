import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  isToggled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, isToggled = false, size = 'md', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-11 h-11 text-sm min-w-[44px] min-h-[44px]',
      lg: 'w-12 h-12 text-base min-w-[48px] min-h-[48px]',
    }[size];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center rounded-md transition-all duration-150 ease-out-quint select-none cursor-pointer active:scale-[0.94] ${
          isToggled
            ? 'bg-primary text-[#FBF9F5]'
            : 'text-ink-2 hover:text-ink hover:bg-surface-sunken'
        } ${sizeClasses} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
