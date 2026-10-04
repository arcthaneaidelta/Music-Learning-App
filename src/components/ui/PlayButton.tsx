import React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying,
  isLoading = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={`relative w-16 h-16 rounded-full bg-primary text-[#FBF9F5] shadow-1 flex items-center justify-center transition-transform duration-150 ease-out-quint hover:scale-[1.03] active:scale-[0.96] disabled:opacity-50 select-none cursor-pointer ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-7 h-7 animate-spin stroke-[2]" />
      ) : (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Play
            className={`w-6 h-6 fill-current transition-opacity duration-150 absolute translate-x-0.5 ${
              isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
          <Pause
            className={`w-6 h-6 fill-current transition-opacity duration-150 absolute ${
              isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        </div>
      )}
    </button>
  );
};
