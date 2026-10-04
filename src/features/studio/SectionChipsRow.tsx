import React from 'react';
import { useProjectStore } from '../../state/projectStore';
import { Chip } from '../../components/ui/Chip';
import { Repeat } from 'lucide-react';

export const SectionChipsRow: React.FC = () => {
  const { project, currentSection, loop, jumpToRegion, loopRegion } = useProjectStore();

  return (
    <div className="w-full px-3 py-2 bg-surface border-b border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mr-1 shrink-0">
        Sections:
      </span>
      {project.regions.map((region) => {
        const isCurrent = currentSection?.id === region.id;
        const isRegionLooped =
          loop &&
          Math.abs(loop.a - region.start) < 0.1 &&
          Math.abs(loop.b - region.end) < 0.1;

        return (
          <div key={region.id} className="relative group shrink-0 flex items-center">
            <Chip
              label={region.name}
              color={region.color}
              isActive={isCurrent}
              onClick={() => jumpToRegion(region.id)}
              onDoubleClick={() => loopRegion(region.id)}
              size="sm"
            />
            {/* Quick loop button on chip hover or active */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loopRegion(region.id);
              }}
              title={`Loop ${region.name}`}
              className={`ml-0.5 p-1 rounded-sm text-xs transition-opacity ${
                isRegionLooped
                  ? 'text-accent opacity-100 bg-accent-soft'
                  : 'text-ink-3 opacity-0 group-hover:opacity-100 hover:text-ink'
              }`}
            >
              <Repeat className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
