import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-sheet flex items-end md:items-stretch md:justify-end"
    >
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-ink/30 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer / Bottom sheet */}
      <div
        className={`relative z-10 w-full ${width} bg-surface-elevated border-t md:border-t-0 md:border-l border-border rounded-t-lg md:rounded-none shadow-3 max-h-[85vh] md:max-h-full flex flex-col transition-transform duration-280 ease-out-quint`}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto my-3 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-lg font-medium font-display text-ink tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs font-ui text-ink-3 mt-0.5">{subtitle}</p>
            )}
          </div>
          <IconButton
            icon={<X className="w-5 h-5" />}
            label="Close sheet"
            size="sm"
            onClick={onClose}
          />
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
