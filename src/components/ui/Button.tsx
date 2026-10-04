import React from 'react';
import { Loader2, Check } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverted';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isSuccess = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
      md: 'h-10 px-4 text-sm gap-2 rounded-md',
      lg: 'h-12 px-6 text-base gap-2.5 rounded-md',
    }[size];

    const variantClasses = {
      primary:
        'bg-primary text-[#FBF9F5] hover:bg-primary-hover active:bg-primary-active border border-transparent active:scale-[0.98]',
      secondary:
        'bg-transparent text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken/80 active:scale-[0.98]',
      ghost:
        'bg-transparent text-ink-2 hover:text-ink hover:bg-surface-sunken/60 active:scale-[0.98]',
      danger:
        'bg-error text-white hover:bg-red-700 active:bg-red-800 active:scale-[0.98]',
      inverted:
        'bg-[#F4F1EB] text-primary hover:bg-white active:bg-surface-elevated active:scale-[0.98]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium font-ui transition-all duration-150 ease-out-quint cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin stroke-[2]" />
        ) : isSuccess ? (
          <Check className="w-4 h-4 stroke-[2.5] text-success" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && !isSuccess && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
